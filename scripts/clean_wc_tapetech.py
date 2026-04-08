import csv
import re

# File paths
input_file = 'd:/AMD/projects/drywall-toolbox/scripts/brand-catalogs/wc-tapetech.csv'
output_file = 'd:/AMD/projects/drywall-toolbox/scripts/brand-catalogs/wc-tapetech-cleaned.csv'

def clean_name_field(row):
    brand = row['Brands']
    mpn = row['MPN']
    name = row['Name']

    # Refined regex pattern to remove redundant brand and MPN occurrences
    # Example: "TapeTech TapeTech PAHC07 (PAHC07)"
    # Result: "TapeTech PAHC07"
    pattern = rf"(?<!\w)({re.escape(brand)}\s*)+|\b{re.escape(mpn)}\b|\({re.escape(mpn)}\)"
    cleaned_name = re.sub(pattern, '', name, flags=re.IGNORECASE)

    # Remove extra spaces and ensure proper formatting
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()

    # Ensure the brand is at the start of the Name field
    if not cleaned_name.lower().startswith(brand.lower()):
        cleaned_name = f"{brand} {cleaned_name}".strip()

    return cleaned_name

def process_csv(input_file, output_file):
    with open(input_file, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames

        rows = []
        for row in reader:
            if row['Brands'] == 'TapeTech':
                row['Name'] = clean_name_field(row)
            rows.append(row)

    with open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Cleaned data has been written to {output_file}")

if __name__ == "__main__":
    process_csv(input_file, output_file)