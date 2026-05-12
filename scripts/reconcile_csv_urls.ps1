# reconcile_csv_urls.ps1
# Fixes broken image URLs in the production CSV by applying the same rename
# logic (backwards-walk SKU extraction) to compute the correct new filename.
#
# Usage:
#   .\reconcile_csv_urls.ps1           # dry-run: report what would change
#   .\reconcile_csv_urls.ps1 -Apply    # patch the CSV

param([switch]$Apply)

$csvPath = "c:\Users\Elliott\drywall-toolbox\products\Production\catalogs\official\woocommerce_catalog_production.csv"
$imgDir  = "c:\Users\Elliott\drywall-toolbox\products\Production\Images"
$baseUrl = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/media"

$brandPrefixes = @("dura-stilts", "asgard", "columbia", "platinum", "surpro", "tapetech")

function Get-Brand([string]$basename) {
    foreach ($b in $brandPrefixes) {
        if ($basename.StartsWith("$b-")) { return $b }
    }
    return $null
}

function Is-SkuToken([string]$tok) {
    return ($tok -cmatch '^[A-Z][A-Z0-9]*$') -or ($tok -cmatch '^[0-9]+[A-Z][A-Z0-9]*$')
}

function Get-SkuByWalk([string]$basename, [string]$brand) {
    $parts    = $basename -split '-'
    $brandLen = ($brand -split '-').Count
    $seq      = $parts[-1]
    if ($seq -notmatch '^\d{2}$') { return $null }

    $skuTokens = [System.Collections.Generic.List[string]]::new()
    $i = $parts.Count - 2

    while ($i -ge $brandLen) {
        $tok = $parts[$i]
        if (Is-SkuToken $tok) {
            $skuTokens.Insert(0, $tok)
            $i--
        }
        elseif ($tok -match '^\d+$') {
            $numChain = [System.Collections.Generic.List[string]]::new()
            $j = $i
            while ($j -ge $brandLen -and ($parts[$j] -match '^\d+$')) {
                $numChain.Insert(0, $parts[$j])
                $j--
            }
            if ($j -ge $brandLen -and (Is-SkuToken $parts[$j])) {
                foreach ($n in $numChain) { $skuTokens.Insert(0, $n) }
                $i = $j
            }
            else { break }
        }
        else { break }
    }

    if ($skuTokens.Count -eq 0) { return $null }
    return ($skuTokens -join '-')
}

# Build disk file set for fast lookup
$diskFiles = @{}
Get-ChildItem $imgDir -Filter "*.webp" | ForEach-Object { $diskFiles[$_.Name] = $true }

# Hard-coded fixes for deleted angle-head long-form duplicates.
# These files were intentionally deleted; their CSV references must redirect
# to the surviving short-form files.
$hardFixes = @{
    "columbia-angle-head-2-5-2-5AH-01.webp" = "columbia-2-5AH-01.webp"
    "columbia-angle-head-2-5-2-5AH-02.webp" = "columbia-2-5AH-02.webp"
    "columbia-angle-head-2-5-2-5AH-03.webp" = "columbia-2-5AH-03.webp"
    "columbia-angle-head-3-5-3-5AH-01.webp" = "columbia-3-5AH-01.webp"
    "columbia-angle-head-3-5-3-5AH-02.webp" = "columbia-3-5AH-02.webp"
    "columbia-angle-head-3-5-3-5AH-03.webp" = "columbia-3-5AH-03.webp"
}

# Scan CSV for broken URLs and build old→new map
$fixes   = @{}   # old-filename → new-filename
$noFix   = [System.Collections.Generic.List[string]]::new()

# Seed with hard-coded angle-head redirects
foreach ($kv in $hardFixes.GetEnumerator()) { $fixes[$kv.Key] = $kv.Value }

$csv = Import-Csv $csvPath
foreach ($row in $csv) {
    if (-not $row.Images) { continue }
    foreach ($rawUrl in ($row.Images -split ',')) {
        $url   = $rawUrl.Trim()
        $fname = [System.IO.Path]::GetFileName($url)
        if (-not $fname -or $diskFiles.ContainsKey($fname)) { continue }
        if ($fixes.ContainsKey($fname) -or ($noFix -contains $fname)) { continue }

        # File not on disk — compute what it should have been renamed to
        $brand = Get-Brand ([System.IO.Path]::GetFileNameWithoutExtension($fname))
        if (-not $brand) { $noFix.Add($fname); continue }

        $basename = [System.IO.Path]::GetFileNameWithoutExtension($fname)
        $seq      = ($basename -split '-')[-1]
        if ($seq -notmatch '^\d{2}$') { $noFix.Add($fname); continue }

        $sku = Get-SkuByWalk $basename $brand
        if (-not $sku) { $noFix.Add($fname); continue }

        $newName = "$brand-$sku-$seq.webp"

        if ($diskFiles.ContainsKey($newName)) {
            $fixes[$fname] = $newName
        } else {
            $noFix.Add($fname)
        }
    }
}

# Report
Write-Host ""
Write-Host "=== CSV URL RECONCILIATION ===" -ForegroundColor Cyan
Write-Host "Fixable broken URLs : $($fixes.Count)"
Write-Host "Unfixable (no match): $($noFix.Count)"

if ($noFix.Count -gt 0) {
    Write-Host ""
    Write-Host "=== UNFIXABLE (manual review) ===" -ForegroundColor Red
    $noFix | Select-Object -Unique | ForEach-Object { Write-Host "  $_" }
}

Write-Host ""
Write-Host "=== FIXES (sample, first 20) ===" -ForegroundColor Cyan
$fixes.GetEnumerator() | Select-Object -First 20 | ForEach-Object {
    Write-Host "  $($_.Key)"
    Write-Host "    -> $($_.Value)" -ForegroundColor Green
}

if ($Apply) {
    Write-Host ""
    Write-Host "Patching CSV..." -ForegroundColor Cyan
    $csvText = Get-Content $csvPath -Raw
    $count = 0
    foreach ($kv in $fixes.GetEnumerator()) {
        $oldUrl = "$baseUrl/$($kv.Key)"
        $newUrl = "$baseUrl/$($kv.Value)"
        if ($csvText.Contains($oldUrl)) {
            $csvText = $csvText.Replace($oldUrl, $newUrl)
            $count++
        }
    }
    Set-Content $csvPath -Value $csvText -NoNewline
    Write-Host "  ✓ Patched $count URL(s)." -ForegroundColor Green
    Write-Host ""

    # Final integrity check
    $stillBroken = @()
    foreach ($row in (Import-Csv $csvPath)) {
        if (-not $row.Images) { continue }
        foreach ($url in ($row.Images -split ',')) {
            $f = [System.IO.Path]::GetFileName($url.Trim())
            if ($f -and -not $diskFiles.ContainsKey($f)) { $stillBroken += $f }
        }
    }
    Write-Host "Post-patch broken URLs: $($stillBroken.Count)" -ForegroundColor $(if ($stillBroken.Count -eq 0) { 'Green' } else { 'Red' })
    if ($stillBroken.Count -gt 0) { $stillBroken | Select-Object -Unique | ForEach-Object { Write-Host "  STILL BROKEN: $_" } }
}
