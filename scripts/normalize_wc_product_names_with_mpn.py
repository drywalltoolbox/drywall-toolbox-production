from __future__ import annotations

import csv
import json
import re
import shutil
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WC_PATH = ROOT / "products/Production/catalogs/official/woocommerce_catalog.csv"
REPORTS_DIR = ROOT / "products/Production/reports"

TRAILING_MPN_SUFFIX_RE = re.compile(r"\s*-\s*\[[^\]]*\]\s*$")


def strip_duplicate_mpn_prefix(name: str, mpn: str) -> str:
    prefix = f"{mpn.strip()} - "
    if name.startswith(prefix):
        return name[len(prefix) :].strip()
    return name


def normalize_name(name: str, mpn: str) -> str:
    base_name = TRAILING_MPN_SUFFIX_RE.sub("", (name or "").strip())
    base_name = strip_duplicate_mpn_prefix(base_name, mpn)
    return f"{base_name} - [{mpn.strip()}]"


def main() -> None:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = WC_PATH.with_name(f"{WC_PATH.stem}.pre-name-mpn-normalize-{timestamp}{WC_PATH.suffix}")
    summary_path = REPORTS_DIR / "wc_product_name_mpn_normalization_summary.json"

    with WC_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys()) if rows else []

    if not rows:
        raise RuntimeError(f"No rows found in {WC_PATH}")

    shutil.copy2(WC_PATH, backup_path)

    changed_rows = 0
    untouched_rows = 0
    examples: list[dict[str, str]] = []

    for row in rows:
        old_name = (row.get("Name") or "").strip()
        mpn = (row.get("Meta: _mpn") or "").strip()
        if not mpn:
            untouched_rows += 1
            continue

        new_name = normalize_name(old_name, mpn)
        if new_name != old_name:
            row["Name"] = new_name
            changed_rows += 1
            if len(examples) < 20:
                examples.append(
                    {
                        "sku": row.get("SKU", ""),
                        "old_name": old_name,
                        "mpn": mpn,
                        "new_name": new_name,
                    }
                )
        else:
            untouched_rows += 1

    with WC_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "woocommerce_catalog": str(WC_PATH.relative_to(ROOT)).replace("\\", "/"),
        "backup_path": str(backup_path.relative_to(ROOT)).replace("\\", "/"),
        "rows_total": len(rows),
        "rows_changed": changed_rows,
        "rows_unchanged": untouched_rows,
        "summary_generated_at": datetime.now().isoformat(timespec="seconds"),
        "examples": examples,
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
