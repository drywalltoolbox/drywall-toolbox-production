from __future__ import annotations

import csv
from pathlib import Path

CSV_PATH = Path(r"c:\Users\Elliott\drywall-toolbox\products\Production\launch\woocommerce_catalog_initial_launch_tapetech_columbia.csv")


def main() -> None:
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not fieldnames:
        raise RuntimeError("CSV has no header columns")

    updated = 0
    for row in rows:
        name = row.get("Name", "")
        if name.startswith("Columbia Tools "):
            row["Name"] = "Columbia " + name[len("Columbia Tools ") :]
            updated += 1

    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"UPDATED_NAME_ROWS={updated}")
    print(f"CSV={CSV_PATH}")


if __name__ == "__main__":
    main()
