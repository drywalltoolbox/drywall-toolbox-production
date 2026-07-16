param(
    [string] $LaunchCatalogPath = 'products/Production/launch/dtb_woocommerce_official_catalog.csv',
    [string] $TapeTechShippingSourcePath = 'products/Production/catalogs/sources/tapetech/tapetech_upc_weights_dimensions_official.csv',
    [string] $AuditReportPath = 'products/Production/launch/reports/tapetech_shipping_specs_update.csv'
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

function Format-DecimalString {
    param(
        [string] $Value,
        [int] $MaxDecimals = 4
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ''
    }

    $number = [decimal]::Parse($Value, [System.Globalization.CultureInfo]::InvariantCulture)
    $formatted = $number.ToString(('0.' + ('#' * $MaxDecimals)), [System.Globalization.CultureInfo]::InvariantCulture)
    if ($formatted -eq '') {
        return '0'
    }

    return $formatted
}

function Set-SpecValue {
    param(
        [System.Collections.ArrayList] $Specs,
        [string] $Label,
        [string] $Value
    )

    for ($i = $Specs.Count - 1; $i -ge 0; $i--) {
        if ($Specs[$i].label -eq $Label) {
            $Specs.RemoveAt($i)
        }
    }

    [void] $Specs.Add([ordered]@{
        label = $Label
        value = $Value
    })
}

$sourceRows = Import-Csv -Path $TapeTechShippingSourcePath
$sourceByModel = @{}
foreach ($row in $sourceRows) {
    $model = $row.Model.Trim()
    if ($model -eq '') {
        continue
    }

    $sourceByModel[$model] = $row
}

$lines = [System.IO.File]::ReadAllLines((Resolve-Path $LaunchCatalogPath))
if ($lines.Count -lt 1) {
    throw "Launch catalog is empty: $LaunchCatalogPath"
}

$headers = ConvertFrom-CsvLine $lines[0]
$index = @{}
for ($i = 0; $i -lt $headers.Count; $i++) {
    $index[$headers[$i]] = $i
}

$requiredColumns = @(
    'SKU',
    'Weight (lbs)',
    'Length (in)',
    'Width (in)',
    'Height (in)',
    'Meta: _dtb_specs_json'
)

foreach ($column in $requiredColumns) {
    if (-not $index.ContainsKey($column)) {
        throw "Missing required launch catalog column: $column"
    }
}

$updatedLines = New-Object System.Collections.Generic.List[string]
$updatedLines.Add($lines[0])
$auditRows = New-Object System.Collections.Generic.List[object]
$updatedCount = 0

for ($lineNumber = 1; $lineNumber -lt $lines.Count; $lineNumber++) {
    $line = $lines[$lineNumber]
    $fields = ConvertFrom-CsvLine $line
    $sku = $fields[$index['SKU']].Trim()

    if (-not $sourceByModel.ContainsKey($sku)) {
        $updatedLines.Add($line)
        continue
    }

    $source = $sourceByModel[$sku]
    $beforeWeight = $fields[$index['Weight (lbs)']]
    $beforeLength = $fields[$index['Length (in)']]
    $beforeWidth = $fields[$index['Width (in)']]
    $beforeHeight = $fields[$index['Height (in)']]

    $shipLengthIn = Format-DecimalString $source.'Ship Box Length (in)' 4
    $shipWidthIn = Format-DecimalString $source.'Ship Box Width (in)' 4
    $shipHeightIn = Format-DecimalString $source.'Ship Box Height (in)' 4
    $shipWeightLbs = Format-DecimalString $source.'Ship Package Weight (lbs)' 4
    $shipLengthCm = Format-DecimalString $source.'Ship Box Length (cm)' 4
    $shipWidthCm = Format-DecimalString $source.'Ship Box Width (cm)' 4
    $shipHeightCm = Format-DecimalString $source.'Ship Box Height (cm)' 4
    $shipWeightKg = Format-DecimalString $source.'Ship Package Weight (kg)' 4

    $fields[$index['Length (in)']] = $shipLengthIn
    $fields[$index['Width (in)']] = $shipWidthIn
    $fields[$index['Height (in)']] = $shipHeightIn
    $fields[$index['Weight (lbs)']] = $shipWeightLbs

    $specJson = $fields[$index['Meta: _dtb_specs_json']]
    if ([string]::IsNullOrWhiteSpace($specJson)) {
        $specs = [System.Collections.ArrayList]::new()
    } else {
        $specs = [System.Collections.ArrayList] @($specJson | ConvertFrom-Json)
    }

    Set-SpecValue $specs 'Ship Box Length (in)' $shipLengthIn
    Set-SpecValue $specs 'Ship Box Width (in)' $shipWidthIn
    Set-SpecValue $specs 'Ship Box Height (in)' $shipHeightIn
    Set-SpecValue $specs 'Ship Package Weight (lbs)' $shipWeightLbs
    Set-SpecValue $specs 'Ship Box Length (cm)' $shipLengthCm
    Set-SpecValue $specs 'Ship Box Width (cm)' $shipWidthCm
    Set-SpecValue $specs 'Ship Box Height (cm)' $shipHeightCm
    Set-SpecValue $specs 'Ship Package Weight (kg)' $shipWeightKg

    $fields[$index['Meta: _dtb_specs_json']] = $specs | ConvertTo-Json -Compress
    $updatedLines.Add((ConvertTo-CsvLine $fields))
    $updatedCount++

    $auditRows.Add([pscustomobject]@{
        SKU = $sku
        Description = $source.Description
        BeforeWeightLbs = $beforeWeight
        BeforeLengthIn = $beforeLength
        BeforeWidthIn = $beforeWidth
        BeforeHeightIn = $beforeHeight
        AfterWeightLbs = $shipWeightLbs
        AfterLengthIn = $shipLengthIn
        AfterWidthIn = $shipWidthIn
        AfterHeightIn = $shipHeightIn
        ShipBoxLengthCm = $shipLengthCm
        ShipBoxWidthCm = $shipWidthCm
        ShipBoxHeightCm = $shipHeightCm
        ShipPackageWeightKg = $shipWeightKg
    })
}

$tmpPath = "$LaunchCatalogPath.tmp"
[System.IO.File]::WriteAllLines($tmpPath, $updatedLines, [System.Text.UTF8Encoding]::new($true))
Move-Item -LiteralPath $tmpPath -Destination $LaunchCatalogPath -Force

$auditDir = Split-Path -Parent $AuditReportPath
if ($auditDir -and -not (Test-Path -LiteralPath $auditDir)) {
    New-Item -ItemType Directory -Path $auditDir | Out-Null
}

$auditRows | Export-Csv -Path $AuditReportPath -NoTypeInformation -Encoding utf8

[pscustomobject]@{
    SourceRows = $sourceRows.Count
    UpdatedLaunchRows = $updatedCount
    AuditReportPath = $AuditReportPath
}
