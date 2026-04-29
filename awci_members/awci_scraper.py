#!/usr/bin/env python3
"""
AWCI Member Directory Scraper
==============================
Scrapes all members from https://awci.my.site.com/portal/s/searchdirectory?id=a2n8W000002uXpI

Uses Playwright to:
1. Load the Salesforce Experience Cloud page
2. Intercept Aura/LWC API calls to discover endpoints & context
3. Paginate through all directory pages via the API
4. Visit each member detail page via the API
5. Output clean JSON + CSV files

Requirements:
    pip install playwright
    playwright install chromium
"""

import asyncio
import json
import csv
import re
import time
import logging
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlencode, quote

from playwright.async_api import async_playwright, Page, Request, Response

# ─── Configuration ───────────────────────────────────────────────────────────
BASE_URL    = "https://awci.my.site.com"
PORTAL_PATH = "/portal/s/searchdirectory?id=a2n8W000002uXpI"
PAGE_SIZE   = 12          # members per page (adjust if needed)
DELAY_MS    = 500         # polite delay between API calls (ms)
MAX_PAGES   = 1000        # safety guard
OUTPUT_DIR  = Path("awci_output")
LOG_LEVEL   = logging.INFO

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

REQUIRED_CSV_FIELDS = [
    "extra_Membership_Type__c",
    "extra_FON_Your_Business__c",
    "name",
    "phone",
    "xtra_OrderApi__Account_Email__c",
    "website",
    "extra_BillingStreet",
    "extra_BillingCity",
    "extra_BillingState",
    "extra_BillingPostalCode",
    "extra_BillingCountry",
    "extra_BillingStateCode",
    "extra_BillingCountryCode",
]

ALLOWED_BUSINESS_TYPES = {
    "Subcontractor",
    "General Interest",
    "Other",
    "General Contractor",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def flatten(record: dict, prefix: str = "") -> dict:
    """Recursively flatten a nested dict."""
    out = {}
    for k, v in record.items():
        key = f"{prefix}{k}" if not prefix else f"{prefix}_{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key))
        elif isinstance(v, list):
            out[key] = "; ".join(str(i) for i in v)
        else:
            out[key] = v
    return out


def safe_str(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def append_and_condition_to_soql(base_query: str, condition: str) -> str:
    """Append an AND condition to an existing SOQL query that already has WHERE."""
    marker = " WHERE "
    idx = base_query.upper().find(marker)
    if idx == -1:
        return f"{base_query} WHERE ({condition})"
    return f"{base_query} AND ({condition})"


# ─── Network Interceptor ──────────────────────────────────────────────────────

class AuraInterceptor:
    """
    Captures the first Aura POST from the page, extracts:
      - aura.context  (JSON blob)
      - aura.token
      - action descriptor patterns
    so we can replicate calls programmatically.
    """

    def __init__(self):
        self.aura_context: Optional[str] = None
        self.aura_token: Optional[str]   = None
        self.aura_url:   Optional[str]   = None
        self.raw_responses: list[dict]   = []
        self.initial_fetch_params: Optional[dict] = None
        self.initial_apply_params: Optional[dict] = None
        self._event = asyncio.Event()

    def on_request(self, request: Request):
        if "sfsites/aura" in request.url and request.method == "POST":
            if self.aura_url is None:
                self.aura_url = request.url
                log.debug("Captured Aura URL: %s", self.aura_url)
            body = request.post_data or ""
            # Parse URL-encoded params
            params = {}
            for part in body.split("&"):
                if "=" in part:
                    k, _, v = part.partition("=")
                    from urllib.parse import unquote_plus
                    params[k] = unquote_plus(v)
            if "aura.context" in params and self.aura_context is None:
                self.aura_context = params["aura.context"]
                self.aura_token   = params.get("aura.token", "null")
                log.info("✓ Captured Aura context + token")
                self._event.set()
            try:
                message = json.loads(params.get("message", "{}"))
            except Exception:
                message = {}
            for action in message.get("actions", []):
                if action.get("descriptor") == "apex://DRCTS.TableViewController/ACTION$fetchPaginationRecs":
                    self.initial_fetch_params = action.get("params") or {}
                if action.get("descriptor") == "apex://DRCTS.SearchDirectoriesController/ACTION$applyFilters":
                    self.initial_apply_params = action.get("params") or {}

    async def wait_for_context(self, timeout: float = 30.0):
        await asyncio.wait_for(self._event.wait(), timeout=timeout)


# ─── Aura API Client ──────────────────────────────────────────────────────────

class AuraClient:
    """
    Thin HTTP client that posts to the Salesforce Aura endpoint.
    Reuses the captured context/token so every call looks like a
    legitimate in-browser request.
    """

    def __init__(self, page: Page, interceptor: AuraInterceptor):
        self.page        = page
        self.interceptor = interceptor
        self._action_id  = 1

    def _next_id(self) -> str:
        aid = f"{self._action_id};a"
        self._action_id += 1
        return aid

    async def call(
        self,
        descriptor:   str,
        params:       dict,
        page_uri:     str = PORTAL_PATH,
    ) -> Any:
        """Post a single Aura action and return the parsed response value."""
        action = {
            "id":                 self._next_id(),
            "descriptor":         descriptor,
            "callingDescriptor":  "UNKNOWN",
            "params":             params,
        }
        message = json.dumps({"actions": [action]})

        body = urlencode(
            {
                "message":       message,
                "aura.context":  self.interceptor.aura_context,
                "aura.pageURI":  page_uri,
                "aura.token":    self.interceptor.aura_token,
            }
        )

        headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept":       "application/json, text/javascript, */*; q=0.01",
            "X-SFDC-Page-Scope-Id":   "",
            "X-Requested-With":       "XMLHttpRequest",
        }

        js = f"""
        async () => {{
            const resp = await fetch("{self.interceptor.aura_url}", {{
                method:  "POST",
                headers: {json.dumps(headers)},
                body:    {json.dumps(body)},
                credentials: "include",
            }});
            const text = await resp.text();
            return text;
        }}
        """
        raw = await self.page.evaluate(js)

        # Salesforce prepends "while(1);" to prevent JSON hijacking
        raw = re.sub(r"^while\s*\(\s*1\s*\)\s*;?\s*", "", raw.strip())

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            log.error("JSON decode failed. Raw (first 500): %s", raw[:500])
            raise exc

        # Navigate into the action response
        actions = data.get("actions") or []
        if not actions:
            log.warning("No actions in response. Keys: %s", list(data.keys()))
            return None

        result = actions[0]
        state  = result.get("state")
        if state != "SUCCESS":
            log.warning("Action state=%s  error=%s", state, result.get("error"))
            return None
        rv = result.get("returnValue")
        if isinstance(rv, str):
            text = rv.strip()
            if text.startswith("{") or text.startswith("["):
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    pass
        return rv


# ─── Scraping Logic ───────────────────────────────────────────────────────────

async def trigger_directory_load(page: Page):
    """Click/type in the search form to force the first Aura call."""
    await page.wait_for_load_state("networkidle", timeout=30_000)
    # Some portals auto-load on page visit; others need a submit trigger
    try:
        btn = page.locator("button[type=submit], button:has-text('Search'), input[type=submit]").first
        if await btn.is_visible(timeout=3000):
            await btn.click()
            await page.wait_for_load_state("networkidle", timeout=20_000)
    except Exception:
        pass


# ─── Main Orchestrator ────────────────────────────────────────────────────────

async def scrape_directory() -> list[dict]:
    """
    Full pipeline:
      1. Boot Playwright + Chromium (headless)
      2. Navigate to the search directory
      3. Capture Aura context via network interception
      4. Discover the search / member-detail action descriptors
      5. Paginate through all members
      6. Fetch each member's detail record
      7. Return list of clean member dicts
    """
    members: list[dict] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        interceptor = AuraInterceptor()
        page.on("request", interceptor.on_request)

        # ── Step 1: Navigate ──────────────────────────────────────────────
        log.info("Navigating to %s%s …", BASE_URL, PORTAL_PATH)
        await page.goto(BASE_URL + PORTAL_PATH, wait_until="domcontentloaded", timeout=60_000)

        await trigger_directory_load(page)

        # ── Step 2: Capture Aura context ──────────────────────────────────
        try:
            await interceptor.wait_for_context(timeout=45.0)
        except asyncio.TimeoutError:
            log.error(
                "Timed out waiting for Aura context.\n"
                "The directory may require login.\n"
                "Try running with headless=False and manually logging in,\n"
                "then re-running the script."
            )
            await browser.close()
            return members

        # ── Step 3: Capture live fetch params and paginate deterministically ─
        SEARCH_DESCRIPTOR = "apex://DRCTS.TableViewController/ACTION$fetchPaginationRecs"
        APPLY_DESCRIPTOR = "apex://DRCTS.SearchDirectoriesController/ACTION$applyFilters"
        DETAIL_DESCRIPTOR = ""

        if not interceptor.initial_fetch_params:
            log.error("Could not capture initial directory fetch params.")
            await browser.close()
            return members

        params = dict(interceptor.initial_fetch_params)
        client = AuraClient(page, interceptor)

        # Build server-side filtered ID set first (matches site behavior).
        apply_params = dict(interceptor.initial_apply_params or {})
        if apply_params:
            business_values = sorted(ALLOWED_BUSINESS_TYPES)
            soql_values = ",".join("'" + v.replace("'", "\\'") + "'" for v in business_values)
            business_condition = f"FON_Your_Business__c IN ({soql_values})"
            base_query = safe_str(apply_params.get("baseQueryWhereClause"))
            if base_query:
                apply_params["baseQueryWhereClause"] = append_and_condition_to_soql(base_query, business_condition)
            # Keep all rows in the server-side filtered set.
            apply_params["pageSize"] = 2000
            rv_apply = await client.call(APPLY_DESCRIPTOR, apply_params)
            if isinstance(rv_apply, dict) and isinstance(rv_apply.get("sObjIds"), list):
                params["sObjIds"] = rv_apply.get("sObjIds", [])
                params["filterWhereClause"] = rv_apply.get("filterWhereClause")
                log.info("Server-side filter applied: %d IDs", len(params["sObjIds"]))
            else:
                log.warning("applyFilters did not return filtered IDs; continuing with captured params.")
        else:
            log.warning("No applyFilters params captured; continuing with captured fetch params.")

        page_size = int(params.get("pageSize") or 50)
        log.info("Paginating directory records until exhaustion (pageSize=%d) …", page_size)

        all_raw: list[dict] = []
        page_num = 1
        while page_num <= MAX_PAGES:
            req_params = dict(params)
            req_params["pageNumber"] = page_num
            req_params["pageSize"] = page_size
            rv = await client.call(SEARCH_DESCRIPTOR, req_params)
            await asyncio.sleep(DELAY_MS / 1000)
            if not rv:
                log.info("Reached end of pagination at page %d (empty response).", page_num)
                break
            page_records = rv if isinstance(rv, list) else []
            if not page_records:
                log.info("Reached end of pagination at page %d (no records).", page_num)
                break
            all_raw.extend(page_records)
            if page_num % 10 == 0:
                log.info("  Progress: page %d  records=%d", page_num, len(all_raw))
            page_num += 1
        if page_num > MAX_PAGES:
            log.warning("Stopped at MAX_PAGES=%d safety limit.", MAX_PAGES)

        # Deduplicate in case the backend returns overlapping pages.
        deduped_raw: list[dict] = []
        seen_ids: set[str] = set()
        for rec in all_raw:
            rec_id = safe_str(rec.get("Id") or rec.get("id") or rec.get("recordId"))
            if rec_id and rec_id in seen_ids:
                continue
            if rec_id:
                seen_ids.add(rec_id)
            deduped_raw.append(rec)
        all_raw = deduped_raw

        log.info("Total raw records collected: %d", len(all_raw))

        # ── Step 7: Fetch detail records ─────────────────────────────────
        if DETAIL_DESCRIPTOR:
            log.info("Fetching individual member detail pages …")
            enriched: list[dict] = []
            for i, raw_member in enumerate(all_raw):
                member_id = (
                    raw_member.get("id")
                    or raw_member.get("Id")
                    or raw_member.get("recordId")
                )
                if not member_id:
                    enriched.append(raw_member)
                    continue

                log.debug("  [%d/%d] Fetching detail for %s", i + 1, len(all_raw), member_id)
                detail = await client.call(DETAIL_DESCRIPTOR, {"id": member_id})
                await asyncio.sleep(DELAY_MS / 1000)

                if isinstance(detail, dict):
                    merged = {**raw_member, **detail}
                    enriched.append(merged)
                else:
                    enriched.append(raw_member)

                if (i + 1) % 25 == 0:
                    log.info("  Progress: %d/%d", i + 1, len(all_raw))

            all_raw = enriched
        else:
            log.info(
                "No detail descriptor detected — "
                "output will use list-page fields only."
            )

        await browser.close()

        # ── Step 8: Normalize records ────────────────────────────────────
        for rec in all_raw:
            members.append(normalize_member(rec))

    return members


def normalize_member(raw: dict) -> dict:
    """
    Map raw Salesforce field names to clean human-readable keys.
    Handles the most common AWCI/Salesforce patterns.
    """
    def g(*keys):
        for k in keys:
            if raw.get(k) is not None:
                return safe_str(raw[k])
        return ""

    member = {
        "id":               g("Id", "id", "recordId"),
        "name":             g("Name", "name", "fullName", "ContactName"),
        "first_name":       g("FirstName", "firstName", "first_name"),
        "last_name":        g("LastName", "lastName", "last_name"),
        "company":          g("Company", "company", "AccountName", "BusinessName",
                               "Account.Name", "companyName"),
        "title":            g("Title", "title", "JobTitle"),
        "email":            g("Email", "email", "EmailAddress"),
        "phone":            g("Phone", "phone", "PhoneNumber", "MobilePhone",
                               "BusinessPhone"),
        "address_street":   g("MailingStreet", "Street", "street", "Address1"),
        "address_city":     g("MailingCity", "City", "city"),
        "address_state":    g("MailingState", "State", "state", "StateCode"),
        "address_zip":      g("MailingPostalCode", "PostalCode", "zip", "ZipCode"),
        "address_country":  g("MailingCountry", "Country", "country"),
        "website":          g("Website", "website", "Url", "url"),
        "member_type":      g("MemberType", "memberType", "Type", "type",
                               "MembershipType"),
        "member_since":     g("MemberSince", "memberSince", "JoinDate", "joinDate"),
        "certifications":   g("Certifications", "certifications", "Certs",
                               "CertificationList"),
        "specialties":      g("Specialties", "specialties", "Skills"),
        "bio":              g("Bio", "bio", "Description", "description"),
        "photo_url":        g("PhotoUrl", "photoUrl", "Picture", "picture",
                               "SmallPhotoUrl"),
        "profile_url":      f"https://awci.my.site.com/portal/s/searchdirectory?id={g('Id','id','recordId')}",
    }

    # Carry over any fields we haven't mapped
    mapped_raw_keys = {
        "Id","id","recordId","Name","name","fullName","ContactName",
        "FirstName","firstName","first_name","LastName","lastName","last_name",
        "Company","company","AccountName","BusinessName","Account","companyName",
        "Title","title","JobTitle","Email","email","EmailAddress",
        "Phone","phone","PhoneNumber","MobilePhone","BusinessPhone",
        "MailingStreet","Street","street","Address1",
        "MailingCity","City","city","MailingState","State","state","StateCode",
        "MailingPostalCode","PostalCode","zip","ZipCode",
        "MailingCountry","Country","country","Website","website","Url","url",
        "MemberType","memberType","Type","type","MembershipType",
        "MemberSince","memberSince","JoinDate","joinDate",
        "Certifications","certifications","Certs","CertificationList",
        "Specialties","specialties","Skills","Bio","bio","Description","description",
        "PhotoUrl","photoUrl","Picture","picture","SmallPhotoUrl",
    }
    for k, v in raw.items():
        if k not in mapped_raw_keys:
            member[f"extra_{k}"] = safe_str(v)

    return member


# ─── Output Helpers ───────────────────────────────────────────────────────────

def save_json(members: list[dict], path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(members, f, indent=2, ensure_ascii=False)
    log.info("✓ JSON saved: %s  (%d members)", path, len(members))


def save_csv(members: list[dict], path: Path):
    if not members:
        log.warning("No members to save.")
        return

    filtered_rows: list[dict] = []
    for m in members:
        business_type = safe_str(m.get("extra_FON_Your_Business__c"))
        if business_type not in ALLOWED_BUSINESS_TYPES:
            continue
        filtered_rows.append(
            {
                "extra_Membership_Type__c": safe_str(m.get("extra_Membership_Type__c")),
                "extra_FON_Your_Business__c": business_type,
                "name": safe_str(m.get("name")),
                "phone": safe_str(m.get("phone")),
                # Required output column name is "xtra_" per consumer schema.
                "xtra_OrderApi__Account_Email__c": safe_str(m.get("extra_OrderApi__Account_Email__c")),
                "website": safe_str(m.get("website")),
                "extra_BillingStreet": safe_str(m.get("extra_BillingStreet")),
                "extra_BillingCity": safe_str(m.get("extra_BillingCity")),
                "extra_BillingState": safe_str(m.get("extra_BillingState")),
                "extra_BillingPostalCode": safe_str(m.get("extra_BillingPostalCode")),
                "extra_BillingCountry": safe_str(m.get("extra_BillingCountry")),
                "extra_BillingStateCode": safe_str(m.get("extra_BillingStateCode")),
                "extra_BillingCountryCode": safe_str(m.get("extra_BillingCountryCode")),
            }
        )

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=REQUIRED_CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for row in filtered_rows:
            writer.writerow(row)

    log.info(
        "✓ CSV saved: %s  (%d rows, %d columns)",
        path,
        len(filtered_rows),
        len(REQUIRED_CSV_FIELDS),
    )


# ─── Entry Point ──────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    log.info("=" * 60)
    log.info("AWCI Member Directory Scraper")
    log.info("Target: %s%s", BASE_URL, PORTAL_PATH)
    log.info("=" * 60)

    members = await scrape_directory()

    if not members:
        log.error("No members extracted. See debug output above.")
        return

    save_json(members, OUTPUT_DIR / "awci_members.json")
    save_csv(members,  OUTPUT_DIR / "awci_members.csv")

    log.info("=" * 60)
    log.info("Done. %d members saved to ./%s/", len(members), OUTPUT_DIR)
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
