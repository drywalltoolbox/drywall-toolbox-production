#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Full WooCommerce product image reset + sync pipeline.

.DESCRIPTION
    Orchestrates the three-phase image pipeline against the live WordPress/
    WooCommerce site:

      Phase 1 — RESET
        Deletes every attachment record in the DB whose URL lives in
        wp-content/uploads/2026/04/ and clears _thumbnail_id +
        _product_image_gallery from all products. Clean slate.

      Phase 2 — SYNC
        Registers every {sku}.webp and {sku}_01.webp ... {sku}_20.webp file
        in the uploads directory as WordPress attachments, then sets
        _thumbnail_id (primary) and _product_image_gallery (gallery) on each
        matching WooCommerce product. Runs in paginated batches.

      Phase 3 — STATUS
        Final check: reports how many files are on disk, how many are
        registered in the DB, and how many products are linked.

.NOTES
    Auth: WooCommerce Application Passwords (same credentials used by the
    React frontend). Set WC_AUTH_USER + WC_AUTH_PASS as environment variables
    before running, or pass them as parameters.

    Usage:
        # Dry-run only (no writes) — shows what would happen:
        .\image-sync.ps1 -DryRun

        # Full run with credentials in env vars:
        .\image-sync.ps1

        # Full run with explicit credentials:
        .\image-sync.ps1 -User "admin" -Pass "xxxx xxxx xxxx xxxx xxxx xxxx"

        # Skip reset, only re-sync (useful after adding new images):
        .\image-sync.ps1 -SkipReset

        # Batch size override (lower = safer on shared hosting):
        .\image-sync.ps1 -BatchSize 50
#>

[CmdletBinding()]
param(
    [string]  $SiteUrl   = 'https://drywalltoolbox.com',
    [string]  $Year      = '2026',
    [string]  $Month     = '04',
    [string]  $User      = $env:WC_AUTH_USER,
    [string]  $Pass      = $env:WC_AUTH_PASS,
    [int]     $BatchSize = 100,
    [switch]  $DryRun,
    [switch]  $SkipReset,
    [switch]  $SkipSync
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Helpers ──────────────────────────────────────────────────────────────────

function Write-Step  { param([string]$msg) Write-Host "`n▶  $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "   ✔  $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "   ⚠  $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "   ✘  $msg" -ForegroundColor Red }
function Write-Info  { param([string]$msg) Write-Host "   ·  $msg" -ForegroundColor Gray }

function Get-AuthHeader {
    if (-not $User -or -not $Pass) {
        Write-Fail "WC_AUTH_USER / WC_AUTH_PASS not set."
        Write-Info "Set them as env vars or pass -User / -Pass parameters."
        exit 1
    }
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes("${User}:${Pass}")
    $b64    = [Convert]::ToBase64String($bytes)
    return @{ Authorization = "Basic $b64"; 'Content-Type' = 'application/json' }
}

function Invoke-Dtb {
    param(
        [string] $Method,
        [string] $Endpoint,
        [hashtable] $Body = @{}
    )
    $url     = "$SiteUrl/wp-json/dtb/v1/$Endpoint"
    $headers = Get-AuthHeader
    $json    = $Body | ConvertTo-Json -Depth 5

    try {
        if ($Method -eq 'GET') {
            $resp = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 300
        } else {
            $resp = Invoke-RestMethod -Method $Method -Uri $url -Headers $headers -Body $json -TimeoutSec 300
        }
        return $resp
    }
    catch {
        $status = $_.Exception.Response?.StatusCode.value__
        $detail = $_.ErrorDetails?.Message
        Write-Fail "HTTP $status — $url"
        if ($detail) { Write-Info $detail }
        throw
    }
}

# ── Banner ────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     DTB Product Image Sync — $SiteUrl     ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Info "Year/Month : $Year/$Month"
Write-Info "Batch size : $BatchSize"
Write-Info "Dry run    : $($DryRun.IsPresent)"
Write-Info "Skip reset : $($SkipReset.IsPresent)"
Write-Info "Skip sync  : $($SkipSync.IsPresent)"

# ── Phase 0 — Pre-flight status ───────────────────────────────────────────────

Write-Step "Pre-flight status check"
$status0 = Invoke-Dtb -Method GET -Endpoint "sync-images/status?year=$Year&month=$Month"
Write-Info "Files on disk       : $($status0.files_on_disk)"
Write-Info "Registered in DB    : $($status0.registered_in_db)"
Write-Info "Products linked     : $($status0.linked_products)"

if ($status0.files_on_disk -eq 0) {
    Write-Fail "No image files found in uploads/$Year/$Month on the server."
    Write-Info "Upload your .webp files first, then re-run this script."
    exit 1
}

# ── Phase 1 — RESET ───────────────────────────────────────────────────────────

if (-not $SkipReset) {
    Write-Step "Phase 1 — Reset (wipe attachments + product image meta)"

    $resetBody = @{ year = $Year; month = $Month; dry_run = $DryRun.IsPresent }
    $reset     = Invoke-Dtb -Method POST -Endpoint "sync-images/reset" -Body $resetBody

    if ($DryRun) {
        Write-Warn "[DRY RUN] Would delete $($reset.total_attachments) attachments"
        Write-Warn "[DRY RUN] Would clear image meta on $($reset.products_affected) products"
    } else {
        Write-Ok "Deleted $($reset.deleted_atts) attachments from DB"
        Write-Ok "Cleared image meta on $($reset.products_affected) products"
        if ($reset.errors.Count -gt 0) {
            Write-Warn "$($reset.errors.Count) errors during reset:"
            $reset.errors | ForEach-Object { Write-Warn "  $_" }
        }
    }
} else {
    Write-Warn "Skipping Phase 1 (reset) as requested."
}

# ── Phase 2 — SYNC ────────────────────────────────────────────────────────────

if (-not $SkipSync) {
    Write-Step "Phase 2 — Sync images (register + link thumbnail + gallery)"

    $offset        = 0
    $totalReg      = 0
    $totalLinked   = 0
    $totalSkipped  = 0
    $totalNoFile   = 0
    $totalGallery  = 0
    $allErrors     = @()
    $batchNum      = 0

    do {
        $batchNum++
        $syncBody = @{
            year     = $Year
            month    = $Month
            dry_run  = $DryRun.IsPresent
            limit    = $BatchSize
            offset   = $offset
        }

        Write-Info "Batch $batchNum — offset $offset, limit $BatchSize …"
        $sync = Invoke-Dtb -Method POST -Endpoint "sync-images" -Body $syncBody

        $totalReg     += $sync.registered
        $totalLinked  += $sync.linked
        $totalSkipped += $sync.skipped
        $totalNoFile  += $sync.no_file
        $totalGallery += if ($sync.PSObject.Properties['gallery_images']) { $sync.gallery_images } else { 0 }

        if ($sync.errors -and $sync.errors.Count -gt 0) {
            $allErrors += $sync.errors
            Write-Warn "  $($sync.errors.Count) errors in batch $batchNum"
        }

        $galleryCount = if ($sync.PSObject.Properties['gallery_images']) { $sync.gallery_images } else { 0 }
        Write-Info "  registered=$($sync.registered)  linked=$($sync.linked)  skipped=$($sync.skipped)  no_file=$($sync.no_file)  gallery=$galleryCount"

        $offset = $sync.next_offset

    } while ($null -ne $offset)

    Write-Host ""
    if ($DryRun) {
        Write-Warn "[DRY RUN] Sync complete — no writes performed"
    } else {
        Write-Ok "Sync complete"
    }
    Write-Info "────────────────────────────────────"
    Write-Info "Total registered    : $totalReg"
    Write-Info "Total gallery imgs  : $totalGallery"
    Write-Info "Total linked        : $totalLinked"
    Write-Info "Total skipped (dup) : $totalSkipped"
    Write-Info "Total no-file       : $totalNoFile"

    if ($allErrors.Count -gt 0) {
        Write-Warn "$($allErrors.Count) total errors:"
        $allErrors | ForEach-Object { Write-Warn "  $_" }
    }
} else {
    Write-Warn "Skipping Phase 2 (sync) as requested."
}

# ── Phase 3 — Final status ────────────────────────────────────────────────────

Write-Step "Phase 3 — Final status check"
$status1 = Invoke-Dtb -Method GET -Endpoint "sync-images/status?year=$Year&month=$Month"
Write-Info "Files on disk       : $($status1.files_on_disk)"
Write-Info "Registered in DB    : $($status1.registered_in_db)"
Write-Info "Products linked     : $($status1.linked_products)"

$pct = if ($status1.files_on_disk -gt 0) {
    [math]::Round( ($status1.registered_in_db / $status1.files_on_disk) * 100, 1 )
} else { 0 }

if ($pct -ge 95) {
    Write-Ok "$pct% of disk images registered in DB"
} elseif ($pct -ge 70) {
    Write-Warn "$pct% of disk images registered — some products may be missing images"
} else {
    Write-Fail "$pct% registered — something may have gone wrong"
}

if (-not $DryRun) {
    Write-Host ""
    Write-Host "  ⚡ Next step: bust the frontend IndexedDB product cache" -ForegroundColor Yellow
    Write-Host "     In your browser console (on the live site), run:" -ForegroundColor Yellow
    Write-Host "       indexedDB.deleteDatabase('dtb-products');" -ForegroundColor White
    Write-Host "     Or force a hard reload (Ctrl+Shift+R) to invalidate the SWR cache." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
