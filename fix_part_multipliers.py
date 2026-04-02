#!/usr/bin/env python3
"""
Script to fix part IDs and names by removing 'X*' multipliers in schematic_data.json files
e.g., "209012 X2" becomes "209012", "2x 209012" becomes "209012", etc.
"""

import os
import json
import re
from pathlib import Path

def clean_part_id(part_id):
    """
    Remove quantity multipliers from part IDs and names
    Examples:
    - "209012 X2" -> "209012"
    - "2x 209012" -> "209012"
    - "2X 209012" -> "209012"
    - "6x 209016" -> "209016"
    - "059015" -> "059015" (unchanged)
    """
    # Pattern to match quantity prefix or suffix (e.g., "2x", "X2", "6x ", etc.)
    # Remove leading patterns like "2x ", "2X ", "6x "
    cleaned = re.sub(r'^(\d+)[xX]\s*', '', part_id)
    # Remove trailing patterns like " X2", " x2", " X 2"
    cleaned = re.sub(r'\s*[xX]\s*\d+$', '', cleaned)
    # Also handle cases like "2x209012" without space
    cleaned = re.sub(r'^(\d+)[xX](?=\d)', '', cleaned)
    return cleaned.strip()

def fix_schematic_file(file_path):
    """Fix a single schematic_data.json file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changes_made = 0
        
        # Fix parts array
        if 'parts' in data:
            for part in data['parts']:
                if 'id' in part and part['id']:
                    old_id = part['id']
                    new_id = clean_part_id(old_id)
                    if old_id != new_id:
                        part['id'] = new_id
                        changes_made += 1
                
                if 'name' in part and part['name']:
                    old_name = part['name']
                    new_name = clean_part_id(old_name)
                    if old_name != new_name:
                        part['name'] = new_name
                        changes_made += 1
        
        # Fix coordinates keys (need to rename keys in the object)
        if 'coordinates' in data:
            coords = data['coordinates']
            keys_to_delete = []
            keys_to_add = {}
            
            for key in coords.keys():
                new_key = clean_part_id(key)
                if key != new_key:
                    # Mark old key for deletion
                    keys_to_delete.append(key)
                    # Store new entry
                    keys_to_add[new_key] = coords[key]
                    # Also update the id within the coordinate object
                    coords[key]['id'] = new_key
                    changes_made += 1
            
            # Remove old keys
            for key in keys_to_delete:
                del coords[key]
            
            # Add new keys
            for key, value in keys_to_add.items():
                coords[key] = value
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return changes_made
        else:
            return 0
    
    except Exception as e:
        print(f"❌ ERROR in {file_path}: {e}")
        return None

def main():
    base_path = Path(r"c:\Users\Elliott\drywall-toolbox\frontend\public\brands\Asgard\Schematics")
    
    if not base_path.exists():
        print(f"❌ Base path does not exist: {base_path}")
        return
    
    total_changes = 0
    files_processed = 0
    files_with_changes = 0
    
    # Find all schematic_data.json files
    for schematic_file in sorted(base_path.rglob("schematic_data.json")):
        dir_name = schematic_file.parent.name
        result = fix_schematic_file(schematic_file)
        
        if result is not None:
            files_processed += 1
            if result > 0:
                files_with_changes += 1
                print(f"✓ {dir_name:20} | {result:3} changes")
                total_changes += result
            else:
                print(f"≈ {dir_name:20} | no changes needed")
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"{'='*60}")
    print(f"Files processed:     {files_processed}")
    print(f"Files with changes:  {files_with_changes}")
    print(f"Total changes:       {total_changes}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
