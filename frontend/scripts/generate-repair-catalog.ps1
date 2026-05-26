param(
  [string]$CsvPath = 'products/Production/catalogs/official/woocommerce_catalog_production.csv',
  [string]$OutPath = 'frontend/src/data/repairCatalogOfficial.generated.js'
)

$rows = Import-Csv -Path $CsvPath

function To-TitleCaseFromKey([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return '' }
  $v = $value.Trim().ToLower()
  $special = @{
    'automatic_tapers' = 'Automatic Tapers'
    'semi_automatic_tapers' = 'Semi-Automatic Tapers'
    'finishing_boxes' = 'Finishing Boxes'
    'corner_boxes' = 'Corner Boxes'
    'corner_tools' = 'Corner Tools'
    'angle_heads' = 'Angle Heads'
    'corner_rollers' = 'Corner Rollers'
    'corner_flushers' = 'Corner Flushers'
    'nail_spotters' = 'Nail Spotters'
    'compound_tubes' = 'Compound Tubes'
    'smoothing_blades' = 'Smoothing Blades'
    'drywall_stilts' = 'Stilts'
  }
  if ($special.ContainsKey($v)) { return $special[$v] }
  $parts = $v -split '_' | Where-Object { $_ -ne '' } | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }
  return ($parts -join ' ')
}

$brands = @{}
foreach ($r in $rows) {
  $brand = "$($r.'Meta: _dtb_brand_label')".Trim()
  if (-not $brand) { $brand = "$($r.Brands)".Trim() }
  if (-not $brand) { continue }

  $categoryKey = "$($r.'Meta: _dtb_display_category_key')".Trim().ToLower()
  if (-not $categoryKey) { $categoryKey = "$($r.'Meta: _dtb_category_key')".Trim().ToLower() }
  if (-not $categoryKey) { continue }

  $categoryLabel = To-TitleCaseFromKey $categoryKey
  if (-not $categoryLabel) { continue }

  $name = "$($r.Name)".Trim()
  if (-not $name) { continue }
  $sku = "$($r.SKU)".Trim()

  if (-not $brands.ContainsKey($brand)) { $brands[$brand] = @{} }
  if (-not $brands[$brand].ContainsKey($categoryLabel)) { $brands[$brand][$categoryLabel] = @{} }

  $identity = if ($sku) { "sku:$($sku.ToLower())" } else { "name:$($name.ToLower())" }
  if (-not $brands[$brand][$categoryLabel].ContainsKey($identity)) {
    $label = if ($sku) { "$name - $sku" } else { $name }
    $brands[$brand][$categoryLabel][$identity] = @{ value = $label; label = $label; sku = $sku; name = $name }
  }
}

$brandOut = @{}
foreach ($brand in ($brands.Keys | Sort-Object)) {
  $catMap = $brands[$brand]
  $categories = @($catMap.Keys | Sort-Object)
  $modelsByCategory = @{}
  foreach ($cat in $categories) {
    $models = @($catMap[$cat].Values | Sort-Object -Property label)
    $modelsByCategory[$cat] = $models
  }
  $brandOut[$brand] = @{ categories = $categories; modelsByCategory = $modelsByCategory }
}

$payload = @{ generatedAt = (Get-Date).ToString('o'); brands = $brandOut }
$json = $payload | ConvertTo-Json -Depth 10
$content = "// Auto-generated from official WooCommerce production catalog CSV.`n" +
           "// Source: $CsvPath`n" +
           "export const OFFICIAL_REPAIR_CATALOG = $json;`n"
Set-Content -Path $OutPath -Value $content -Encoding UTF8
Write-Output "Generated $OutPath"
