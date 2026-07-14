param(
    [Parameter(Mandatory = $true)]
    [string] $BaseUrl,

    [Parameter(Mandatory = $false)]
    [string] $AdminCookie = "",

    [Parameter(Mandatory = $false)]
    [string] $WpRestNonce = "",

    [Parameter(Mandatory = $false)]
    [string] $CustomerDtbAuth = ""
)

$ErrorActionPreference = "Stop"

function Invoke-DtbSmokeRequest {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Method,

        [Parameter(Mandatory = $true)]
        [string] $Url,

        [Parameter(Mandatory = $false)]
        [hashtable] $Headers = @{}
    )

    try {
        $response = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -UseBasicParsing -ErrorAction Stop
        return [pscustomobject]@{
            StatusCode = [int] $response.StatusCode
            Body       = [string] $response.Content
        }
    } catch {
        $statusCode = 0
        $body = $_.Exception.Message

        if ($_.Exception.Response) {
            $statusCode = [int] $_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $body = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            } catch {
                $body = $_.Exception.Message
            }
        }

        return [pscustomobject]@{
            StatusCode = $statusCode
            Body       = $body
        }
    }
}

function Assert-DtbStatus {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [int] $StatusCode,

        [Parameter(Mandatory = $true)]
        [int[]] $Allowed
    )

    if ($Allowed -notcontains $StatusCode) {
        throw "$Name failed: expected $($Allowed -join ', '), got $StatusCode"
    }

    Write-Host "$Name passed ($StatusCode)"
}

$root = $BaseUrl.TrimEnd("/")
$wooAdminOptionsUrl = "$root/wp-json/wc-admin/options?options=woocommerce_allow_tracking&_locale=user"
$diagnosticUrl = "$root/wp-json/dtb/v1/admin-auth-smoke"

if ($CustomerDtbAuth) {
    $customerHeaders = @{
        Cookie = "dtb_auth=$CustomerDtbAuth"
    }
    $customerResult = Invoke-DtbSmokeRequest -Method "GET" -Url $wooAdminOptionsUrl -Headers $customerHeaders
    Assert-DtbStatus -Name "customer dtb_auth cannot access Woo Admin REST" -StatusCode $customerResult.StatusCode -Allowed @(401, 403)
} else {
    Write-Host "customer dtb_auth negative check skipped; pass -CustomerDtbAuth to run it"
}

if ($AdminCookie -and $WpRestNonce) {
    $adminHeaders = @{
        Cookie       = $AdminCookie
        "X-WP-Nonce" = $WpRestNonce
    }

    $adminResult = Invoke-DtbSmokeRequest -Method "GET" -Url $wooAdminOptionsUrl -Headers $adminHeaders
    Assert-DtbStatus -Name "native admin cookie plus nonce can access Woo Admin REST" -StatusCode $adminResult.StatusCode -Allowed @(200)

    $diagnosticResult = Invoke-DtbSmokeRequest -Method "GET" -Url $diagnosticUrl -Headers $adminHeaders
    Assert-DtbStatus -Name "admin auth diagnostic route" -StatusCode $diagnosticResult.StatusCode -Allowed @(200)

    $staleHeaders = @{
        Cookie       = $AdminCookie
        "X-WP-Nonce" = "dtb-intentionally-stale"
    }
    $staleResult = Invoke-DtbSmokeRequest -Method "GET" -Url $diagnosticUrl -Headers $staleHeaders
    Assert-DtbStatus -Name "stale REST nonce fails safely" -StatusCode $staleResult.StatusCode -Allowed @(401, 403)
} else {
    Write-Host "admin cookie/nonce checks skipped; pass -AdminCookie and -WpRestNonce to run them"
}
