param(
    [string]$BrandsRoot = "d:/AMD/projects/drywall-toolbox/frontend/public/brands"
)

$ErrorActionPreference = 'Stop'

$destRoot = Join-Path $BrandsRoot 'wp_schematics'
$extensions = @('.webp', '.png', '.jpg', '.jpeg', '.avif')

function Normalize-Name {
    param([string]$Value)
    if ($null -eq $Value) { return '' }
    return ([regex]::Replace($Value.ToLowerInvariant(), '[^a-z0-9]', ''))
}

if (Test-Path $destRoot) {
    Get-ChildItem -LiteralPath $destRoot -Force | Remove-Item -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

$records = New-Object System.Collections.Generic.List[object]

Get-ChildItem -Path $BrandsRoot -Recurse -Filter 'schematic_data.json' -File |
    Where-Object { $_.FullName -notlike '*\wp_schematics\*' } |
    ForEach-Object {
        $jsonPath = $_.FullName

        try {
            $json = Get-Content -Raw -LiteralPath $jsonPath | ConvertFrom-Json
        }
        catch {
            $records.Add([pscustomobject]@{
                    json        = $jsonPath
                    title       = ''
                    status      = 'invalid_json'
                    copied_count = 0
                    detail      = $_.Exception.Message
                })
            return
        }

        $title = [string]$json.title
        if ([string]::IsNullOrWhiteSpace($title)) {
            $records.Add([pscustomobject]@{
                    json        = $jsonPath
                    title       = ''
                    status      = 'missing_title'
                    copied_count = 0
                    detail      = 'No title in schematic_data.json'
                })
            return
        }

        $titleNorm = Normalize-Name $title
        $schematicDir = $_.DirectoryName

        $allImageFiles = Get-ChildItem -Path $schematicDir -Recurse -File |
            Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }

        $exactMatches = @($allImageFiles | Where-Object { (Normalize-Name $_.BaseName) -eq $titleNorm })

        if ($exactMatches.Count -gt 0) {
            # If multiple normalized-exact files exist, keep the largest only.
            $selected = @($exactMatches | Sort-Object Length -Descending | Select-Object -First 1)
        }
        else {
            # Handle title + page suffix variants, e.g. 4-765_SCH -> 4-765-SCH-PAGE-001.webp
            $selected = @($allImageFiles | Where-Object { (Normalize-Name $_.BaseName).StartsWith($titleNorm) } | Sort-Object FullName)
        }

        if ($selected.Count -eq 0) {
            $records.Add([pscustomobject]@{
                    json        = $jsonPath
                    title       = $title
                    status      = 'missing_image'
                    copied_count = 0
                    detail      = 'No image matched normalized title in schematic folder tree'
                })
            return
        }

        foreach ($file in $selected) {
            $relativeFile = [System.IO.Path]::GetRelativePath($BrandsRoot, $file.FullName)
            $targetPath = Join-Path $destRoot $relativeFile
            $targetDir = Split-Path -Parent $targetPath
            New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
            Copy-Item -LiteralPath $file.FullName -Destination $targetPath -Force
        }

        $records.Add([pscustomobject]@{
                json        = $jsonPath
                title       = $title
                status      = 'copied'
                copied_count = $selected.Count
            })
    }

$summary = [ordered]@{
    scanned       = ($records | Measure-Object).Count
    copied_entries = ($records | Where-Object status -eq 'copied' | Measure-Object).Count
    copied_files  = (($records | Where-Object status -eq 'copied' | ForEach-Object copied_count | Measure-Object -Sum).Sum)
    missing_image = ($records | Where-Object status -eq 'missing_image' | Measure-Object).Count
    missing_title = ($records | Where-Object status -eq 'missing_title' | Measure-Object).Count
    invalid_json  = ($records | Where-Object status -eq 'invalid_json' | Measure-Object).Count
    destination   = $destRoot
}

$reportPath = Join-Path $destRoot '_schematic_extraction_report.json'
[pscustomobject]@{
    summary = $summary
    missing = @($records | Where-Object { $_.status -ne 'copied' } | Select-Object -First 500)
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Output ('SUMMARY ' + ($summary | ConvertTo-Json -Compress))
Write-Output ('REPORT ' + $reportPath)
