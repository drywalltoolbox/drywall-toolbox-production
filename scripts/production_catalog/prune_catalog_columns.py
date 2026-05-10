import csv
from pathlib import Path


OFFICIAL_DIR = Path(r"products/Production/catalogs/official")

# Remove these even if populated because they are not wanted in the final catalog.
FORCED_DROP_COLUMNS = {
    "meta:source_url",
}


def prune_file(path: Path) -> tuple[int, list[str]]:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    if not fieldnames:
        return 0, []

    nonempty_counts = {field: 0 for field in fieldnames}
    for row in rows:
        for field in fieldnames:
            if (row.get(field) or "").strip():
                nonempty_counts[field] += 1

    kept_fields: list[str] = []
    dropped_fields: list[str] = []
    for field in fieldnames:
        if field in FORCED_DROP_COLUMNS or nonempty_counts[field] == 0:
            dropped_fields.append(field)
        else:
            kept_fields.append(field)

    if not dropped_fields:
        return 0, []

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=kept_fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in kept_fields})

    return len(dropped_fields), dropped_fields


def main() -> None:
    for path in sorted(OFFICIAL_DIR.glob("*.csv")):
        dropped_count, dropped_fields = prune_file(path)
        print(f"{path.name}: dropped {dropped_count} columns")
        for field in dropped_fields:
            print(f"  - {field}")


if __name__ == "__main__":
    main()
