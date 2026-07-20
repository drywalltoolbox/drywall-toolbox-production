param(
    [string[]] $CatalogPaths = @(
        'products/Production/launch/dtb_woocommerce_official_catalog.csv',
        'products/Production/launch/wc-product-export-current.csv'
    ),
    [string] $VeeqoPath = 'products/Production/launch/extra/veeqo_inventory_import.csv'
)

$ErrorActionPreference = 'Stop'

$leadImage = 'https://drywalltoolbox.com/wp-content/uploads/2026/media/platinum_pt_ct36_02.webp'
$existingImage = 'https://drywalltoolbox.com/wp-content/uploads/2026/media/platinum_pt_ct36_03.webp'
$gallery = "$leadImage, $existingImage"
$quotedGallery = '"' + $gallery + '"'
$utf8WithBom = [System.Text.UTF8Encoding]::new($true)

foreach ($catalogPath in $CatalogPaths) {
    $resolvedPath = (Resolve-Path -LiteralPath $catalogPath).Path
    $content = [System.IO.File]::ReadAllText($resolvedPath)
    $quotedGalleryCount = ([regex]::Matches($content, [regex]::Escape($quotedGallery))).Count
    $galleryCount = ([regex]::Matches($content, [regex]::Escape($gallery))).Count
    $existingImageCount = ([regex]::Matches($content, [regex]::Escape($existingImage))).Count

    if ($quotedGalleryCount -eq 2) {
        $updated = $content
    } elseif ($galleryCount -eq 2) {
        # Repair an unquoted multi-image CSV field from an interrupted/older run.
        $updated = $content.Replace($gallery, $quotedGallery)
    } elseif ($existingImageCount -eq 2) {
        $updated = $content.Replace($existingImage, $quotedGallery)
    } else {
        throw "Expected two PT-CT parent/variation image matches in $catalogPath; found existing=$existingImageCount, gallery=$galleryCount, quoted=$quotedGalleryCount."
    }

    [System.IO.File]::WriteAllText($resolvedPath, $updated, $utf8WithBom)
}

$resolvedVeeqoPath = (Resolve-Path -LiteralPath $VeeqoPath).Path
$veeqoContent = [System.IO.File]::ReadAllText($resolvedVeeqoPath)
$veeqoExistingCount = ([regex]::Matches($veeqoContent, [regex]::Escape($existingImage))).Count
$veeqoLeadCount = ([regex]::Matches($veeqoContent, [regex]::Escape($leadImage))).Count

if ($veeqoExistingCount -eq 1 -and $veeqoLeadCount -eq 0) {
    $updatedVeeqo = $veeqoContent.Replace($existingImage, $leadImage)
} elseif ($veeqoExistingCount -eq 0 -and $veeqoLeadCount -eq 1) {
    $updatedVeeqo = $veeqoContent
} else {
    throw "Expected one PT-CT36 Veeqo image match in $VeeqoPath; found existing=$veeqoExistingCount, lead=$veeqoLeadCount."
}

[System.IO.File]::WriteAllText($resolvedVeeqoPath, $updatedVeeqo, $utf8WithBom)

Write-Output "Updated Platinum Compound Tube image ordering in $($CatalogPaths.Count) catalogs and the Veeqo import."
