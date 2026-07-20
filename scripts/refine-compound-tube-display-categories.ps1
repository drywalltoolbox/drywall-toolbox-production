param(
    [string] $LaunchCatalogPath = 'products/Production/launch/dtb_woocommerce_official_catalog.csv'
)

$ErrorActionPreference = 'Stop'

function ConvertFrom-CsvLine {
    param([string] $Line)

    $fields = New-Object System.Collections.Generic.List[string]
    $current = New-Object System.Text.StringBuilder
    $inQuotes = $false

    for ($i = 0; $i -lt $Line.Length; $i++) {
        $char = $Line[$i]
        if ($char -eq '"') {
            if ($inQuotes -and ($i + 1) -lt $Line.Length -and $Line[$i + 1] -eq '"') {
                [void] $current.Append('"')
                $i++
                continue
            }
            $inQuotes = -not $inQuotes
            continue
        }
        if ($char -eq ',' -and -not $inQuotes) {
            $fields.Add($current.ToString())
            [void] $current.Clear()
            continue
        }
        [void] $current.Append($char)
    }

    $fields.Add($current.ToString())
    return ,$fields.ToArray()
}

function ConvertTo-CsvLine {
    param([string[]] $Fields)

    $escaped = foreach ($field in $Fields) {
        $value = if ($null -eq $field) { '' } else { [string] $field }
        if ($value.Contains('"') -or $value.Contains(',') -or $value.Contains("`r") -or $value.Contains("`n")) {
            '"' + $value.Replace('"', '""') + '"'
        } else {
            $value
        }
    }

    return ($escaped -join ',')
}

$targetSkus = [System.Collections.Generic.HashSet[string]]::new(
    [string[]] @(
        'COL-CAM-LOCK-TUBE', 'CLT24', 'CLT32', 'CLT42', 'CLT55',
        'COL-COMPOUND-TUBE', 'CMT24', 'CMT32', 'CMT42', 'CMT55',
        'PCLT42', 'PCMT42', '4-741',
        'PT-CT', 'PT-CT24', 'PT-CT36', 'PT-CT42',
        'TT-COMPOUND-TUBE', 'CT24TT', 'CT36TT', 'CT42TT'
    ),
    [System.StringComparer]::OrdinalIgnoreCase
)

$resolvedPath = (Resolve-Path -LiteralPath $LaunchCatalogPath).Path
$lines = [System.IO.File]::ReadAllLines($resolvedPath)
if ($lines.Count -lt 2) {
    throw "Launch catalog is empty: $LaunchCatalogPath"
}

$headers = ConvertFrom-CsvLine $lines[0]
$skuIndex = [Array]::IndexOf($headers, 'SKU')
$displayCategoryIndex = [Array]::IndexOf($headers, 'Meta: _dtb_display_category_key')
if ($skuIndex -lt 0 -or $displayCategoryIndex -lt 0) {
    throw 'Required SKU or display-category column is missing.'
}

$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$updatedLines = New-Object System.Collections.Generic.List[string]
$updatedLines.Add($lines[0])
$updatedCount = 0

for ($lineNumber = 1; $lineNumber -lt $lines.Count; $lineNumber++) {
    $fields = ConvertFrom-CsvLine $lines[$lineNumber]
    $sku = if ($fields.Count -gt $skuIndex) { $fields[$skuIndex].Trim() } else { '' }
    if (-not $targetSkus.Contains($sku)) {
        $updatedLines.Add($lines[$lineNumber])
        continue
    }

    if ($fields.Count -ne $headers.Count) {
        throw "Column-count mismatch for targeted SKU $sku on CSV line $($lineNumber + 1)."
    }

    if (-not $seen.Add($sku)) {
        throw "Duplicate targeted SKU: $sku"
    }

    if ($fields[$displayCategoryIndex] -ne 'compound_tubes') {
        $fields[$displayCategoryIndex] = 'compound_tubes'
        $updatedCount++
    }
    $updatedLines.Add((ConvertTo-CsvLine $fields))
}

$missing = $targetSkus | Where-Object { -not $seen.Contains($_) } | Sort-Object
if ($missing.Count -gt 0) {
    throw "Target SKUs missing from launch catalog: $($missing -join ', ')"
}

$tempPath = "$resolvedPath.tmp"
[System.IO.File]::WriteAllLines($tempPath, $updatedLines, [System.Text.UTF8Encoding]::new($true))
[System.IO.File]::Move($tempPath, $resolvedPath, $true)

Write-Output "Mapped $updatedCount compound/cam-lock tube rows to compound_tubes; validated $($targetSkus.Count) target SKUs."
