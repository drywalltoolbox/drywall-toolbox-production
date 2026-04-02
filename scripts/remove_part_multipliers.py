#!/usr/bin/env python3
"""
Remove quantity multipliers from part IDs and names in all schematic_data.json files.
Examples: "859016 x 2" -> "859016", "209012 X2" -> "209012", "2x 209016" -> "209016"
"""

import json
import re
from pathlib import Path

SCHEMATICS_DIR = Path("frontend/public/brands/Asgard/Schematics")

def clean_part_id(part_id):
    """Remove quantity multipliers from part ID"""
    if not part_id:
        return part_id
    
    # Pattern to match various multiplier formats: " X2", " x 2", "X*", "x*", "2x", "2X", etc.
    # This handles: " X2", " x2", " X 2", " x 2", "X2", "x2", " X*", "x*", "2X", "2x", etc.
    cleaned = re.sub(r'\s*[xX]\s*\d+$', '', part_id)  # Remove trailing " X 2" or " x2" etc
    cleaned = re.sub(r'^\d+\s*[xX]\s*', '', cleaned)  # Remove leading "2x" or "2 X" etc
    
    return cleaned.strip()

def update_schematic_file(file_path):
    """Update a single schematic_data.json file, removing quantity multipliers"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            schematic = json.load(f)
        
        sku = file_path.parent.name
        changes = 0
        
        # Process parts array
        if 'parts' in schematic and isinstance(schematic['parts'], list):
            for part in schematic['parts']:
                # Clean part ID
                original_id = part.get('id', '')
                cleaned_id = clean_part_id(original_id)
                if cleaned_id != original_id:
                    part['id'] = cleaned_id
                    changes += 1
                
                # Clean part name
                original_name = part.get('name', '')
                cleaned_name = clean_part_id(original_name)
                if cleaned_name != original_name:
                    part['name'] = cleaned_name
                    changes += 1
        
        # Process coordinates object - update keys if they contained multipliers
        if 'coordinates' in schematic and isinstance(schematic['coordinates'], dict):
            coordinates_to_remove = []
            coordinates_to_add = {}
            
            for original_key, coord_data in schematic['coordinates'].items():
                cleaned_key = clean_part_id(original_key)
                
                if cleaned_key != original_key:
                    # Mark original key for removal
                    coordinates_to_remove.append(original_key)
                    # Also clean the id field inside the coordinate data
                    if isinstance(coord_data, dict):
                        coord_data['id'] = cleaned_key
                    coordinates_to_add[cleaned_key] = coord_data
                    changes += 1
            
            # Remove old keys and add new ones
            for old_key in coordinates_to_remove:
                del schematic['coordinates'][old_key]
            
            for new_key, coord_data in coordinates_to_add.items():
                schematic['coordinates'][new_key] = coord_data
        
        # Write updated file if there were changes
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(schematic, f, indent=2, ensure_ascii=False)
            print(f"  ✓ {sku}: {changes} multipliers removed")
            return changes
        else:
            print(f"  - {sku}: no multipliers found")
            return 0
        
    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return 0

def find_all_schematic_files():
    """Find all schematic_data.json files"""
    return sorted(SCHEMATICS_DIR.rglob("schematic_data.json"))

def main():
    print("Finding all schematic_data.json files...\n")
    schematic_files = find_all_schematic_files()
    print(f"Found {len(schematic_files)} schematic files\n")
    
    print("Removing quantity multipliers from part IDs and names...\n")
    
    total_changes = 0
    for file_path in schematic_files:
        changes = update_schematic_file(file_path)
        total_changes += changes
    
    print(f"\n✓ Completed! Total {total_changes} multipliers removed across all files")

if __name__ == "__main__":
    main()
