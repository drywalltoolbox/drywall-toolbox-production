from pathlib import Path
import csv

base_dir = Path("d:/AMD/projects/drywall-toolbox/frontend/public")
wp_catalog_path = base_dir / "wp-catalog.csv"
optimized_path = base_dir / "wc-variable-optimized.csv"
output_path = base_dir / "wp-catalog-optimized-merged.csv"

fields_to_replace = ["Brands", "Type", "SKU", "MPN", "Name", "Description", "Short description", "Categories"]

with optimized_path.open("r", encoding="utf-8", newline="") as optimized_file:
    optimized_reader = csv.DictReader(optimized_file)
    optimized_rows = [row for row in optimized_reader]
    def normalize_sku(raw_sku: str) -> str:
        sku = (raw_sku or "").strip()
        if "," in sku:
            parts = [part.strip() for part in sku.split(",") if part.strip()]
            if parts and all(part == parts[0] for part in parts):
                return parts[0]
        return sku

    optimized_by_sku = {normalize_sku(row["SKU"]): row for row in optimized_rows if row.get("SKU")}
    optimized_skus = set(optimized_by_sku)

with wp_catalog_path.open("r", encoding="utf-8", newline="") as wp_file:
    wp_reader = csv.DictReader(wp_file)
    wp_fieldnames = wp_reader.fieldnames
    if wp_fieldnames is None:
        raise ValueError("wp-catalog.csv appears to be empty or missing a header row.")

    merged_rows = []
    matched_skus = set()
    for row in wp_reader:
        sku = (row.get("SKU") or "").strip()
        if sku and sku in optimized_by_sku:
            optimized_row = optimized_by_sku[sku]
            for field in fields_to_replace:
                if field in row and field in optimized_row:
                    row[field] = optimized_row[field]
            matched_skus.add(sku)
        merged_rows.append(row)

unmatched_optimized = sorted(optimized_skus - matched_skus)

with output_path.open("w", encoding="utf-8", newline="") as out_file:
    writer = csv.DictWriter(out_file, fieldnames=wp_fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(merged_rows)

print(f"Wrote {len(merged_rows)} rows to {output_path}.")
print(f"Matched and replaced {len(matched_skus)} wp-catalog rows by SKU.")
if unmatched_optimized:
    print(f"Warning: {len(unmatched_optimized)} optimized SKU(s) were not found in wp-catalog.csv.")
    print(", ".join(unmatched_optimized[:20]) + ("..." if len(unmatched_optimized) > 20 else ""))
