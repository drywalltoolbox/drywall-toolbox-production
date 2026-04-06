import os
from pathlib import Path
from PIL import Image
import json
from datetime import datetime
import hashlib

# Image directory
images_dir = r"c:\Users\Elliott\drywall-toolbox\frontend\public\brands\Platinum\Products"
report_file = r"c:\Users\Elliott\drywall-toolbox\scraped_results\image_dedup_report.json"

def get_image_content_hash(filepath):
    """Get hash of image file content to identify duplicates"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception as e:
        print(f"Error hashing {filepath}: {e}")
        return None

def get_file_size(filepath):
    """Get file size in bytes"""
    try:
        return os.path.getsize(filepath)
    except:
        return 0

def get_image_dimensions(filepath):
    """Get image dimensions (width x height)"""
    try:
        img = Image.open(filepath)
        return img.size
    except:
        return (0, 0)

def deduplicate_images():
    """Find and remove duplicate images, keeping only the largest"""
    
    print("\n" + "="*100)
    print("IMAGE DEDUPLICATION AUDIT")
    print("="*100)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Source Directory: {images_dir}\n")
    
    # Get all WebP files
    webp_files = sorted(Path(images_dir).glob("*.webp"))
    print(f"Total WebP files found: {len(webp_files)}\n")
    
    # Dictionary to store hash -> list of files
    hash_groups = {}
    file_info = {}
    
    print("Analyzing images...")
    for idx, filepath in enumerate(webp_files, 1):
        filename = filepath.name
        file_size = get_file_size(filepath)
        dimensions = get_image_dimensions(filepath)
        file_hash = get_image_content_hash(filepath)
        
        file_info[filename] = {
            'path': str(filepath),
            'size_bytes': file_size,
            'dimensions': dimensions,
            'hash': file_hash
        }
        
        if file_hash:
            if file_hash not in hash_groups:
                hash_groups[file_hash] = []
            hash_groups[file_hash].append(filename)
    
    # Find duplicates and mark for deletion
    duplicates = {k: v for k, v in hash_groups.items() if len(v) > 1}
    unique_hashes = {k: v for k, v in hash_groups.items() if len(v) == 1}
    
    print(f"\nAnalysis Results:")
    print(f"  Unique images: {len(unique_hashes)}")
    print(f"  Duplicate groups: {len(duplicates)}")
    
    # Calculate total space savings
    files_to_delete = []
    total_deleted_size = 0
    
    print(f"\n{'='*100}")
    print("DUPLICATE GROUPS (keeping largest, deleting others):")
    print(f"{'='*100}\n")
    
    for hash_idx, (file_hash, filenames) in enumerate(sorted(duplicates.items()), 1):
        # Sort by file size (descending) to keep the largest
        sorted_files = sorted(filenames, key=lambda f: file_info[f]['size_bytes'], reverse=True)
        
        largest_file = sorted_files[0]
        largest_size = file_info[largest_file]['size_bytes']
        largest_dims = file_info[largest_file]['dimensions']
        
        print(f"[Group {hash_idx}] Keeping: {largest_file}")
        print(f"  Size: {largest_size:,} bytes | Dimensions: {largest_dims[0]}x{largest_dims[1]}")
        
        # Mark others for deletion
        for file_to_delete in sorted_files[1:]:
            delete_size = file_info[file_to_delete]['size_bytes']
            delete_dims = file_info[file_to_delete]['dimensions']
            files_to_delete.append(file_to_delete)
            total_deleted_size += delete_size
            print(f"    ❌ DELETE: {file_to_delete} ({delete_size:,} bytes | {delete_dims[0]}x{delete_dims[1]})")
        
        print()
    
    # Summary
    print(f"{'='*100}")
    print("DEDUPLICATION SUMMARY")
    print(f"{'='*100}")
    print(f"Total files to delete: {len(files_to_delete)}")
    print(f"Total space to free: {total_deleted_size:,} bytes ({total_deleted_size / 1024 / 1024:.2f} MB)")
    print(f"Files to keep: {len(webp_files) - len(files_to_delete)}")
    print(f"Total size after cleanup: {sum(file_info[f]['size_bytes'] for f in file_info if f not in files_to_delete):,} bytes")
    
    # Create report
    report = {
        'timestamp': datetime.now().isoformat(),
        'total_files': len(webp_files),
        'unique_images': len(unique_hashes),
        'duplicate_groups': len(duplicates),
        'files_to_delete': files_to_delete,
        'total_deleted_size_bytes': total_deleted_size,
        'total_deleted_size_mb': round(total_deleted_size / 1024 / 1024, 2),
        'file_info': file_info,
        'duplicate_groups_detail': {
            file_hash: sorted(filenames, key=lambda f: file_info[f]['size_bytes'], reverse=True)
            for file_hash, filenames in sorted(duplicates.items())
        }
    }
    
    # Save report
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✓ Report saved to: {report_file}")
    
    # Prompt for deletion
    print(f"\n{'='*100}")
    response = input("Delete duplicate files? (yes/no): ").strip().lower()
    
    if response == 'yes':
        print(f"\nDeleting {len(files_to_delete)} duplicate files...")
        deleted_count = 0
        
        for filename in files_to_delete:
            filepath = Path(images_dir) / filename
            try:
                filepath.unlink()
                deleted_count += 1
                print(f"  ✓ Deleted: {filename}")
            except Exception as e:
                print(f"  ❌ Error deleting {filename}: {e}")
        
        print(f"\n{'='*100}")
        print(f"Successfully deleted: {deleted_count}/{len(files_to_delete)} files")
        print(f"Space freed: {total_deleted_size:,} bytes ({total_deleted_size / 1024 / 1024:.2f} MB)")
        print(f"{'='*100}\n")
        
        # Update report with deletion status
        report['deleted'] = True
        report['deleted_count'] = deleted_count
        report['delete_timestamp'] = datetime.now().isoformat()
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
    else:
        print("\n⚠ Deletion cancelled. No files were deleted.")
        report['deleted'] = False
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

if __name__ == "__main__":
    try:
        deduplicate_images()
    except KeyboardInterrupt:
        print("\n\n⚠ Operation interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
