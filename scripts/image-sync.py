#!/usr/bin/env python3
"""
DTB Product Image Sync Pipeline
================================
Orchestrates the three-phase image pipeline against the live WordPress /
WooCommerce site via the DTB REST API.

  Phase 0 — Pre-flight status check
  Phase 1 — RESET  (wipe attachments from year/month + clear product image meta)
  Phase 2 — SYNC   (register files + link thumbnail + gallery, paginated)
  Phase 3 — Final status check

Auth: DTB JWT.
      Logs in via POST /dtb/v1/auth/login using DTB_AUTH_USER / DTB_AUTH_PASS
      environment variables (WordPress username + password), then sends all
      subsequent requests with  Authorization: Bearer {jwt}.
      Credentials can also be passed as CLI arguments (--user / --pass).

Usage examples
--------------
  # Dry-run (no writes):
  python scripts/image-sync.py --dry-run

  # Full run (credentials from env):
  python scripts/image-sync.py

  # Full run with explicit credentials:
  python scripts/image-sync.py --user "admin@example.com" --pass "mypassword"

  # Skip reset, only re-sync (useful after adding new images):
  python scripts/image-sync.py --skip-reset

  # Force re-register already-synced images:
  python scripts/image-sync.py --force

  # Smaller batch size for shared hosting:
  python scripts/image-sync.py --batch-size 50

  # Resume a previously interrupted sync from a known offset:
  python scripts/image-sync.py --skip-reset --start-offset 300

  # Release a stuck sync lock (after a crash):
  python scripts/image-sync.py --release-lock
"""

import argparse
import base64
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.request
import urllib.error
from typing import Any

# ── ANSI colour helpers ───────────────────────────────────────────────────────

CYAN    = "\033[96m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
MAGENTA = "\033[95m"
GREY    = "\033[90m"
RESET   = "\033[0m"
BOLD    = "\033[1m"

def step(msg: str)  -> None: print(f"\n{CYAN}{BOLD}▶  {msg}{RESET}")
def ok(msg: str)    -> None: print(f"   {GREEN}✔  {msg}{RESET}")
def warn(msg: str)  -> None: print(f"   {YELLOW}⚠  {msg}{RESET}")
def fail(msg: str)  -> None: print(f"   {RED}✘  {msg}{RESET}")
def info(msg: str)  -> None: print(f"   {GREY}·  {msg}{RESET}")

# ── HTTP helpers ──────────────────────────────────────────────────────────────

def dtb_request(method: str, url: str, auth: str, body: dict | None = None,
                retries: int = 5, retry_delay: float = 10.0) -> Any:
    """Make a JSON request to the DTB REST API. Retries on network/5xx errors."""
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "Authorization": auth,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        # ModSecurity on the shared host blocks the default Python-urllib UA.
        "User-Agent":    "Mozilla/5.0 (compatible; DTB-ImageSync/1.0)",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.loads(resp.read().decode())
        except (urllib.error.URLError, ConnectionResetError, TimeoutError, OSError):
            # Network-level error — always retry
            warn(f"Network error (attempt {attempt}/{retries})")
            if attempt < retries:
                info(f"Retrying in {retry_delay}s …")
                time.sleep(retry_delay)
                continue
            raise
        except urllib.error.HTTPError as exc:
            if exc.code in (500, 502, 503, 504) and attempt < retries:
                warn(f"HTTP {exc.code} (attempt {attempt}/{retries}) — retrying in {retry_delay}s …")
                time.sleep(retry_delay)
                continue
            body_text = exc.read().decode(errors="replace")
            # Surface a clear message for the most common error cases.
            if exc.code == 401:
                fail(f"HTTP 401 Unauthorized — check your credentials.")
            elif exc.code == 403:
                fail(f"HTTP 403 Forbidden — your account may not have the required role.")
            elif exc.code == 423:
                fail(f"HTTP 423 Locked — a sync is already running.")
                info("Run with --release-lock to clear a stuck lock, then retry.")
            else:
                fail(f"HTTP {exc.code} — {url}")
            try:
                err = json.loads(body_text)
                info(err.get("message", body_text[:500]))
            except Exception:
                info(body_text[:500])
            raise


def api_url(site: str, endpoint: str) -> str:
    return f"{site.rstrip('/')}/wp-json/dtb/v1/{endpoint}"


# ── Auth: mint a JWT directly from the signing secret ────────────────────────

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def mint_jwt(secret: str, user_id: int = 1, roles: list[str] | None = None) -> str:
    """
    Mint a signed HS256 JWT using the DRYWALL_JWT_SECRET from wp-config.php.
    This matches dtb_generate_jwt() in dtb-auth.php exactly.

    Bypasses the /auth/login endpoint so the script works regardless of
    whether the WP admin email is known, and avoids rate-limit exposure.

    Args:
        secret:  DRYWALL_JWT_SECRET value from wp-config.php.
        user_id: WordPress user ID with administrator role (default: 1).
        roles:   WP role slugs to embed in the token (default: ['administrator']).
    """
    if roles is None:
        roles = ["administrator"]

    now     = int(time.time())
    header  = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64url(json.dumps({
        "sub":   user_id,
        "roles": roles,
        "iat":   now,
        "exp":   now + 7 * 86400,   # 7 days — matches dtb_generate_jwt()
    }, separators=(",", ":")).encode())
    sig = _b64url(
        hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{sig}"


# ── CLI argument parsing ──────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="DTB product image reset + sync pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--site",       default="https://drywalltoolbox.com",
                   help="WordPress site root URL (default: https://drywalltoolbox.com)")
    p.add_argument("--year",       default="2026",
                   help="Upload year folder (default: 2026)")
    p.add_argument("--month",      default="04",
                   help="Upload month folder, zero-padded (default: 04)")
    p.add_argument("--user",       default=os.environ.get("DTB_AUTH_USER", ""),
                   help="WordPress login e-mail (or set DTB_AUTH_USER env var) — unused when --jwt-secret is set")
    p.add_argument("--pass",       default=os.environ.get("DTB_AUTH_PASS", ""),
                   dest="password",
                   help="WordPress password (or set DTB_AUTH_PASS env var) — unused when --jwt-secret is set")
    p.add_argument("--jwt-secret", default=os.environ.get("DRYWALL_JWT_SECRET", ""),
                   dest="jwt_secret",
                   help="DRYWALL_JWT_SECRET from wp-config.php (or set DRYWALL_JWT_SECRET env var). "
                        "When provided, mints a JWT directly without calling /auth/login.")
    p.add_argument("--batch-size", default=100, type=int,
                   help="Products per sync batch (default: 100)")
    p.add_argument("--start-offset", default=0, type=int,
                   help="Resume sync from this SKU offset (skip already-processed batches)")
    p.add_argument("--dry-run",    action="store_true",
                   help="Scan and report without writing to the database")
    p.add_argument("--skip-reset", action="store_true",
                   help="Skip Phase 1 (reset) — only re-sync images")
    p.add_argument("--skip-sync",  action="store_true",
                   help="Skip Phase 2 (sync) — only run reset + status")
    p.add_argument("--force",      action="store_true",
                   help="Re-register and re-link images even if already synced")
    p.add_argument("--release-lock", action="store_true",
                   help="Release a stuck sync lock left by a crashed run, then exit")
    return p.parse_args()


# ── Main pipeline ─────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()

    if not args.user or not args.password:
        if not args.jwt_secret:
            fail("Credentials not set.")
            info("Either:")
            info("  Set DRYWALL_JWT_SECRET env var (or --jwt-secret) — recommended for scripts")
            info("  Set DTB_AUTH_USER + DTB_AUTH_PASS env vars (or --user / --pass)")
            sys.exit(1)

    site        = args.site
    year, month = args.year, args.month

    # ── Banner ────────────────────────────────────────────────────────────────
    print()
    print(f"{MAGENTA}{BOLD}╔══════════════════════════════════════════════════════════╗{RESET}")
    print(f"{MAGENTA}{BOLD}║       DTB Product Image Sync — {site:<27}║{RESET}")
    print(f"{MAGENTA}{BOLD}╚══════════════════════════════════════════════════════════╝{RESET}")
    print()
    info(f"Year/Month   : {year}/{month}")
    info(f"Batch size   : {args.batch_size}")
    info(f"Dry run      : {args.dry_run}")
    info(f"Force        : {args.force}")
    info(f"Skip reset   : {args.skip_reset}")
    info(f"Skip sync    : {args.skip_sync}")

    # ── Authenticate — mint or obtain a JWT ──────────────────────────────────
    step("Auth — obtaining JWT")
    if args.jwt_secret:
        # Fast path: mint the token locally from the signing secret.
        # Identical to what dtb_generate_jwt() produces server-side.
        jwt_token = mint_jwt(args.jwt_secret)
        ok("JWT minted from signing secret (no login request needed)")
    else:
        fail("--jwt-secret / DRYWALL_JWT_SECRET is required.")
        info("Set DRYWALL_JWT_SECRET from wp-config.php section 9e.")
        sys.exit(1)

    auth = f"Bearer {jwt_token}"

    # ── --release-lock shortcut ───────────────────────────────────────────────
    if args.release_lock:
        step("Releasing stuck sync lock")
        result = dtb_request("POST", api_url(site, "sync-images/release-lock"), auth)
        ok(result.get("message", "Lock released"))
        print()
        print(f"{GREEN}{BOLD}Done.{RESET}")
        return

    # ── Phase 0 — Pre-flight ──────────────────────────────────────────────────
    step("Phase 0 — Pre-flight status check")
    status0 = dtb_request(
        "GET",
        api_url(site, f"sync-images/status?year={year}&month={month}"),
        auth,
    )
    info(f"Files on disk       : {status0.get('files_on_disk', '?')}")
    info(f"Registered in DB    : {status0.get('registered_in_db', '?')}")
    info(f"Products linked     : {status0.get('linked_products', '?')}")
    info(f"Gallery products    : {status0.get('gallery_products', '?')}")

    if status0.get("sync_locked"):
        warn("A sync lock is currently active on the server.")
        warn("If a previous run crashed, re-run with --release-lock first.")

    if status0.get("files_on_disk", 0) == 0:
        fail(f"No image files found in uploads/{year}/{month} on the server.")
        info("Upload your .webp files first, then re-run this script.")
        sys.exit(1)

    # ── Phase 1 — Reset ───────────────────────────────────────────────────────
    if not args.skip_reset:
        step("Phase 1 — Reset (wipe attachments from directory + clear product image meta)")
        if not args.dry_run:
            warn("This will DELETE all attachment records from uploads/"
                 f"{year}/{month} and clear image meta on ALL products.")
            warn("Press Ctrl-C within 5 s to abort …")
            time.sleep(5)
        reset = dtb_request(
            "POST",
            api_url(site, "sync-images/reset"),
            auth,
            {"year": year, "month": month, "dry_run": args.dry_run},
        )
        if args.dry_run:
            warn(f"[DRY RUN] Would delete {reset.get('total_attachments', 0)} attachment records")
        else:
            ok(f"Deleted {reset.get('deleted_atts', 0)} / {reset.get('total_attachments', 0)} attachments from DB")
            errors = reset.get("errors", [])
            if errors:
                warn(f"{len(errors)} errors during reset:")
                for e in errors:
                    warn(f"  {e}")
    else:
        warn("Skipping Phase 1 (reset) as requested.")

    # ── Phase 2 — Sync ────────────────────────────────────────────────────────
    if not args.skip_sync:
        step("Phase 2 — Sync images (register + link thumbnail + gallery)")

        offset         = args.start_offset
        if args.start_offset > 0:
            warn(f"Resuming from offset {args.start_offset} (skipping already-processed batches)")
        total_reg      = 0
        total_linked   = 0
        total_skipped  = 0
        total_no_file  = 0
        total_gallery  = 0
        all_errors: list[str] = []
        batch_num      = 0

        while True:
            batch_num += 1
            info(f"Batch {batch_num} — offset {offset}, limit {args.batch_size} …")

            sync = dtb_request(
                "POST",
                api_url(site, "sync-images"),
                auth,
                {
                    "year":    year,
                    "month":   month,
                    "dry_run": args.dry_run,
                    "force":   args.force,
                    "limit":   args.batch_size,
                    "offset":  offset,
                },
            )

            reg      = sync.get("registered",     0)
            linked   = sync.get("linked",          0)
            skipped  = sync.get("skipped",         0)
            no_file  = sync.get("no_file",         0)
            gallery  = sync.get("gallery_images",  0)
            errors   = sync.get("errors",          [])

            total_reg     += reg
            total_linked  += linked
            total_skipped += skipped
            total_no_file += no_file
            total_gallery += gallery

            if errors:
                all_errors.extend(errors)
                warn(f"  {len(errors)} errors in batch {batch_num}")

            info(f"  registered={reg}  linked={linked}  skipped={skipped}  no_file={no_file}  gallery={gallery}")

            next_offset = sync.get("next_offset")
            if next_offset is None:
                break
            offset = next_offset

        print()
        if args.dry_run:
            warn("[DRY RUN] Sync complete — no writes performed")
        else:
            ok("Sync complete")
        info("────────────────────────────────────")
        info(f"Total registered    : {total_reg}")
        info(f"Total gallery imgs  : {total_gallery}")
        info(f"Total linked        : {total_linked}")
        info(f"Total skipped (dup) : {total_skipped}")
        info(f"Total no-file       : {total_no_file}")

        if all_errors:
            warn(f"{len(all_errors)} total errors:")
            for e in all_errors:
                warn(f"  {e}")
    else:
        warn("Skipping Phase 2 (sync) as requested.")

    # ── Phase 3 — Final status ────────────────────────────────────────────────
    step("Phase 3 — Final status check")
    status1 = dtb_request(
        "GET",
        api_url(site, f"sync-images/status?year={year}&month={month}"),
        auth,
    )
    files_on_disk  = status1.get("files_on_disk",       0)
    registered     = status1.get("registered_in_db",    0)
    linked         = status1.get("linked_products",     0)
    gal_products   = status1.get("gallery_products",    0)

    info(f"Files on disk       : {files_on_disk}")
    info(f"Registered in DB    : {registered}")
    info(f"Products linked     : {linked}")
    info(f"Gallery products    : {gal_products}")

    pct = round((registered / files_on_disk) * 100, 1) if files_on_disk else 0
    if pct >= 95:
        ok(f"{pct}% of disk images registered in DB")
    elif pct >= 70:
        warn(f"{pct}% of disk images registered — some products may be missing images")
    else:
        fail(f"{pct}% registered — something may have gone wrong")

    if not args.dry_run:
        print()
        print(f"  {YELLOW}{BOLD}⚡ Next step: bust the frontend IndexedDB product cache{RESET}")
        print(f"  {YELLOW}   In your browser console (on the live site), run:{RESET}")
        print(f"       {BOLD}indexedDB.deleteDatabase('dtb-products');{RESET}")
        print(f"  {YELLOW}   Or force a hard reload (Ctrl+Shift+R) on the live site.{RESET}")

    print()
    print(f"{GREEN}{BOLD}Done.{RESET}")


if __name__ == "__main__":
    main()
