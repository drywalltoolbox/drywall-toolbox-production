# dedupe_images.ps1
# Finds byte-identical duplicate images in Production/Images using SHA256 hashing.
# Within each group of identical files, keeps the one with the lowest sequence number.
# Removes duplicates from disk and strips their URLs from the production CSV.
#
# Usage:
#   .\dedupe_images.ps1          # dry-run (safe, no changes)
#   .\dedupe_images.ps1 -Apply   # delete files + update CSV

param([switch]$Apply)

$imgDir  = "c:\Users\Elliott\drywall-toolbox\products\Production\Images"
$csvPath = "c:\Users\Elliott\drywall-toolbox\products\Production\catalogs\official\woocommerce_catalog_production.csv"
$baseUrl = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/media"

# ── Step 1: Hash every file ────────────────────────────────────────────────────
Write-Host "Hashing images..." -ForegroundColor Cyan
$files  = Get-ChildItem $imgDir -Filter "*.webp"
$byHash = @{}   # hash → [List of filenames]

foreach ($f in $files) {
    $hash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    if (-not $byHash.ContainsKey($hash)) {
        $byHash[$hash] = [System.Collections.Generic.List[string]]::new()
    }
    $byHash[$hash].Add($f.Name)
}

# ── Step 2: Find duplicate groups ─────────────────────────────────────────────
# Groups with >1 file sharing the same hash
$dupGroups = $byHash.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }

$toKeep   = [System.Collections.Generic.List[string]]::new()
$toDelete = [System.Collections.Generic.List[string]]::new()

foreach ($group in $dupGroups) {
    # Sort by filename so lowest sequence (e.g. -01) comes first
    $sorted = $group.Value | Sort-Object
    $keep   = $sorted[0]
    $toKeep.Add($keep)
    for ($i = 1; $i -lt $sorted.Count; $i++) {
        $toDelete.Add($sorted[$i])
    }
}

# ── Step 3: Report ─────────────────────────────────────────────────────────────
$mode = if ($Apply) { "APPLY" } else { "DRY-RUN" }
Write-Host ""
Write-Host "=== DEDUPE $mode REPORT ===" -ForegroundColor Cyan
Write-Host "Total files      : $($files.Count)"
Write-Host "Duplicate groups : $($dupGroups | Measure-Object).Count"
Write-Host "Files to delete  : $($toDelete.Count)"
Write-Host "Files to keep    : $($toKeep.Count)"
Write-Host ""

Write-Host "=== DUPLICATE GROUPS ===" -ForegroundColor Yellow
foreach ($group in ($dupGroups | Sort-Object { $_.Value[0] })) {
    $sorted = $group.Value | Sort-Object
    $keep   = $sorted[0]
    Write-Host "  KEEP   : $keep" -ForegroundColor Green
    for ($i = 1; $i -lt $sorted.Count; $i++) {
        Write-Host "  DELETE : $($sorted[$i])" -ForegroundColor Red
    }
    Write-Host ""
}

# ── Step 4: Apply ──────────────────────────────────────────────────────────────
if ($Apply) {
    # 4a. Delete duplicate files from disk
    Write-Host "Deleting $($toDelete.Count) duplicate files..." -ForegroundColor Cyan
    foreach ($fname in $toDelete) {
        Remove-Item (Join-Path $imgDir $fname) -ErrorAction Stop
    }
    Write-Host "  ✓ Deleted." -ForegroundColor Green

    # 4b. Strip deleted URLs from CSV
    Write-Host "Updating CSV..." -ForegroundColor Cyan
    $csvText = Get-Content $csvPath -Raw
    $removed = 0

    foreach ($fname in $toDelete) {
        $delUrl = "$baseUrl/$fname"
        if ($csvText.Contains($delUrl)) {
            # Remove from comma-separated image lists cleanly
            $csvText = $csvText -replace (', ' + [regex]::Escape($delUrl)), ''
            $csvText = $csvText -replace ([regex]::Escape($delUrl) + ', '), ''
            $csvText = $csvText -replace [regex]::Escape($delUrl), ''
            $removed++
        }
    }

    Set-Content $csvPath -Value $csvText -NoNewline
    Write-Host "  ✓ Removed $removed URL(s) from CSV." -ForegroundColor Green

    # 4c. Final integrity check
    Write-Host ""
    $broken = @()
    $diskFiles = @{}
    Get-ChildItem $imgDir -Filter "*.webp" | ForEach-Object { $diskFiles[$_.Name] = $true }
    foreach ($row in (Import-Csv $csvPath)) {
        if (-not $row.Images) { continue }
        foreach ($url in ($row.Images -split ',')) {
            $f = [System.IO.Path]::GetFileName($url.Trim())
            if ($f -and -not $diskFiles.ContainsKey($f)) { $broken += $f }
        }
    }
    $diskCount = (Get-ChildItem $imgDir -Filter "*.webp").Count
    Write-Host "Post-dedupe disk count : $diskCount" -ForegroundColor Cyan
    Write-Host "Post-dedupe broken URLs: $($broken.Count)" -ForegroundColor $(if ($broken.Count -eq 0) { 'Green' } else { 'Red' })
    if ($broken.Count -gt 0) {
        $broken | Select-Object -Unique | ForEach-Object { Write-Host "  BROKEN: $_" -ForegroundColor Red }
    }
}
