# rename_images_apply.ps1
# Hybrid rename: brand-slug-SKU-NN.webp → brand-SKU-NN.webp
#
# Strategy (in order):
#   1. Backwards-walk parser  — extracts uppercase SKU tokens from filename.
#      Handles TapeTech, Columbia, Asgard, Platinum correctly.
#   2. CSV fallback            — for files where walk fails (Dura Stilts, Surpro,
#      already-short-named files, etc.). Prefers variation/simple rows over parent.
#   3. Unparseable             — reported but skipped.
#
# Usage:
#   .\rename_images_apply.ps1              # dry-run (default, safe)
#   .\rename_images_apply.ps1 -Apply       # rename files + update CSV

param([switch]$Apply)

$imgDir  = "c:\Users\Elliott\drywall-toolbox\products\Production\Images"
$csvPath = "c:\Users\Elliott\drywall-toolbox\products\Production\catalogs\official\woocommerce_catalog_production.csv"
$baseUrl = "https://drywalltoolbox.com/wp/wp-content/uploads/2026/media"

# Known brand prefixes — order matters (longer first so dura-stilts beats dura)
$brandPrefixes = @("dura-stilts", "asgard", "columbia", "platinum", "surpro", "tapetech")

function Get-Brand([string]$basename) {
    foreach ($b in $brandPrefixes) {
        if ($basename.StartsWith("$b-")) { return $b }
    }
    return $null
}

function Is-SkuToken([string]$tok) {
    # Uppercase-leading alphanumeric: AH25, BBHE, AD, EZ10TT, 7CFB, 25AH
    return ($tok -cmatch '^[A-Z][A-Z0-9]*$') -or ($tok -cmatch '^[0-9]+[A-Z][A-Z0-9]*$')
}

# Backwards-walk: collect uppercase SKU tokens from the end of the filename.
function Get-SkuByWalk([string]$basename, [string]$brand) {
    $parts    = $basename -split '-'
    $brandLen = ($brand -split '-').Count   # tokens consumed by brand
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
            # Pure numeric: include only if anchored left to an SKU token (e.g. FFB5-8)
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

# ── CSV fallback map ───────────────────────────────────────────────────────────
# Build filename (lowercase) → SKU from CSV. Variation/simple rows take priority.

$csvVariation = @{}   # filename → [SKUs] from variation/simple rows
$csvVariable  = @{}   # filename → [SKUs] from variable (parent) rows

foreach ($row in (Import-Csv $csvPath)) {
    $sku    = $row.SKU.Trim()
    $type   = $row.Type.Trim().ToLower()
    $images = $row.Images.Trim()
    if (-not $sku -or -not $images) { continue }

    $map = if ($type -eq 'variation' -or $type -eq 'simple') { $csvVariation } else { $csvVariable }

    foreach ($url in ($images -split ',')) {
        $file = [System.IO.Path]::GetFileName($url.Trim()).ToLower()
        if (-not $file) { continue }
        if (-not $map.ContainsKey($file)) { $map[$file] = [System.Collections.Generic.List[string]]::new() }
        if ($sku -notin $map[$file]) { $map[$file].Add($sku) }
    }
}

function Get-SkuFromCsv([string]$fileKey) {
    $map = if ($csvVariation.ContainsKey($fileKey)) { $csvVariation } `
           elseif ($csvVariable.ContainsKey($fileKey)) { $csvVariable } `
           else { return $null }
    $skus = $map[$fileKey]
    if ($skus.Count -eq 1) { return $skus[0] }
    # Multiple SKUs: prefer longest (most specific)
    return ($skus | Sort-Object Length -Descending)[0]
}

# ── Build rename plan ──────────────────────────────────────────────────────────
$files    = Get-ChildItem $imgDir -Filter "*.webp"
$plan     = [System.Collections.Generic.List[PSObject]]::new()
$unparsed = [System.Collections.Generic.List[string]]::new()
$newNames = @{}   # collision detection

foreach ($f in $files) {
    $brand = Get-Brand $f.BaseName
    if (-not $brand) { $unparsed.Add($f.Name); continue }

    $seq = ($f.BaseName -split '-')[-1]
    if ($seq -notmatch '^\d{2}$') { $unparsed.Add($f.Name); continue }

    $csvKey = $f.Name.ToLower()

    # 1. Backwards-walk (primary — handles most filenames correctly)
    $sku = Get-SkuByWalk $f.BaseName $brand
    # 2. CSV fallback (variation/simple preferred over variable/parent)
    if (-not $sku) {
        $rawSku = Get-SkuFromCsv $csvKey
        if ($rawSku) { $sku = $rawSku.Replace('.', '-') }
    }
    # 3. Decimal-SKU override: if csvVariation has a dot-containing SKU for this exact file
    #    (e.g. 2.5AH, 5.5FFB), the walk strips the numeric prefix and gets it wrong.
    #    Use the normalized dot→hyphen CSV SKU instead.
    if ($csvVariation.ContainsKey($csvKey)) {
        $dotSku = $csvVariation[$csvKey] | Where-Object { $_ -match '\.' } | Select-Object -First 1
        if ($dotSku) { $sku = $dotSku.Replace('.', '-') }
    }

    if (-not $sku) { $unparsed.Add($f.Name); continue }

    $newName = "$brand-$sku-$seq.webp"
    $plan.Add([PSCustomObject]@{
        OldName = $f.Name
        NewName = $newName
        OldUrl  = "$baseUrl/$($f.Name)"
        NewUrl  = "$baseUrl/$newName"
        Changed = ($f.Name -ne $newName)
        SKU     = $sku
    })

    if ($newNames.ContainsKey($newName)) { $newNames[$newName] += $f.Name }
    else { $newNames[$newName] = @($f.Name) }
}

$changed   = $plan | Where-Object Changed
$unchanged = $plan | Where-Object { -not $_.Changed }

# Classify collisions:
#   "resolvable"  — target file already exists on disk (one entry has Changed=false).
#                   The long-form duplicates should be DELETED.
#   "blocking"    — all colliding entries want to rename; true ambiguity, needs manual fix.
$toDelete       = [System.Collections.Generic.List[string]]::new()   # long-form duplicates
$blockingNames  = [System.Collections.Generic.List[string]]::new()

foreach ($kv in ($newNames.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 })) {
    $newName    = $kv.Key
    $srcFiles   = $kv.Value
    $targetPath = Join-Path $imgDir $newName

    if (Test-Path $targetPath) {
        # Target already exists on disk — long-form sources are duplicates, delete them
        foreach ($src in $srcFiles) {
            if ($src -ne $newName) { $toDelete.Add($src) }
        }
    }
    else {
        # Target doesn't exist on disk.
        # If some colliding files are from authoritative variation/simple rows and others
        # are from variable (parent) rows only, delete the non-variation long-form duplicates.
        $varFiles    = $srcFiles | Where-Object { $csvVariation.ContainsKey($_.ToLower()) }
        $nonVarFiles = $srcFiles | Where-Object { -not $csvVariation.ContainsKey($_.ToLower()) }
        if ($varFiles.Count -gt 0 -and $nonVarFiles.Count -gt 0) {
            # Mixed: variation files win, delete long-form non-variation duplicates
            foreach ($src in $nonVarFiles) { $toDelete.Add($src) }
        }
        elseif ($varFiles.Count -eq 0) {
            # All orphan long-forms (only in parent/variable rows) — delete all duplicates;
            # their short-form counterparts are already correct or handled elsewhere in the plan
            foreach ($src in $srcFiles) { $toDelete.Add($src) }
        }
        else {
            $blockingNames.Add($newName)
        }
    }
}

# ── Report ─────────────────────────────────────────────────────────────────────
$mode = if ($Apply) { "APPLY" } else { "DRY-RUN" }
Write-Host ""
Write-Host "=== RENAME $mode REPORT ===" -ForegroundColor Cyan
Write-Host "Total files        : $($files.Count)"
Write-Host "Would rename       : $($changed.Count)"
Write-Host "Already correct    : $($unchanged.Count)"
Write-Host "Duplicate deletes  : $($toDelete.Count)"
Write-Host "No SKU found       : $($unparsed.Count)"
Write-Host "Blocking collisions: $($blockingNames.Count)"
Write-Host ""

if ($toDelete.Count -gt 0) {
    Write-Host "=== DUPLICATES TO DELETE (target already exists) ===" -ForegroundColor Yellow
    $toDelete | Sort-Object | ForEach-Object { Write-Host "  DELETE: $_" }
    Write-Host ""
}

if ($unparsed.Count -gt 0) {
    Write-Host "=== NO-SKU FILES (skipped) ===" -ForegroundColor Yellow
    $unparsed | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
}

if ($blockingNames.Count -gt 0) {
    Write-Host "=== BLOCKING COLLISIONS (manual fix needed) ===" -ForegroundColor Red
    foreach ($name in $blockingNames) {
        Write-Host "  → $name"
        $newNames[$name] | ForEach-Object { Write-Host "      FROM: $_" }
    }
    Write-Host ""
    Write-Host "⚠  Resolve blocking collisions before applying." -ForegroundColor Red
    Write-Host ""
}

Write-Host "=== SAMPLE RENAMES (first 30) ===" -ForegroundColor Cyan
$changed | Where-Object { $_.OldName -notin $toDelete } | Select-Object -First 30 | ForEach-Object {
    Write-Host "  $($_.OldName)"
    Write-Host "    -> $($_.NewName)" -ForegroundColor Green
}

# ── Apply ──────────────────────────────────────────────────────────────────────
if ($Apply) {
    if ($blockingNames.Count -gt 0) {
        Write-Host "ERROR: Cannot apply — resolve $($blockingNames.Count) blocking collision(s) first." -ForegroundColor Red
        exit 1
    }

    # Step 1: Delete long-form duplicates whose target already exists
    if ($toDelete.Count -gt 0) {
        Write-Host ""
        Write-Host "Deleting $($toDelete.Count) duplicate files..." -ForegroundColor Cyan
        foreach ($fname in $toDelete) {
            Remove-Item (Join-Path $imgDir $fname) -ErrorAction Stop
        }
        Write-Host "  ✓ Deleted." -ForegroundColor Green
    }

    # Step 2: Rename remaining files (exclude any marked for deletion)
    $toRename = $changed | Where-Object { $_.OldName -notin $toDelete }
    Write-Host ""
    Write-Host "Renaming $($toRename.Count) files..." -ForegroundColor Cyan
    foreach ($entry in $toRename) {
        $srcPath = Join-Path $imgDir $entry.OldName
        $dstPath = Join-Path $imgDir $entry.NewName
        if (Test-Path $dstPath) {
            # Target already exists (e.g. partial prior run) — source is the redundant duplicate
            Remove-Item $srcPath -ErrorAction Stop
        } else {
            Rename-Item -Path $srcPath -NewName $entry.NewName -ErrorAction Stop
        }
    }
    Write-Host "  ✓ Done." -ForegroundColor Green

    # Step 3: Update CSV — remove deleted URLs, rewrite renamed URLs
    Write-Host "Updating CSV image URLs..." -ForegroundColor Cyan
    $csvText = Get-Content $csvPath -Raw

    # Remove deleted file URLs from CSV (strip from comma-separated lists)
    $deletedRemoved = 0
    foreach ($fname in $toDelete) {
        $delUrl = "$baseUrl/$fname"
        # Remove ", <url>" or "<url>, " or lone "<url>"
        if ($csvText -match [regex]::Escape($delUrl)) {
            $csvText = $csvText -replace (', ' + [regex]::Escape($delUrl)), ''
            $csvText = $csvText -replace ([regex]::Escape($delUrl) + ', '), ''
            $csvText = $csvText -replace [regex]::Escape($delUrl), ''
            $deletedRemoved++
        }
    }

    # Rewrite renamed URLs
    $urlsUpdated = 0
    foreach ($entry in $toRename) {
        if ($csvText.Contains($entry.OldUrl)) {
            $csvText = $csvText.Replace($entry.OldUrl, $entry.NewUrl)
            $urlsUpdated++
        }
    }

    Set-Content $csvPath -Value $csvText -NoNewline
    Write-Host "  ✓ Removed $deletedRemoved duplicate URL(s), updated $urlsUpdated renamed URL(s)." -ForegroundColor Green
    Write-Host ""
    Write-Host "Complete. Run integrity check to verify 0 broken links." -ForegroundColor Cyan
}
