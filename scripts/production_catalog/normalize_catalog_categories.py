import csv
from collections import Counter
from pathlib import Path

from catalog_policy import load_policy

OFFICIAL_DIR = Path(r"products/Production/catalogs/official")
AUTHORITY_FILE = OFFICIAL_DIR / "woocommerce_catalog_production.csv"
POLICY = load_policy()
PRODUCTION_CATEGORY_OVERRIDES = POLICY["category_aliases"]


DIRECT_CATEGORY_MAP = {
    "Drywall Finishing Tools > Platinum Drywall Tools > Automatic Tapers": "Drywall Finishing Tools > Platinum Drywall Tools > Semi-Automatic Taping Tools",
    "Drywall Finishing Tools > Platinum Drywall Tools > Corner & Angle Tools": "Drywall Finishing Tools > Platinum Drywall Tools > Corner Tools",
    "Drywall Finishing Tools > Platinum Drywall Tools > Finishing Boxes": "Drywall Finishing Tools > Platinum Drywall Tools > Flat Boxes",
    "Drywall Finishing Tools > Platinum Drywall Tools > Pumps & Accessories": "Drywall Finishing Tools > Platinum Drywall Tools > Mud Pans & Pumps",
    "Drywall Finishing Tools > Platinum Drywall Tools > Spotters": "Drywall Finishing Tools > Platinum Drywall Tools > Nail Spotters",
    "Drywall Finishing Tools > Platinum Drywall Tools > Tool Sets & Bundles": "Drywall Finishing Tools > Platinum Drywall Tools > Tool Sets & Kits",
    "Drywall Finishing Tools > Platinum Drywall Tools > Tools": "Drywall Finishing Tools > Platinum Drywall Tools > Mud Pans & Pumps",
    "Drywall Finishing Tools > TapeTech > Compound Rollers": "Drywall Finishing Tools > TapeTech > Corner Tools",
    "Drywall Finishing Tools > TapeTech > Corner Edgers": "Drywall Finishing Tools > TapeTech > Corner Tools",
    "Drywall Finishing Tools > TapeTech > Corner Finishers & Rollers": "Drywall Finishing Tools > TapeTech > Corner Tools",
    "Drywall Finishing Tools > TapeTech > Corner Flushers & Compound Tubes": "Drywall Finishing Tools > TapeTech > Corner Tools",
    "Drywall Finishing Tools > TapeTech > Finishing Knives": "Drywall Finishing Tools > TapeTech > Knives & Blades",
    "Drywall Finishing Tools > TapeTech > Finishing Trowels": "Drywall Finishing Tools > TapeTech > Knives & Blades",
    "Drywall Finishing Tools > TapeTech > Flat Box Handles": "Drywall Finishing Tools > TapeTech > Handles & Extensions",
    "Drywall Finishing Tools > TapeTech > Joint Knives": "Drywall Finishing Tools > TapeTech > Knives & Blades",
    "Drywall Finishing Tools > TapeTech > Mobile Wash Station": "Drywall Finishing Tools > TapeTech > Accessories & Adapters",
    "Drywall Finishing Tools > TapeTech > Mud Pans & Hawks": "Drywall Finishing Tools > TapeTech > Mud Pans & Pumps",
    "Drywall Finishing Tools > TapeTech > Taping Knives": "Drywall Finishing Tools > TapeTech > Knives & Blades",
    "Drywall Finishing Tools > TapeTech > Taping Tools & Tapers": "Drywall Finishing Tools > TapeTech > Automatic Taping Tools",
}


def normalize_production_category(category: str) -> str:
    category = (category or "").strip()
    return PRODUCTION_CATEGORY_OVERRIDES.get(category, category)


def load_authority_map(path: Path) -> dict[str, str]:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    return {
        row["SKU"].strip(): normalize_production_category(row.get("Categories", ""))
        for row in rows
        if row.get("SKU", "").strip()
    }


def remap_legacy_category(row: dict[str, str], category: str) -> str:
    brand = (row.get("Brands") or "").strip()
    name = (row.get("Name") or "").lower()
    category = DIRECT_CATEGORY_MAP.get(category, category)

    if category == "Drywall Finishing Tools > TapeTech > Compound Tubes & Loading Accessories":
        if any(token in name for token in ("pump", "filler")):
            return "Drywall Finishing Tools > TapeTech > Mud Pans & Pumps"
        return "Drywall Finishing Tools > TapeTech > Corner Tools"

    if category == "Drywall Finishing Tools > Columbia > Taping & Finishing Tools":
        if any(token in name for token in ("set", "kit", "bundle")):
            return "Drywall Finishing Tools > Columbia > Tool Sets & Kits"
        if "replacement" in name:
            return "Drywall Finishing Tools > Columbia > Parts"
        if "handle" in name:
            return "Drywall Finishing Tools > Columbia > Handles & Extensions"
        if any(token in name for token in ("mud roller", "corner roller")):
            return "Drywall Finishing Tools > Columbia > Corner Tools"
        if any(token in name for token in ("pump", "pan", "mixer", "hopper")):
            return "Drywall Finishing Tools > Columbia > Mud Pans & Pumps"
        return "Drywall Finishing Tools > Columbia > Knives & Blades"

    if category == "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools":
        if any(token in name for token in ("set", "kit", "bundle")):
            return "Drywall Finishing Tools > Level 5 > Tool Sets & Kits"
        if "replacement" in name:
            return "Drywall Finishing Tools > Level 5 > Parts"
        if any(token in name for token in ("mixer", "pump", "pan", "hawk")):
            return "Drywall Finishing Tools > Level 5 > Mud Pans & Pumps"
        if "handle" in name:
            return "Drywall Finishing Tools > Level 5 > Handles & Extensions"
        if any(token in name for token in ("roller", "corner finisher", "corner flusher")):
            return "Drywall Finishing Tools > Level 5 > Corner Tools"
        return "Drywall Finishing Tools > Level 5 > Knives & Blades"

    if category == "Drywall Finishing Tools > Asgard > Automatic Taping Tools":
        if "angle head" in name:
            return "Drywall Finishing Tools > Asgard > Corner Tools"
        if any(token in name for token in ("box", "maxxbox")):
            return "Drywall Finishing Tools > Asgard > Flat Boxes"
        if "handle" in name:
            return "Drywall Finishing Tools > Asgard > Handles & Extensions"
        if any(token in name for token in ("set", "kit", "bundle")):
            return "Drywall Finishing Tools > Asgard > Tool Sets & Kits"
        if "spotter" in name:
            return "Drywall Finishing Tools > Asgard > Nail Spotters"
        if any(token in name for token in ("pump", "filler", "mud")):
            return "Drywall Finishing Tools > Asgard > Mud Pans & Pumps"
        return category

    if brand == "TapeTech":
        return normalize_production_category(category)

    return normalize_production_category(category)


def rewrite_file(path: Path, authority_by_sku: dict[str, str]) -> tuple[int, Counter]:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not fieldnames or "Categories" not in fieldnames or "SKU" not in fieldnames:
        return 0, Counter()

    changes = 0
    category_changes: Counter = Counter()

    for row in rows:
        sku = (row.get("SKU") or "").strip()
        current = (row.get("Categories") or "").strip()
        if not current:
            continue

        target = authority_by_sku.get(sku)
        if not target:
            target = remap_legacy_category(row, current)

        if target and target != current:
            row["Categories"] = target
            changes += 1
            category_changes[(current, target)] += 1

    if changes:
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    return changes, category_changes


def main() -> None:
    authority_by_sku = load_authority_map(AUTHORITY_FILE)
    total_changes = 0
    for path in sorted(OFFICIAL_DIR.glob("*.csv")):
        changes, category_changes = rewrite_file(path, authority_by_sku)
        total_changes += changes
        print(f"{path.name}: {changes} category updates")
        for (source, target), count in sorted(category_changes.items(), key=lambda item: (-item[1], item[0][0], item[0][1])):
            print(f"  {count}x {source} -> {target}")
    print(f"total_updates={total_changes}")


if __name__ == "__main__":
    main()
