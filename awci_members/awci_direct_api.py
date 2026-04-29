#!/usr/bin/env python3
"""
AWCI Direct API Scraper (Phase 2)
===================================
Use this script AFTER running aura_sniffer.js in your browser and
filling in the AURA_CONTEXT, AURA_TOKEN, SEARCH_DESCRIPTOR, and
optionally DETAIL_DESCRIPTOR below.

This script does NOT need Playwright — it just makes plain HTTP requests.

Requirements:
    pip install requests
"""

import json
import csv
import re
import time
import logging
from pathlib import Path

import requests

# ═══════════════════════════════════════════════════════════════════════════════
# ↓↓↓  FILL THESE IN from the browser sniffer output  ↓↓↓
# ═══════════════════════════════════════════════════════════════════════════════

AURA_URL = "https://awci.my.site.com/portal/s/sfsites/aura"

# Paste the full aura.context string captured from the sniffer
AURA_CONTEXT = """
PASTE_AURA_CONTEXT_HERE
""".strip()

# The token (often "null" for public sites, or a JWT for authenticated ones)
AURA_TOKEN = "null"

# Descriptor for searching/listing members
# Example: "apex://MemberDirectoryController/ACTION$searchMembers"
SEARCH_DESCRIPTOR = "PASTE_SEARCH_DESCRIPTOR_HERE"

# Descriptor for fetching a single member detail (leave "" if not found)
DETAIL_DESCRIPTOR = ""

# ═══════════════════════════════════════════════════════════════════════════════

PAGE_SIZE  = 12
OUTPUT_DIR = Path("awci_output")
LOG_LEVEL  = logging.INFO

logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(message)s")
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


class AuraHTTPClient:
    def __init__(self, session: requests.Session, aura_url: str, context: str, token: str):
        self.session    = session
        self.aura_url   = aura_url
        self.context    = context
        self.token      = token
        self._action_id = 1

    def _next_id(self) -> str:
        aid = f"{self._action_id};a"
        self._action_id += 1
        return aid

    def call(self, descriptor: str, params: dict, page_uri: str = "/portal/s/searchdirectory"):
        action  = {
            "id": self._next_id(),
            "descriptor": descriptor,
            "callingDescriptor": "UNKNOWN",
            "params": params,
        }
        payload = {
            "message":      json.dumps({"actions": [action]}),
            "aura.context": self.context,
            "aura.pageURI": page_uri,
            "aura.token":   self.token,
        }
        headers = {
            "Content-Type":    "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept":          "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            "Referer":         "https://awci.my.site.com/portal/s/searchdirectory",
        }
        resp = self.session.post(self.aura_url, data=payload, headers=headers, timeout=30)
        resp.raise_for_status()

        raw   = resp.text
        clean = re.sub(r"^while\s*\(\s*1\s*\);?\s*", "", raw.strip())
        data  = json.loads(clean)

        actions = data.get("actions") or []
        if not actions:
            return None
        result = actions[0]
        if result.get("state") != "SUCCESS":
            log.warning("Action failed: state=%s  error=%s", result.get("state"), result.get("error"))
            return None
        return result.get("returnValue")


def run():
    if "PASTE" in AURA_CONTEXT or "PASTE" in SEARCH_DESCRIPTOR:
        log.error(
            "Please fill in AURA_CONTEXT and SEARCH_DESCRIPTOR before running.\n"
            "Run aura_sniffer.js in your browser first."
        )
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; AWCI-Scraper/1.0)"})

    client = AuraHTTPClient(session, AURA_URL, AURA_CONTEXT, AURA_TOKEN)

    # ── Page 1 ────────────────────────────────────────────────────────────
    log.info("Fetching page 1 …")
    rv = client.call(SEARCH_DESCRIPTOR, {"pageSize": PAGE_SIZE, "pageNumber": 1, "offset": 0})
    if not rv:
        log.error("No data returned on page 1. Check AURA_CONTEXT / SEARCH_DESCRIPTOR.")
        return

    def extract_list(rv):
        return (
            rv.get("members")
            or rv.get("records")
            or rv.get("results")
            or rv.get("data")
            or (rv if isinstance(rv, list) else [])
        )

    total = int(
        rv.get("totalCount") or rv.get("total") or rv.get("totalSize") or rv.get("count") or 0
    )
    all_raw = list(extract_list(rv))
    log.info("Page 1: %d records (total=%d)", len(all_raw), total)

    # ── Paginate ──────────────────────────────────────────────────────────
    num_pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
    for pg in range(1, num_pages):
        offset = pg * PAGE_SIZE
        log.info("Page %d/%d (offset=%d) …", pg + 1, num_pages, offset)
        rv = client.call(SEARCH_DESCRIPTOR, {"pageSize": PAGE_SIZE, "pageNumber": pg + 1, "offset": offset})
        time.sleep(0.5)
        if not rv:
            log.info("Empty response — stopping pagination.")
            break
        page_records = extract_list(rv)
        if not page_records:
            break
        all_raw.extend(page_records)

    log.info("Total list-page records: %d", len(all_raw))

    # ── Detail enrichment ─────────────────────────────────────────────────
    if DETAIL_DESCRIPTOR:
        log.info("Fetching individual detail pages …")
        enriched = []
        for i, rec in enumerate(all_raw):
            rid = rec.get("Id") or rec.get("id") or rec.get("recordId")
            if rid:
                detail = client.call(DETAIL_DESCRIPTOR, {"id": rid})
                time.sleep(0.4)
                if isinstance(detail, dict):
                    rec = {**rec, **detail}
            enriched.append(rec)
            if (i + 1) % 25 == 0:
                log.info("  %d/%d detailed", i + 1, len(all_raw))
        all_raw = enriched

    # ── Normalize & save ──────────────────────────────────────────────────
    def safe(d, *keys):
        for k in keys:
            v = d.get(k)
            if v is not None:
                return str(v).strip()
        return ""

    members = []
    for raw in all_raw:
        m = {
            "id":             safe(raw, "Id", "id", "recordId"),
            "name":           safe(raw, "Name", "name", "fullName"),
            "first_name":     safe(raw, "FirstName", "firstName"),
            "last_name":      safe(raw, "LastName", "lastName"),
            "company":        safe(raw, "Company", "company", "AccountName", "BusinessName"),
            "title":          safe(raw, "Title", "title"),
            "email":          safe(raw, "Email", "email"),
            "phone":          safe(raw, "Phone", "phone", "MobilePhone"),
            "address_street": safe(raw, "MailingStreet", "Street"),
            "address_city":   safe(raw, "MailingCity", "City"),
            "address_state":  safe(raw, "MailingState", "State"),
            "address_zip":    safe(raw, "MailingPostalCode", "PostalCode"),
            "address_country":safe(raw, "MailingCountry", "Country"),
            "website":        safe(raw, "Website", "website"),
            "member_type":    safe(raw, "MemberType", "memberType", "Type"),
            "member_since":   safe(raw, "MemberSince", "memberSince", "JoinDate"),
            "certifications": safe(raw, "Certifications", "certifications"),
            "specialties":    safe(raw, "Specialties", "specialties"),
            "bio":            safe(raw, "Bio", "bio", "Description"),
            "photo_url":      safe(raw, "PhotoUrl", "photoUrl", "SmallPhotoUrl"),
            "profile_url":    f"https://awci.my.site.com/portal/s/searchdirectory?id={safe(raw,'Id','id')}",
        }
        known = {
            "Id","id","recordId","Name","name","fullName","FirstName","firstName",
            "LastName","lastName","Company","company","AccountName","BusinessName",
            "Title","title","Email","email","Phone","phone","MobilePhone",
            "MailingStreet","Street","MailingCity","City","MailingState","State",
            "MailingPostalCode","PostalCode","MailingCountry","Country",
            "Website","website","MemberType","memberType","Type","MemberSince",
            "memberSince","JoinDate","Certifications","certifications","Specialties",
            "specialties","Bio","bio","Description","PhotoUrl","photoUrl","SmallPhotoUrl",
        }
        for k, v in raw.items():
            if k not in known:
                m[f"raw_{k}"] = str(v) if v is not None else ""
        members.append(m)

    # JSON
    json_path = OUTPUT_DIR / "awci_members.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(members, f, indent=2, ensure_ascii=False)
    log.info("✓ JSON: %s", json_path)

    # CSV (strict schema + business-type filter)
    csv_path = OUTPUT_DIR / "awci_members.csv"
    if members:
        filtered_rows = []
        for m in members:
            business_type = (m.get("raw_FON_Your_Business__c") or "").strip()
            if business_type not in ALLOWED_BUSINESS_TYPES:
                continue
            filtered_rows.append(
                {
                    "extra_Membership_Type__c": (m.get("raw_Membership_Type__c") or "").strip(),
                    "extra_FON_Your_Business__c": business_type,
                    "name": (m.get("name") or "").strip(),
                    "phone": (m.get("phone") or "").strip(),
                    # Required output column name is "xtra_" per consumer schema.
                    "xtra_OrderApi__Account_Email__c": (m.get("raw_OrderApi__Account_Email__c") or "").strip(),
                    "website": (m.get("website") or "").strip(),
                    "extra_BillingStreet": (m.get("raw_BillingStreet") or "").strip(),
                    "extra_BillingCity": (m.get("raw_BillingCity") or "").strip(),
                    "extra_BillingState": (m.get("raw_BillingState") or "").strip(),
                    "extra_BillingPostalCode": (m.get("raw_BillingPostalCode") or "").strip(),
                    "extra_BillingCountry": (m.get("raw_BillingCountry") or "").strip(),
                    "extra_BillingStateCode": (m.get("raw_BillingStateCode") or "").strip(),
                    "extra_BillingCountryCode": (m.get("raw_BillingCountryCode") or "").strip(),
                }
            )
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=REQUIRED_CSV_FIELDS, extrasaction="ignore")
            w.writeheader()
            for row in filtered_rows:
                w.writerow(row)
        log.info("✓ CSV: %s  (%d rows)", csv_path, len(filtered_rows))

    log.info("Done — %d members extracted.", len(members))


if __name__ == "__main__":
    run()
