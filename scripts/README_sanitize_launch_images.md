# Launch Images Sanitizer

Audits and sanitizes image files in `products/Production/launch_images` by:

- detecting exact duplicate content (SHA1-based)
- detecting thumbnail-like files
- detecting invalid dimensions and file-size outliers
- optionally moving bad files to quarantine (non-destructive)

## Script

- `scripts/sanitize_launch_images.py`

## Default rules

- `min_width = 600`
- `min_height = 600`
- `max_width = 10000`
- `max_height = 10000`
- `min_bytes = 2000`
- `max_bytes = 20000000`
- thumbnail-like if both sides `<= 400`

These are adjustable with CLI flags.

## Audit only (safe)

```powershell
C:/Users/Elliott/AppData/Local/Programs/Python/Python311/python.exe c:/Users/Elliott/drywall-toolbox/scripts/sanitize_launch_images.py
```

Outputs:

- `products/Production/launch_images/audit_reports/image_audit_*.csv`
- `products/Production/launch_images/audit_reports/image_audit_*.json`
- `products/Production/launch_images/audit_reports/image_audit_summary_*.json`

## Apply cleanup (moves files, does not delete)

```powershell
C:/Users/Elliott/AppData/Local/Programs/Python/Python311/python.exe c:/Users/Elliott/drywall-toolbox/scripts/sanitize_launch_images.py --apply
```

Quarantine location:

- `products/Production/launch_images/quarantine/duplicates/`
- `products/Production/launch_images/quarantine/invalid/`

## Include non-webp files

```powershell
C:/Users/Elliott/AppData/Local/Programs/Python/Python311/python.exe c:/Users/Elliott/drywall-toolbox/scripts/sanitize_launch_images.py --include-non-webp
```

## Example stricter run

```powershell
C:/Users/Elliott/AppData/Local/Programs/Python/Python311/python.exe c:/Users/Elliott/drywall-toolbox/scripts/sanitize_launch_images.py --min-width 800 --min-height 800 --thumb-max-side 500
```

## Notes

- Duplicates are identified by exact file content hash, not filename.
- In each duplicate cluster, one canonical file is kept (largest resolution/size wins).
- Cleanup is reversible because files are moved, not deleted.
