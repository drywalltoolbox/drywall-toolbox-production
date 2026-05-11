<#
.SYNOPSIS
    DTB API Test Harness — structured endpoint testing with readable output.

.DESCRIPTION
    Tests every drywall/v1 and dtb/v1 REST endpoint and the probe script.
    Reports: status code, response time, content-type, payload shape, and errors.
    Saves a timestamped .log (plain text transcript) and .json (structured results)
    to scripts\reports\ after every run.

.PARAMETER BaseUrl
    Production base URL (no trailing slash).

.PARAMETER ProbeKey
    Secret key for dtb-probe.php. Only needed when -RunProbe is specified.

.PARAMETER ProductId
    WooCommerce product ID to use for product/variation tests.

.PARAMETER VariationId
    A known variation ID under ProductId.

.PARAMETER RunProbe
    Also hit dtb-probe.php and display its full diagnostic report.

.PARAMETER NoSave
    Skip writing report files (console output only).

.EXAMPLE
    .\scripts\test-api.ps1
    .\scripts\test-api.ps1 -RunProbe -ProbeKey "dtb-debug-2026"
    .\scripts\test-api.ps1 -ProductId 32901 -VariationId 32910 -RunProbe -ProbeKey "dtb-debug-2026"
    .\scripts\test-api.ps1 -NoSave
#>

param(
    [string]$BaseUrl     = "https://drywalltoolbox.com",
    [string]$ProbeKey    = "",
    [int]   $ProductId   = 32901,
    [int]   $VariationId = 0,          # set a known variation ID if you have one
    [switch]$RunProbe,
    [switch]$NoSave
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ── Report output setup ────────────────────────────────────────────────────────
$script:RunTimestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$script:ReportsDir   = Join-Path $PSScriptRoot "reports"
$script:LogFile      = Join-Path $script:ReportsDir "api-test-$($script:RunTimestamp).log"
$script:JsonFile     = Join-Path $script:ReportsDir "api-test-$($script:RunTimestamp).json"

# Structured results accumulated during the run; written to JSON at the end.
$script:Results = [ordered]@{
    run_timestamp = $script:RunTimestamp
    base_url      = $BaseUrl
    product_id    = $ProductId
    variation_id  = $VariationId
    probe_enabled = $RunProbe.IsPresent
    summary       = [ordered]@{ total = 0; passed = 0; failed = 0; warned = 0 }
    endpoints     = [System.Collections.Generic.List[object]]::new()
    probe         = $null
    cache_headers = [ordered]@{}
}

if (-not $NoSave) {
    if (-not (Test-Path $script:ReportsDir)) {
        New-Item -ItemType Directory -Path $script:ReportsDir | Out-Null
    }
    Start-Transcript -Path $script:LogFile -NoClobber | Out-Null
}

# ── Colour helpers ─────────────────────────────────────────────────────────────
function Write-Ok   ([string]$msg) { Write-Host "  ✓  $msg" -ForegroundColor Green  }
function Write-Warn ([string]$msg) { Write-Host "  ⚠  $msg" -ForegroundColor Yellow; $script:Results.summary.warned++ }
function Write-Fail ([string]$msg) { Write-Host "  ✗  $msg" -ForegroundColor Red    }
function Write-Info ([string]$msg) { Write-Host "     $msg" -ForegroundColor Cyan   }
function Write-Head ([string]$msg) {
    Write-Host ""
    Write-Host "── $msg ──" -ForegroundColor White
}

# ── Request helper ─────────────────────────────────────────────────────────────
function Invoke-Test {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers = @{},
        [int]$ExpectStatus   = 200,
        [switch]$ShowBody
    )

    $entry = [ordered]@{
        label          = $Label
        url            = $Url
        expected_status = $ExpectStatus
        status_code    = $null
        passed         = $false
        ms             = $null
        content_type   = $null
        response_shape = $null
        error          = $null
        body_preview   = $null
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -Headers $Headers `
                                  -TimeoutSec 30 -ErrorAction Stop
        $sw.Stop()
        $ms   = $sw.ElapsedMilliseconds
        $code = $resp.StatusCode
        $ct   = $resp.Headers["Content-Type"] -join ""
        $body = $resp.Content

        $entry.status_code  = $code
        $entry.ms           = $ms
        $entry.content_type = $ct

        $shape = ""
        $json  = $null
        if ($ct -match "application/json") {
            try {
                $json = $body | ConvertFrom-Json -ErrorAction Stop
                if ($json -is [System.Array]) {
                    $shape = "Array[$($json.Count)]"
                    if ($json.Count -gt 0) {
                        $keys  = ($json[0].PSObject.Properties.Name) -join ", "
                        $shape += " · keys: $keys"
                    }
                } elseif ($json -is [PSCustomObject]) {
                    $keys  = ($json.PSObject.Properties.Name) -join ", "
                    $shape = "Object · keys: $keys"
                }
            } catch { $shape = "(JSON parse failed)" }
        } elseif ($ct -match "text/html") {
            $shape = "⚠ HTML RESPONSE — likely WordPress critical error"
            $entry.body_preview = if ($body.Length -gt 800) { $body.Substring(0, 800) + "…" } else { $body }
        }

        $entry.response_shape = $shape
        $entry.passed         = ($code -eq $ExpectStatus)

        $line = "[$code] ${ms}ms  $Label"
        if ($entry.passed) {
            Write-Ok $line
            $script:Results.summary.passed++
        } else {
            Write-Fail $line
            $script:Results.summary.failed++
        }
        if ($shape) { Write-Info "       $shape" }
        if ($ShowBody -or $ct -match "text/html") {
            $preview = if ($body.Length -gt 800) { $body.Substring(0, 800) + "…" } else { $body }
            Write-Host "       $preview" -ForegroundColor DarkGray
        }

        $script:Results.summary.total++
        $script:Results.endpoints.Add($entry)
        return $json
    }
    catch [System.Net.WebException] {
        $sw.Stop()
        $code    = [int]$_.Exception.Response.StatusCode
        $msg     = $_.Exception.Message
        $errBody = ""
        try {
            $stream  = $_.Exception.Response.GetResponseStream()
            $reader  = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
        } catch {}

        $entry.status_code  = $code
        $entry.ms           = $sw.ElapsedMilliseconds
        $entry.passed       = ($code -eq $ExpectStatus)
        $entry.error        = $msg
        $entry.body_preview = if ($errBody.Length -gt 600) { $errBody.Substring(0,600) + "…" } else { $errBody }

        Write-Fail "[$code] $($sw.ElapsedMilliseconds)ms  $Label"
        Write-Info "       $msg"
        if ($errBody) {
            Write-Host "       $($entry.body_preview)" -ForegroundColor DarkGray
        }

        if ($entry.passed) { $script:Results.summary.passed++ } else { $script:Results.summary.failed++ }
        $script:Results.summary.total++
        $script:Results.endpoints.Add($entry)
        return $null
    }
    catch {
        $sw.Stop()
        # PowerShell 7 raises HttpResponseException (not WebException) for HTTP error codes.
        # Extract the status code if available so we can still evaluate ExpectStatus.
        $httpCode = 0
        if ($_.Exception.PSObject.Properties['Response'] -and $_.Exception.Response) {
            $httpCode = [int]$_.Exception.Response.StatusCode
        } elseif ($_.Exception.Message -match '(\d{3})') {
            $httpCode = [int]$Matches[1]
        }

        $entry.ms         = $sw.ElapsedMilliseconds
        $entry.error      = $_.Exception.Message
        $entry.status_code = if ($httpCode -gt 0) { $httpCode } else { $null }
        $entry.passed     = ($httpCode -gt 0 -and $httpCode -eq $ExpectStatus)

        if ($entry.passed) {
            Write-Ok  "[$httpCode] $($sw.ElapsedMilliseconds)ms  $Label"
            $script:Results.summary.passed++
        } else {
            Write-Fail "[$($sw.ElapsedMilliseconds)ms]  $Label  →  $($_.Exception.Message)"
            $script:Results.summary.failed++
        }
        $script:Results.summary.total++
        $script:Results.endpoints.Add($entry)
        return $null
    }
}

# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "DTB API Test Harness" -ForegroundColor Magenta
Write-Host "Base URL : $BaseUrl" -ForegroundColor DarkGray
Write-Host "Product  : $ProductId" -ForegroundColor DarkGray
Write-Host "Date     : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray

# ── 1. WordPress sanity ────────────────────────────────────────────────────────
Write-Head "1. WordPress / WooCommerce sanity"
Invoke-Test "WP REST index reachable"  "$BaseUrl/wp-json/"
# WC namespace index is intentionally public — returns 200 with route list, no auth needed.
Invoke-Test "WC REST namespace exists" "$BaseUrl/wp-json/wc/v3/"  -ExpectStatus 200

# ── 2. drywall/v1 product endpoints ───────────────────────────────────────────
Write-Head "2. drywall/v1 products"
Invoke-Test "GET /products (page 1)"         "$BaseUrl/wp-json/drywall/v1/products?per_page=12&page=1"
Invoke-Test "GET /products/{id}"             "$BaseUrl/wp-json/drywall/v1/products/$ProductId"
Invoke-Test "GET /products/{id}/variations"  "$BaseUrl/wp-json/drywall/v1/products/$ProductId/variations?per_page=100"

if ($VariationId -gt 0) {
    Invoke-Test "GET /products/{id}/variations/{vid}" `
        "$BaseUrl/wp-json/drywall/v1/products/$ProductId/variations/$VariationId"
}

# ── 3. drywall/v1 taxonomy endpoints ──────────────────────────────────────────
Write-Head "3. drywall/v1 taxonomy"
Invoke-Test "GET /categories"  "$BaseUrl/wp-json/drywall/v1/categories"
# ShowBody: parse failed last run — capture raw response to diagnose
Invoke-Test "GET /attributes"  "$BaseUrl/wp-json/drywall/v1/attributes" -ShowBody

# ── 4. drywall/v1 search ──────────────────────────────────────────────────────
Write-Head "4. drywall/v1 search"
Invoke-Test "GET /search?q=tape"  "$BaseUrl/wp-json/drywall/v1/search?q=tape"

# ── 5. dtb/v1 auth endpoints ──────────────────────────────────────────────────
Write-Head "5. dtb/v1 auth"
# POST /auth/login with no body → 400 Bad Request (route exists, validates params)
Invoke-Test "POST /dtb/v1/auth/login (no body → 400)"    "$BaseUrl/wp-json/dtb/v1/auth/login"    -ExpectStatus 400
# POST /auth/validate with no cookie → 401 Unauthorized
Invoke-Test "POST /dtb/v1/auth/validate (no cookie → 401)" "$BaseUrl/wp-json/dtb/v1/auth/validate" -ExpectStatus 401
# GET /drywall/v1/orders with no JWT → 401 Unauthorized (correct namespace)
Invoke-Test "GET /drywall/v1/orders (no JWT → 401)"      "$BaseUrl/wp-json/drywall/v1/orders"    -ExpectStatus 401

# ── 6. Cache headers ──────────────────────────────────────────────────────────
Write-Head "6. Cache / CDN headers on variations"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/wp-json/drywall/v1/products/$ProductId/variations?per_page=100" `
                           -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    $sw.Stop()
    $cacheHeaders = @("Cache-Control","X-Cache","CF-Cache-Status","X-WP-Total","X-DTB-Cache")
    foreach ($h in $cacheHeaders) {
        $val = $r.Headers[$h] -join ""
        if ($val) {
            Write-Info "$h : $val"
            $script:Results.cache_headers[$h] = $val
        }
    }
    $kb = [math]::Round($r.RawContentLength / 1024, 1)
    Write-Info "Response size: ${kb} KB"
    $script:Results.cache_headers["response_size_kb"] = $kb
    $script:Results.cache_headers["ms"] = $sw.ElapsedMilliseconds
} catch {
    Write-Warn "Could not reach variations endpoint for header inspection"
}

# ── 7. Probe script ────────────────────────────────────────────────────────────
if ($RunProbe) {
    if (-not $ProbeKey) {
        Write-Warn "Skipping probe — supply -ProbeKey to enable"
    } else {
        Write-Head "7. dtb-probe.php diagnostic"
        $probeUrl = "$BaseUrl/dtb-probe.php?key=$ProbeKey&product_id=$ProductId&per_page=100"
        Write-Info "URL: $probeUrl"

        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $resp = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 60 -ErrorAction Stop
            $sw.Stop()
            Write-Ok "[200] $($sw.ElapsedMilliseconds)ms  dtb-probe.php"

            try {
                $p = $resp.Content | ConvertFrom-Json
                Write-Info "PHP     : $($p.environment.php_version)"
                Write-Info "Mem lim : $($p.environment.memory_limit)"
                Write-Info "WC ver  : $($p.environment.wc_defined)"

                # Store full probe result in JSON report
                $script:Results.probe = $p

                foreach ($step in $p.steps.PSObject.Properties) {
                    $s = $step.Value
                    $status = $s.status
                    $ms     = if ($s.ms)  { "$($s.ms)ms" } else { "" }
                    $mem    = if ($s.mem) { "| mem $($s.mem)" } else { "" }
                    $extra  = switch ($step.Name) {
                        "wc_get_product"    { "variations: $($s.variation_count)" }
                        "postmeta_query"    { "rows: $($s.row_count)" }
                        "posts_query"       { "rows: $($s.row_count)" }
                        "thumbnail_query"   { "thumb_ids: $($s.thumb_ids_sent) → urls: $($s.urls_resolved)" }
                        "payload_build"     { "built: $($s.variations_built) | peak: $($s.peak_mem)" }
                        default             { "" }
                    }
                    $line = "$($step.Name.PadRight(20)) [$status]  $ms  $mem  $extra"
                    if ($status -eq "OK" -or $status -eq "SKIPPED") {
                        Write-Ok $line
                    } else {
                        Write-Fail $line
                        if ($s.db_error)  { Write-Info "  DB error: $($s.db_error)" }
                        if ($s.message)   { Write-Info "  Exception: $($s.message)" }
                    }
                }

                if ($p.errors -and $p.errors.Count -gt 0) {
                    Write-Head "Probe errors"
                    $p.errors | ForEach-Object { Write-Fail $_ }
                }

                if ($p.sample_payload -and $p.sample_payload.Count -gt 0) {
                    Write-Head "Sample variation (first result)"
                    $v = $p.sample_payload[0]
                    Write-Info "  id         : $($v.id)"
                    Write-Info "  sku        : $($v.sku)"
                    Write-Info "  name       : $($v.name)"
                    Write-Info "  price      : $($v.price)"
                    Write-Info "  stock      : $($v.stock_status)"
                    Write-Info "  images     : $($v.images.Count) image(s)"
                    Write-Info "  attributes : $($v.attributes.Count) attribute(s)"
                    if ($v.attributes.Count -gt 0) {
                        $v.attributes | ForEach-Object { Write-Info "    - $($_.name): $($_.option)" }
                    }
                }
            } catch {
                Write-Warn "Could not parse probe JSON: $_"
                Write-Host $resp.Content -ForegroundColor DarkGray
            }
        } catch [System.Net.WebException] {
            $sw.Stop()
            $code = [int]$_.Exception.Response.StatusCode
            Write-Fail "[$code] $($sw.ElapsedMilliseconds)ms  dtb-probe.php"
            try {
                $stream  = $_.Exception.Response.GetResponseStream()
                $reader  = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd()
                Write-Host $errBody -ForegroundColor DarkGray
            } catch {}
        }
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Magenta

# ── Summary line ───────────────────────────────────────────────────────────────
$s = $script:Results.summary
Write-Host ""
Write-Host ("  Summary: {0} total  |  {1} passed  |  {2} failed  |  {3} warned" -f `
    $s.total, $s.passed, $s.failed, $s.warned) -ForegroundColor $(if ($s.failed -gt 0) { "Red" } else { "Green" })

# ── Save reports ───────────────────────────────────────────────────────────────
if (-not $NoSave) {
    # Stop transcript first so the log file is fully flushed before we report its path
    Stop-Transcript | Out-Null

    $script:Results | ConvertTo-Json -Depth 20 | Set-Content -Path $script:JsonFile -Encoding UTF8

    Write-Host ""
    Write-Host "  Reports saved:" -ForegroundColor DarkGray
    Write-Host "    Log  → $($script:LogFile)"  -ForegroundColor DarkGray
    Write-Host "    JSON → $($script:JsonFile)" -ForegroundColor DarkGray
}
