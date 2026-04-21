from pathlib import Path
from collections import defaultdict

from dedupe_product_images import REPO_ROOT, PRODUCTS_DIR, load_catalog_references, load_product_images, group_exact_duplicates, group_near_duplicates


def main() -> None:
    catalog_path = REPO_ROOT / "frontend" / "public" / "wp-catalog.csv"
    referenced_map = load_catalog_references(catalog_path)
    records = load_product_images(PRODUCTS_DIR, referenced_map)

    exact_groups = group_exact_duplicates(records)
    exact_count = len(exact_groups)
    exact_files = sum(len(group) for group in exact_groups.values())

    remainder = [r for r in records if r.filename not in {filename for group in exact_groups.values() for filename in [item.filename for item in group]} and not r.unreadable]
    near_groups = group_near_duplicates(remainder)
    near_count = len(near_groups)
    near_files = sum(len(group) for group in near_groups)

    print("Exact duplicate groups:", exact_count)
    print("Exact duplicate files:", exact_files)
    print("Near duplicate groups:", near_count)
    print("Near duplicate files:", near_files)

    print("\nSample near duplicate groups with differing resolution:")
    mixed = [group for group in near_groups if len({(item.width, item.height) for item in group}) > 1][:20]
    for idx, group in enumerate(mixed, start=1):
        print(f"Group {idx}:")
        for item in group:
            print(
                f"  {item.filename} | {item.width}x{item.height} | {item.filesize} | referenced={item.referenced} | refs={item.ref_count}"
            )
        print()


if __name__ == "__main__":
    main()
