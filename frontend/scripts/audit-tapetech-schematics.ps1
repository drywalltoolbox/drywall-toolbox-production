param(
  [switch]$ApplyArchive
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$catalogPath = Join-Path $repoRoot 'products/Production/launch/dtb_woocommerce_official_catalog.csv'
$libraryPath = Join-Path $repoRoot 'frontend/public/brands/TapeTech/Schematics'
$archivePath = Join-Path $libraryPath '_archived_not_in_catalog'
$reportPath = Join-Path $repoRoot 'products/Production/launch/tapetech_schematics_coverage_audit.md'

if (-not (Test-Path $catalogPath)) { throw "Catalog not found: $catalogPath" }
if (-not (Test-Path $libraryPath)) { throw "Library path not found: $libraryPath" }

$catalogAll = Import-Csv $catalogPath | Where-Object { $_.Brands -eq 'TapeTech' -and $_.Published -eq '1' }
$catalogEligible = $catalogAll | Where-Object {
  $_.'Meta: _dtb_product_kind' -eq 'drywall-finishing-tool' -and
  $_.Type -in @('simple', 'variation') -and
  $_.SKU -and
  -not ($_.SKU -like 'TT-*') -and
  -not ($_.SKU -like 'COL-*')
}

$catalogSkusEligible = @($catalogEligible | ForEach-Object { $_.SKU.Trim().ToUpper() } | Sort-Object -Unique)
$libSkus = @((Get-ChildItem -Directory $libraryPath | Where-Object { $_.Name -ne '_archived_not_in_catalog' } | Select-Object -ExpandProperty Name) | ForEach-Object { $_.Trim().ToUpper() } | Sort-Object -Unique)

$removeCandidates = $libSkus | Where-Object { $_ -notin $catalogSkusEligible }
$missingInLibrary = $catalogSkusEligible | Where-Object { $_ -notin $libSkus }

$report = @()
$report += '# TapeTech Schematic Coverage Audit'
$report += "Catalog source: $catalogPath"
$report += "Schematics library: $libraryPath"
$report += ''
$report += '## Counts'
$report += "- Published TapeTech schematic-eligible SKUs: $($catalogSkusEligible.Count)"
$report += "- Current TapeTech library folders: $($libSkus.Count)"
$report += ''
$report += '## Active Library SKUs'
$report += ($libSkus -join ', ')
$report += ''
$report += '## Remove / Archive Candidates (in library, not in schematic-eligible catalog)'
$report += ($(if ($removeCandidates.Count) { $removeCandidates -join ', ' } else { 'None' }))
$report += ''
$report += '## Missing Schematics (eligible catalog SKUs not in library)'
$report += ($(if ($missingInLibrary.Count) { $missingInLibrary -join ', ' } else { 'None' }))
$report += ''
$report += '## Missing Eligible SKU -> Catalog Name'
foreach ($sku in $missingInLibrary) {
  $row = $catalogEligible | Where-Object { $_.SKU.Trim().ToUpper() -eq $sku } | Select-Object -First 1
  if ($row) { $report += "- $sku :: $($row.Name)" }
}

$report -join "`n" | Set-Content -Path $reportPath -Encoding UTF8
Write-Host "Wrote report: $reportPath"

if ($ApplyArchive -and $removeCandidates.Count -gt 0) {
  if (-not (Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath | Out-Null
  }

  foreach ($sku in $removeCandidates) {
    $src = Join-Path $libraryPath $sku
    $dst = Join-Path $archivePath $sku
    if (Test-Path $src) {
      Move-Item -LiteralPath $src -Destination $dst -Force
      Write-Host "Archived: $sku"
    }
  }
  Write-Host "Archive complete: $archivePath"
} else {
  Write-Host 'Dry run mode: no folders moved. Use -ApplyArchive to archive candidates.'
}
