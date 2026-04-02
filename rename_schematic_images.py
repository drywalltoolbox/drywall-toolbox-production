#!/usr/bin/env python3
"""
Script to rename all PNG images in Asgard Schematics to match schematic_data.json titles
"""

import os
import json
import re
from pathlib import Path

def rename_schematic_images():
    base_path = Path(r"c:\Users\Elliott\drywall-toolbox\frontend\public\brands\Asgard\Schematics")
    
    if not base_path.exists():
        print(f"❌ Base path does not exist: {base_path}")
        return
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    # Find all directories containing schematic_data.json
    for schematic_data_file in base_path.rglob("schematic_data.json"):
        dir_path = schematic_data_file.parent
        images_dir = dir_path / "images"
        
        # Skip if no images directory
        if not images_dir.exists():
            print(f"⊘ SKIP: No images folder in {dir_path.name}")
            skip_count += 1
            continue
        
        try:
            # Read schematic_data.json
            with open(schematic_data_file, 'r', encoding='utf-8') as f:
                schematic_data = json.load(f)
            
            title = schematic_data.get('title')
            
            if not title:
                print(f"⊘ SKIP: No title found in {dir_path.name}")
                skip_count += 1
                continue
            
            # Get all PNG files in images directory
            png_files = sorted(images_dir.glob("*.png"))
            
            if not png_files:
                print(f"⊘ SKIP: No PNG files in {dir_path.name}")
                skip_count += 1
                continue
            
            # Rename each PNG file
            file_index = 1
            for png_file in png_files:
                # Extract page number from original filename (e.g., "page-001" -> "001")
                original_name = png_file.stem
                match = re.search(r'page-(\d+)', original_name)
                
                if match:
                    page_num = match.group(1)
                else:
                    page_num = str(file_index).zfill(3)
                
                # Create new filename: {title}-page-{pageNum}.png
                new_name = f"{title}-page-{page_num}.png"
                new_path = images_dir / new_name
                
                # Rename the file
                if png_file != new_path:
                    png_file.rename(new_path)
                    print(f"✓ Renamed: {png_file.name:30} → {new_name}")
                    success_count += 1
                else:
                    print(f"≈ SKIP: {png_file.name:30} already correct")
                    skip_count += 1
                
                file_index += 1
        
        except json.JSONDecodeError as e:
            print(f"❌ ERROR in {dir_path.name}: Invalid JSON - {e}")
            error_count += 1
        except Exception as e:
            print(f"❌ ERROR in {dir_path.name}: {e}")
            error_count += 1
    
    # Print summary
    print(f"\n{'='*60}")
    print("Summary:")
    print(f"{'='*60}")
    print(f"✓ Renamed:  {success_count} files")
    print(f"≈ Skipped:  {skip_count} files")
    print(f"❌ Errors:   {error_count} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    rename_schematic_images()
