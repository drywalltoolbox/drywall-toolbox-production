from __future__ import annotations

from collections import Counter
import sys

from catalog_policy import (
    load_policy,
    normalize_production_row,
    read_csv_rows,
    resolve_catalog_path,
    validate_headers,
    validate_rows,
    write_csv_rows,
)


def main() -> int:
    policy = load_policy()
    catalog_path = resolve_catalog_path(policy)
    fieldnames, rows = read_csv_rows(catalog_path)

    header_errors = validate_headers(fieldnames, policy)
    if header_errors:
        for error in header_errors:
            print(error)
        return 1

    field_change_counts: Counter[str] = Counter()
    total_changed_rows = 0

    for row in rows:
        _, changes = normalize_production_row(row, policy)
        if changes:
            total_changed_rows += 1
            for field in changes:
                field_change_counts[field] += 1

    validation_errors = validate_rows(rows, policy)
    if validation_errors:
        print("production catalog validation failed after normalization")
        for error in validation_errors[:100]:
            print(f"  - {error}")
        if len(validation_errors) > 100:
            print(f"  - ... {len(validation_errors) - 100} more errors")
        return 1

    if total_changed_rows:
        write_csv_rows(catalog_path, fieldnames, rows)

    print(f"catalog={catalog_path}")
    print(f"changed_rows={total_changed_rows}")
    for field, count in sorted(field_change_counts.items()):
        print(f"{field}={count}")
    print("validation=passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
