#!/usr/bin/env python3
"""
Update all schematic_data.json files with manifest metadata.
Ensures proper structure with id, title, product_name, sku at the top.
"""

import json
from pathlib import Path

# Paths
MANIFEST_PATH = Path("frontend/public/brands/Asgard/Schematics/manifest.json")
SCHEMATICS_DIR = Path("frontend/public/brands/Asgard/Schematics")

def load_manifest():
    """Load manifest.json"""
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_sku_from_path(file_path):
    """Extract SKU from file path (e.g., .../Adapters/FA01-AD/schematic_data.json -> FA01-AD)"""
    parts = file_path.parts
    if len(parts) >= 2:
        return parts[-2]
    return None

def find_all_schematic_files():
    """Find all schematic_data.json files"""
    return list(SCHEMATICS_DIR.rglob("schematic_data.json"))

def generate_id():
    """Generate a unique ID (using timestamp-like format)"""
    import time
    return str(int(time.time() * 1000))

def update_schematic_file(file_path, manifest_data, manifest):
    """Update a single schematic_data.json file with manifest data"""
    try:
        # Load existing schematic data
        with open(file_path, 'r', encoding='utf-8') as f:
            schematic = json.load(f)
        
        sku = get_sku_from_path(file_path)
        
        if sku not in manifest_data:
            print(f"  ⚠ SKU {sku} not found in manifest, skipping...")
            return False
        
        manifest_entry = manifest_data[sku]
        
        # Create new ordered schematic with metadata at top
        new_schematic = {}
        
        # Add metadata fields first (in order)
        new_schematic['id'] = schematic.get('id', generate_id())
        new_schematic['title'] = f"{sku}_SCH"
        new_schematic['product_name'] = manifest_entry['name']
        new_schematic['sku'] = sku
        
        # Add diagram/legend pages
        new_schematic['diagramPages'] = schematic.get('diagramPages', [1])
        new_schematic['legendPages'] = schematic.get('legendPages', [])
        
        # Add parts and coordinates (preserve existing)
        new_schematic['parts'] = schematic.get('parts', [])
        new_schematic['coordinates'] = schematic.get('coordinates', {})
        
        # Add schema version
        new_schematic['schema_version'] = schematic.get('schema_version', '1.0')
        
        # Add any other fields that exist (like image dimensions)
        for key, value in schematic.items():
            if key not in new_schematic:
                new_schematic[key] = value
        
        # Write updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(new_schematic, f, indent=2, ensure_ascii=False)
        
        print(f"  ✓ Updated {sku}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("Loading manifest...")
    manifest = load_manifest()
    print(f"Found {len(manifest)} entries in manifest\n")
    
    print("Finding all schematic_data.json files...")
    schematic_files = find_all_schematic_files()
    print(f"Found {len(schematic_files)} schematic files\n")
    
    print("Updating schematic files with manifest data...\n")
    updated_count = 0
    
    # Sort for consistent output
    for file_path in sorted(schematic_files):
        if update_schematic_file(file_path, manifest, manifest):
            updated_count += 1
    
    print(f"\n✓ Successfully updated {updated_count}/{len(schematic_files)} schematic files")

if __name__ == "__main__":
    main()
