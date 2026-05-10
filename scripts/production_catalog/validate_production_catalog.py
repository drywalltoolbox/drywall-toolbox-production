from __future__ import annotations

import sys

from catalog_policy import load_policy, read_csv_rows, resolve_catalog_path, validate_headers, validate_rows


def main() -> int:
    policy = load_policy()
    catalog_path = resolve_catalog_path(policy)
    fieldnames, rows = read_csv_rows(catalog_path)

    errors = validate_headers(fieldnames, policy) + validate_rows(rows, policy)
    if errors:
        print("production catalog validation failed")
        for error in errors[:100]:
            print(f"  - {error}")
        if len(errors) > 100:
            print(f"  - ... {len(errors) - 100} more errors")
        return 1

    print(f"catalog={catalog_path}")
    print(f"rows={len(rows)}")
    print("validation=passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
