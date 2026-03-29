#!/usr/bin/env python3
"""
Remove one or more columns by header name from a CSV file.
Creates a backup of the original file with .bak timestamp.
Usage:
  python scripts/remove_csv_column.py path/to/file.csv Description

This script will remove any columns whose header exactly matches the provided column names
(including case). It preserves quoting and uses Python's csv module to handle fields safely.
"""
import csv
import sys
import os
import time

def remove_columns(input_path, output_path, cols_to_remove):
    with open(input_path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        rows = list(reader)

    if not rows:
        print('Empty CSV, nothing to do')
        return

    header = rows[0]
    # Build list of indexes to keep
    remove_indexes = [i for i, h in enumerate(header) if h in cols_to_remove]
    if not remove_indexes:
        print('No matching columns to remove. Headers found:', header)
        return

    keep_indexes = [i for i in range(len(header)) if i not in remove_indexes]

    # Write backup
    bak_path = input_path + '.bak.' + time.strftime('%Y%m%dT%H%M%S')
    os.rename(input_path, bak_path)
    print(f'Backed up original to: {bak_path}')

    # Write new CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as outfh:
        writer = csv.writer(outfh)
        for row in rows:
            # pad row if short
            if len(row) < len(header):
                row = row + [''] * (len(header) - len(row))
            new_row = [row[i] for i in keep_indexes]
            writer.writerow(new_row)

    print(f'Wrote cleaned CSV to: {output_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: remove_csv_column.py <csv_path> <column-name> [<column-name> ...]')
        sys.exit(1)

    csv_path = sys.argv[1]
    cols = sys.argv[2:]
    if not os.path.isfile(csv_path):
        print('File not found:', csv_path)
        sys.exit(1)

    remove_columns(csv_path, csv_path, cols)
