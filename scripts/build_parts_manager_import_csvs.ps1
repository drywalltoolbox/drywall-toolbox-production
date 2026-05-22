$partsPath = 'D:\AMD\projects\drywall-toolbox\products\Production\launch\dtb_parts_catalog.csv'
$flatPath = 'D:\AMD\projects\drywall-toolbox\products\Production\launch\dtb_schematics_parts_flattened.csv'
$outParts = 'D:\AMD\projects\drywall-toolbox\products\Production\launch\dtb_parts_manager_import_parts.csv'
$outMap = 'D:\AMD\projects\drywall-toolbox\products\Production\launch\dtb_parts_manager_import_schematic_map.csv'
$outUnresolved = 'D:\AMD\projects\drywall-toolbox\products\Production\launch\dtb_parts_manager_unresolved_part_ids.csv'

function Norm([string]$s) {
    if ($null -eq $s) { return '' }
    return (($s.ToUpper()) -replace '[^A-Z0-9]', '')
}

$parts = Import-Csv -Path $partsPath
$flat = Import-Csv -Path $flatPath

$partsByUpper = @{}
$normToSkus = @{}

foreach ($p in $parts) {
    $sku = (([string]$p.SKU).Trim())
    if ([string]::IsNullOrWhiteSpace($sku)) { continue }

    $upper = $sku.ToUpper()
    if (-not $partsByUpper.ContainsKey($upper)) {
        $partsByUpper[$upper] = $p
    }

    $norm = Norm $sku
    if (-not $normToSkus.ContainsKey($norm)) {
        $normToSkus[$norm] = New-Object System.Collections.Generic.List[string]
    }
    if (-not $normToSkus[$norm].Contains($sku)) {
        $normToSkus[$norm].Add($sku)
    }
}

$partIdToSourceSku = @{}
$unresolved = @{}

foreach ($r in $flat) {
    $partId = (([string]$r.part_id).Trim())
    if ([string]::IsNullOrWhiteSpace($partId)) { continue }
    if ($partIdToSourceSku.ContainsKey($partId) -or $unresolved.ContainsKey($partId)) { continue }

    $upper = $partId.ToUpper()
    if ($partsByUpper.ContainsKey($upper)) {
        $partIdToSourceSku[$partId] = [string]$partsByUpper[$upper].SKU
        continue
    }

    $norm = Norm $partId
    if ($normToSkus.ContainsKey($norm) -and $normToSkus[$norm].Count -eq 1) {
        $partIdToSourceSku[$partId] = $normToSkus[$norm][0]
    }
    else {
        $unresolved[$partId] = $true
    }
}

$mapOut = New-Object System.Collections.Generic.List[object]
foreach ($r in $flat) {
    $partId = (([string]$r.part_id).Trim())
    if ([string]::IsNullOrWhiteSpace($partId)) { continue }
    if (-not $partIdToSourceSku.ContainsKey($partId)) { continue }

    $mapOut.Add([pscustomobject]@{
        schematic_id = $r.schematic_id
        part_id      = $r.part_id
        part_name    = $r.part_name
        qty          = $r.qty
        source_sku   = $partIdToSourceSku[$partId]
    })
}
$mapOut | Export-Csv -Path $outMap -NoTypeInformation -Encoding UTF8

$usedSkuSet = @{}
foreach ($m in $mapOut) {
    $u = (([string]$m.source_sku).Trim().ToUpper())
    if (-not [string]::IsNullOrWhiteSpace($u)) {
        $usedSkuSet[$u] = $true
    }
}

$partsOut = New-Object System.Collections.Generic.List[object]
foreach ($u in ($usedSkuSet.Keys | Sort-Object)) {
    if (-not $partsByUpper.ContainsKey($u)) { continue }
    $p = $partsByUpper[$u]
    $sku = [string]$p.SKU
    $brandLabel = [string]$p.'Meta: _dtb_brand_label'
    if ([string]::IsNullOrWhiteSpace($brandLabel)) {
        $brandLabel = [string]$p.Brands
    }
    $price = [string]$p.'Regular price'
    if ([string]::IsNullOrWhiteSpace($price)) {
        $price = [string]$p.'Sale price'
    }
    $partsOut.Add([pscustomobject]@{
        sku              = $sku
        title            = $p.Name
        brand_label      = $brandLabel
        manufacturer_sku = $sku
        price            = $price
        categories       = 'Parts'
        brands           = [string]$p.Brands
    })
}
$partsOut | Export-Csv -Path $outParts -NoTypeInformation -Encoding UTF8

$unresolvedOut = New-Object System.Collections.Generic.List[object]
foreach ($unresolvedPartId in ($unresolved.Keys | Sort-Object)) {
    $unresolvedOut.Add([pscustomobject]@{ part_id = $unresolvedPartId })
}
$unresolvedOut | Export-Csv -Path $outUnresolved -NoTypeInformation -Encoding UTF8

$partsHeaders = ((Import-Csv -Path $outParts | Select-Object -First 1 | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ',')
$mapHeaders = ((Import-Csv -Path $outMap | Select-Object -First 1 | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ',')

"OUT_PARTS=$outParts"
"OUT_MAP=$outMap"
"OUT_UNRESOLVED=$outUnresolved"
"PARTS_IMPORT_ROWS=$($partsOut.Count)"
"MAP_IMPORT_ROWS=$($mapOut.Count)"
"UNRESOLVED_PART_IDS=$($unresolvedOut.Count)"
"PARTS_HEADERS=$partsHeaders"
"MAP_HEADERS=$mapHeaders"
