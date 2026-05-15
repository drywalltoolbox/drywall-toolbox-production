param(
    [string]$BaseUrl = "",
    [int]$TimeoutSec = 30
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    if (-not [string]::IsNullOrWhiteSpace($env:DTB_SMOKE_BASE_URL)) {
        $BaseUrl = $env:DTB_SMOKE_BASE_URL
    } else {
        $BaseUrl = 'https://drywalltoolbox.com'
    }
}

$BaseUrl = $BaseUrl.TrimEnd('/')

function Invoke-SmokeRequest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int[]]$ExpectedStatus = @(200)
    )

    $uri = "$BaseUrl$Path"
    try {
        $requestParams = @{
            Uri         = $uri
            Method      = $Method
            TimeoutSec  = $TimeoutSec
            Headers     = $Headers
            ErrorAction = 'Stop'
        }

        if ($null -ne $Body) {
            $requestParams['ContentType'] = 'application/json'
            $requestParams['Body'] = ($Body | ConvertTo-Json -Depth 8)
        }

        $response = Invoke-WebRequest @requestParams
        $status = [int]$response.StatusCode
        $ok = $ExpectedStatus -contains $status

        $content = $null
        if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
            try { $content = $response.Content | ConvertFrom-Json -Depth 8 } catch { $content = $response.Content }
        }

        return [pscustomobject]@{
            Name   = $Name
            Method = $Method
            Path   = $Path
            Status = $status
            Ok     = $ok
            Data   = $content
            Error  = ''
        }
    }
    catch {
        $status = 0
        $errMsg = $_.Exception.Message

        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = [int]$_.Exception.Response.StatusCode
        }

        return [pscustomobject]@{
            Name   = $Name
            Method = $Method
            Path   = $Path
            Status = $status
            Ok     = ($ExpectedStatus -contains $status)
            Data   = $null
            Error  = $errMsg
        }
    }
}

$results = New-Object System.Collections.Generic.List[object]

# Base catalog probes
$facets = Invoke-SmokeRequest -Name 'Catalog facets' -Method 'GET' -Path '/wp-json/dtb/v1/catalog/facets'
$results.Add($facets)

$products = Invoke-SmokeRequest -Name 'Catalog products' -Method 'GET' -Path '/wp-json/dtb/v1/catalog/products'
$results.Add($products)

$firstItem = $null
if ($products.Ok -and $products.Data -and $products.Data.items -and $products.Data.items.Count -gt 0) {
    $firstItem = $products.Data.items[0]
}

$sampleSlug = if ($firstItem -and $firstItem.slug) { [string]$firstItem.slug } else { '' }
$sampleId = if ($firstItem -and $firstItem.id) { [int]$firstItem.id } else { 0 }

$results.Add((Invoke-SmokeRequest -Name 'Catalog products brand filter' -Method 'GET' -Path '/wp-json/dtb/v1/catalog/products?brand=tapetech'))
$results.Add((Invoke-SmokeRequest -Name 'Catalog products non-parts filter' -Method 'GET' -Path '/wp-json/dtb/v1/catalog/products?is_parts=0'))
$results.Add((Invoke-SmokeRequest -Name 'Catalog products builder slot filter' -Method 'GET' -Path '/wp-json/dtb/v1/catalog/products?builder_slot=flatBox'))

if (-not [string]::IsNullOrWhiteSpace($sampleSlug)) {
    $results.Add((Invoke-SmokeRequest -Name 'Catalog product detail' -Method 'GET' -Path "/wp-json/dtb/v1/catalog/products/$sampleSlug/detail"))
}

if ($sampleId -gt 0) {
    $results.Add((Invoke-SmokeRequest -Name 'Catalog product variations' -Method 'GET' -Path "/wp-json/dtb/v1/catalog/products/$sampleId/variations"))
}

$toolsets = Invoke-SmokeRequest -Name 'Toolsets list' -Method 'GET' -Path '/wp-json/dtb/v1/toolsets'
$results.Add($toolsets)

$templateId = ''
if ($toolsets.Ok -and $toolsets.Data -and $toolsets.Data.templates -and $toolsets.Data.templates.Count -gt 0) {
    $templateId = [string]$toolsets.Data.templates[0].id
}

if (-not [string]::IsNullOrWhiteSpace($templateId)) {
    $results.Add((Invoke-SmokeRequest -Name 'Toolset options' -Method 'GET' -Path "/wp-json/dtb/v1/toolsets/$templateId/options"))

    $validateBody = @{
        templateId = $templateId
        selections = @{}
    }

    $results.Add((Invoke-SmokeRequest -Name 'Toolset validate' -Method 'POST' -Path '/wp-json/dtb/v1/toolsets/validate' -Body $validateBody))
}

$results | Select-Object Name, Method, Path, Status, Ok, Error | Format-Table -AutoSize

$failed = @($results | Where-Object { -not $_.Ok })
if ($failed.Count -gt 0) {
    Write-Host "`nSmoke suite failed: $($failed.Count) endpoint(s) failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nSmoke suite passed: $($results.Count) endpoint checks succeeded." -ForegroundColor Green
exit 0
