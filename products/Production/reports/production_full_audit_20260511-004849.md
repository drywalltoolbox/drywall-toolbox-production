# Production Catalog & Image Deep Audit

> **Generated:** 2026-05-11 00:48:49  
> **Catalog:** `products/Production/catalogs/official/woocommerce_catalog_production_wc_import_columbia_live_images.csv`  
> **Image source:** `products/Production/Images/` (1582 files)  
> **Catalog rows:** 2660 (2191 parents/simple, 469 variations)

---

## 1 · Executive Summary

| Metric | Count | Notes |
|--------|-------|-------|
| 🖼️ Images on disk | **1582** | `Production/Images/` |
| 📋 Unique image refs in catalog | **1729** | Across all `Images` cells |
| ✅ Matched (on disk **and** in catalog) | **1323** | 83.6% of disk |
| ❌ In catalog, **NOT** on disk | **406** | Broken image refs on live site |
| &nbsp;&nbsp;&nbsp;↳ Fixable via suffix normalization | **107** | Catalog uses `-01` style; disk has `-1` style |
| &nbsp;&nbsp;&nbsp;↳ Truly missing (need upload) | **299** | No match even after normalization |
| ⚠️ On disk, **NOT** referenced in catalog | **259** | Orphaned / unlisted images |
| 📦 Catalog rows with **zero** images | **1365** | 51.3% of all rows |
| 🔢 Products with numbered sequence gaps | **4** | e.g. `-1` and `-3` exist, `-2` missing |
| 🌐 Image URLs with bad host | **0** | All refs point to `drywalltoolbox.com` ✅ |

### Root Cause Summary

1. **Columbia naming convention mismatch** — The catalog references images with zero-padded suffixes (`-01.webp`, `-02.webp`, …) while files uploaded to `Production/Images/` use non-padded suffixes (`-1.webp`, `-2.webp`, …). **107 of 406** reported "missing" images would resolve with a slug-rename pass.
2. **Columbia truly missing images** — After normalization, **299 image files** still have no disk match. These are references to products or variants not yet photographed/uploaded.
3. **Level 5 image blackout** — **762 of 766** Level 5 rows (99.5%) have no `Images` value at all. Level 5 images have never been assigned in this catalog file.
4. **259 orphaned Columbia images** — Files on disk using the old naming convention that are no longer referenced by any catalog row after the naming update.

---

## 2 · Brand Breakdown

| Brand | Total Rows | Parents | Variations | With Images | Without Images | Catalog Refs | Matched on Disk | Missing from Disk |
|-------|-----------|---------|------------|-------------|---------------|--------------|-----------------|-------------------|
| **Asgard** | 29 | 17 | 12 | 28 | 1 | 28 | 28 | 0 |
| **Columbia** | 1130 | 979 | 151 | 615 | 515 | 728 | 322 | 406 |
| **Dura-Stilts** | 78 | 78 | 0 | 72 | 6 | 72 | 72 | 0 |
| **Level 5** | 766 | 591 | 175 | 4 | 762 | 1 | 1 | 0 |
| **Platinum Drywall Tools** | 42 | 24 | 18 | 42 | 0 | 93 | 93 | 0 |
| **SurPro** | 19 | 19 | 0 | 19 | 0 | 19 | 19 | 0 |
| **TapeTech** | 596 | 483 | 113 | 515 | 81 | 788 | 788 | 0 |

---

## 3 · Columbia: Naming Convention Mismatch

The catalog `Images` column references filenames with **zero-padded** suffixes (e.g. `-01.webp`) while the files physically on disk use **unpadded** suffixes (e.g. `-1.webp`). **107 files** can be resolved by either:
- Renaming the disk files to match the catalog (`-1.webp` → `-01.webp`), **OR**
- Updating the catalog URLs to use non-padded suffixes.

> ⚡ **Recommended fix:** Batch-rename disk files to match the catalog convention, since the catalog is the authoritative source.

<details><summary>View all 107 suffix-fixable pairs</summary>

| Catalog References | Disk File (rename to match) |
|--------------------|-----------------------------|
| `columbia-1-4-20-nyloc-jam-nut-FA292-01.webp` | `columbia-1-4-20-nyloc-jam-nut-FA292-1.webp` |
| `columbia-1-4-20-x-1-2-hex-bolt-FA296-01.webp` | `columbia-1-4-20-x-1-2-hex-bolt-FA296-1.webp` |
| `columbia-1-4-20-x-2-hex-bolt-FA300-01.webp` | `columbia-1-4-20-x-2-hex-bolt-FA300-1.webp` |
| `columbia-1-4-20-x-7-8-flat-socket-FA298-01.webp` | `columbia-1-4-20-x-7-8-flat-socket-FA298-1.webp` |
| `columbia-1-4-28-x-1-4-set-screw-FA302-01.webp` | `columbia-1-4-28-x-1-4-set-screw-FA302-1.webp` |
| `columbia-1-8-x-3-8-split-pin-FA224-01.webp` | `columbia-1-8-x-3-8-split-pin-FA224-1.webp` |
| `columbia-10-24-x-1-hex-bolt-FA273-01.webp` | `columbia-10-24-x-1-hex-bolt-FA273-1.webp` |
| `columbia-10-32-x-nyloc-jam-nut-2-per-pack-FA281-01.webp` | `columbia-10-32-x-nyloc-jam-nut-2-per-pack-fa281-1.webp` |
| `columbia-10-belleville-washer-FA280-01.webp` | `columbia-10-belleville-washer-FA280-1.webp` |
| `columbia-10-flat-washer-FA268-01.webp` | `columbia-10-flat-washer-FA268-1.webp` |
| `columbia-10-x-3-4-fender-washer-FA270-01.webp` | `columbia-10-x-3-4-fender-washer-FA270-1.webp` |
| `columbia-12-fat-boy-flat-box-12FBB-01.webp` | `columbia-12-fat-boy-flat-box-12fbb-1.webp` |
| `columbia-12-tomahawk-smoothing-blade-TSB12-01.webp` | `columbia-12-tomahawk-smoothing-blade-tsb12-1.webp` |
| `columbia-14-stainless-steel-mud-pan-C14MPX6-01.webp` | `columbia-14-stainless-steel-mud-pan-c14mpx6-1.webp` |
| `columbia-18-tomahawk-smoothing-blade-TSB18-01.webp` | `columbia-18-tomahawk-smoothing-blade-tsb18-1.webp` |
| `columbia-2-wheel-inside-corner-applicator-ICA21-01.webp` | `columbia-2-wheel-inside-corner-applicator-ica21-1.webp` |
| `columbia-24-tomahawk-smoothing-blade-TSB24-01.webp` | `columbia-24-tomahawk-smoothing-blade-tsb24-1.webp` |
| `columbia-3-angle-head-carbide-blade-AH33-01.webp` | `columbia-3-angle-head-carbide-blade-ah33-1.webp` |
| `columbia-3-angle-head-tension-spring-AH73-01.webp` | `columbia-3-angle-head-tension-spring-ah73-1.webp` |
| `columbia-3-anglehead-blade-maintenance-kit-AHRBK3-01.webp` | `columbia-3-anglehead-blade-maintenance-kit-ahrbk3-1.webp` |
| `columbia-32-tomahawk-smoothing-blade-TSB32-01.webp` | `columbia-32-tomahawk-smoothing-blade-tsb32-1.webp` |
| `columbia-4-40-x-1-8-binder-slot-FA208-01.webp` | `columbia-4-40-x-1-8-binder-slot-FA208-1.webp` |
| `columbia-4-40-x-5-16-binder-slot-FA215-01.webp` | `columbia-4-40-x-5-16-binder-slot-FA215-1.webp` |
| `columbia-4-wheel-inside-corner-applicator-ICA41-01.webp` | `columbia-4-wheel-inside-corner-applicator-ica41-1.webp` |
| `columbia-40-tomahawk-smoothing-blade-TSB40-01.webp` | `columbia-40-tomahawk-smoothing-blade-tsb40-1.webp` |
| `columbia-5-16-18-x-1-1-4-hex-bolt-FA306-01.webp` | `columbia-5-16-18-x-1-1-4-hex-bolt-FA306-1.webp` |
| `columbia-5-16-18-x-3-4-hex-bolt-FA305-01.webp` | `columbia-5-16-18-x-3-4-hex-bolt-FA305-1.webp` |
| `columbia-6-32-hex-nut-FA232-01.webp` | `columbia-6-32-hex-nut-FA232-1.webp` |
| `columbia-6-32-nyloc-jam-nut-FA234-01.webp` | `columbia-6-32-nyloc-jam-nut-FA234-1.webp` |
| `columbia-6-32-x-5-8-hex-bolt-FA247-01.webp` | `columbia-6-32-x-5-8-hex-bolt-FA247-1.webp` |
| `columbia-6-32-x-5-8-hex-bolt-FA247-02.webp` | `columbia-6-32-x-5-8-hex-bolt-FA247-2.webp` |
| `columbia-7-angle-box-door-gasket-CFB77-01.webp` | `columbia-7-angle-box-door-gasket-cfb77-1.webp` |
| `columbia-7-pressure-door-CFB47-01.webp` | `columbia-7-pressure-door-cfb47-1.webp` |
| `columbia-7-tomahawk-smoothing-blade-TSB7-01.webp` | `columbia-7-tomahawk-smoothing-blade-tsb7-1.webp` |
| `columbia-8-32-x-1-flat-head-screw-FA266-01.webp` | `columbia-8-32-x-1-flat-head-screw-fa266-1.webp` |
| `columbia-8-belleville-washer-FA278-01.webp` | `columbia-8-belleville-washer-fa278-1.webp` |
| `columbia-8-door-gasket-for-angle-box-CFB78-01.webp` | `columbia-8-door-gasket-for-angle-box-cfb78-1.webp` |
| `columbia-8-fat-boy-flat-box-8FBB-01.webp` | `columbia-8-fat-boy-flat-box-8fbb-1.webp` |
| `columbia-8-flat-washer-FA253-01.webp` | `columbia-8-flat-washer-FA253-1.webp` |
| `columbia-8-pressure-door-CFB48-01.webp` | `columbia-8-pressure-door-cfb48-1.webp` |
| `columbia-8-roll-face-CFB28-01.webp` | `columbia-8-roll-face-cfb28-1.webp` |
| `columbia-8-star-washer-FA252-01.webp` | `columbia-8-star-washer-FA252-1.webp` |
| `columbia-aluminum-coarse-thread-adapter-PHA-01.webp` | `columbia-aluminum-coarse-thread-adapter-pha-1.webp` |
| `columbia-anglehead-adaptor-AHA-01.webp` | `columbia-anglehead-adaptor-aha-1.webp` |
| `columbia-automatic-taper-TAPER-01.webp` | `columbia-automatic-taper-TAPER-1.webp` |
| `columbia-automatic-taper-TAPER-02.webp` | `columbia-automatic-taper-TAPER-2.webp` |
| `columbia-automatic-taper-TAPER-03.webp` | `columbia-automatic-taper-TAPER-3.webp` |
| `columbia-automatic-taper-TAPER-04.webp` | `columbia-automatic-taper-TAPER-4.webp` |
| `columbia-automatic-taper-TAPER-05.webp` | `columbia-automatic-taper-TAPER-5.webp` |
| `columbia-automatic-taper-TAPER-06.webp` | `columbia-automatic-taper-TAPER-6.webp` |
| `columbia-box-filler-BF-01.webp` | `columbia-box-filler-BF-1.webp` |
| `columbia-box-handle-cam-follower-BH07-01.webp` | `columbia-box-handle-cam-follower-bh07-1.webp` |
| `columbia-box-handle-hinge-pin-180-grip-BH06-01.webp` | `columbia-box-handle-hinge-pin-180-grip-bh06-1.webp` |
| `columbia-cable-pulley-guide-CTA84-01.webp` | `columbia-cable-pulley-guide-cta84-1.webp` |
| `columbia-compound-tube-box-filler-CLTBF-01.webp` | `columbia-compound-tube-box-filler-cltbf-1.webp` |
| `columbia-compound-tube-box-filler-CLTBF-02.webp` | `columbia-compound-tube-box-filler-cltbf-2.webp` |
| `columbia-compound-tube-box-filler-CLTBF-03.webp` | `columbia-compound-tube-box-filler-cltbf-3.webp` |
| `columbia-compound-tube-box-filler-CLTBF-04.webp` | `columbia-compound-tube-box-filler-cltbf-4.webp` |
| `columbia-corner-roller-wheel-maintenance-kit-CRA2-01.webp` | `columbia-corner-roller-wheel-maintenance-kit-cra2-1.webp` |
| `columbia-cover-plate-assembly-CTA87CL-01.webp` | `columbia-cover-plate-assembly-cta87cl-1.webp` |
| `columbia-cover-plate-cork-seal-CT87CS-01.webp` | `columbia-cover-plate-cork-seal-ct87cs-1.webp` |
| `columbia-door-hinge-CFB15-01.webp` | `columbia-door-hinge-CFB15-1.webp` |
| `columbia-door-spring-FFB17-01.webp` | `columbia-door-spring-FFB17-1.webp` |
| `columbia-flat-applicator-CFLT-01.webp` | `columbia-flat-applicator-CFLT-1.webp` |
| `columbia-gooseneck-GN-01.webp` | `columbia-gooseneck-GN-1.webp` |
| `columbia-handle-mounting-swivel-CR6-01.webp` | `columbia-handle-mounting-swivel-CR6-1.webp` |
| `columbia-lower-brake-lever-BH4-01.webp` | `columbia-lower-brake-lever-BH4-1.webp` |
| `columbia-mud-pump-maintenance-kit-MPR1-01.webp` | `columbia-mud-pump-maintenance-kit-mpr1-1.webp` |
| `columbia-mud-supply-valve-unit-CFB6-01.webp` | `columbia-mud-supply-valve-unit-CFB6-1.webp` |
| `columbia-phantom-dustless-drywall-sander-PDDM-01.webp` | `columbia-phantom-dustless-drywall-sander-pddm-1.webp` |
| `columbia-piston-assembly-for-taper-CTA107-01.webp` | `columbia-piston-assembly-for-taper-cta107-1.webp` |
| `columbia-predator-carbon-fiber-automatic-taper-PTAPER-01.webp` | `columbia-predator-carbon-fiber-automatic-taper-ptaper-1.webp` |
| `columbia-predator-carbon-fiber-automatic-taper-PTAPER-02.webp` | `columbia-predator-carbon-fiber-automatic-taper-ptaper-2.webp` |
| `columbia-predator-carbon-fiber-automatic-taper-PTAPER-03.webp` | `columbia-predator-carbon-fiber-automatic-taper-ptaper-3.webp` |
| `columbia-removable-cover-plate-pin-CTA99-01.webp` | `columbia-removable-cover-plate-pin-cta99-1.webp` |
| `columbia-replacement-14-blade-for-tomahawk-SB214-01.webp` | `columbia-replacement-14-blade-for-tomahawk-sb214-1.webp` |
| `columbia-replacement-18-blade-for-tomahawk-SB218-01.webp` | `columbia-replacement-18-blade-for-tomahawk-sb218-1.webp` |
| `columbia-replacement-24-blade-for-tomahawk-SB224-01.webp` | `columbia-replacement-24-blade-for-tomahawk-sb224-1.webp` |
| `columbia-replacement-32-blade-for-tomahawk-SB232-01.webp` | `columbia-replacement-32-blade-for-tomahawk-sb232-1.webp` |
| `columbia-replacement-7-blade-for-tomahawk-SB27-01.webp` | `columbia-replacement-7-blade-for-tomahawk-sb27-1.webp` |
| `columbia-retaining-quick-release-spring-shaft-CT123-01.webp` | `columbia-retaining-quick-release-spring-shaft-ct123-1.webp` |
| `columbia-sander-head-CS-01.webp` | `columbia-sander-head-cs-1.webp` |
| `columbia-sander-head-CS-02.webp` | `columbia-sander-head-cs-2.webp` |
| `columbia-semi-automatic-taper-SAT-01.webp` | `columbia-semi-automatic-taper-SAT-1.webp` |
| `columbia-spool-retaining-spring-CT119-01.webp` | `columbia-spool-retaining-spring-CT119-1.webp` |
| `columbia-swivel-coupling-pin-CR12-01.webp` | `columbia-swivel-coupling-pin-CR12-1.webp` |
| `columbia-taper-adjustable-brake-CT14A-01.webp` | `columbia-taper-adjustable-brake-CT14A-1.webp` |
| `columbia-taper-bearing-shaft-CT106-01.webp` | `columbia-taper-bearing-shaft-ct106-1.webp` |
| `columbia-taper-blades-maintenance-kit-CTR42A-01.webp` | `columbia-taper-blades-maintenance-kit-ctr42a-1.webp` |
| `columbia-taper-cables-kit-3-per-pack-CTR72-01.webp` | `columbia-taper-cables-kit-3-per-pack-ctr72-1.webp` |
| `columbia-taper-crimping-arm-left-CT48-01.webp` | `columbia-taper-crimping-arm-left-ct48-1.webp` |
| `columbia-taper-cutter-block-assembly-CTA41-01.webp` | `columbia-taper-cutter-block-assembly-cta41-1.webp` |
| `columbia-taper-dog-base-bracket-CTA13-01.webp` | `columbia-taper-dog-base-bracket-cta13-1.webp` |
| `columbia-taper-head-casting-CT1-01.webp` | `columbia-taper-head-casting-ct1-1.webp` |
| `columbia-taper-knife-guide-right-bracket-CT26-01.webp` | `columbia-taper-knife-guide-right-bracket-ct26-1.webp` |
| `columbia-taper-lock-block-CT113-01.webp` | `columbia-taper-lock-block-ct113-1.webp` |
| `columbia-taper-magnet-CTA59-01.webp` | `columbia-taper-magnet-cta59-1.webp` |
| `columbia-taper-maintenance-kit-CTR1-01.webp` | `columbia-taper-maintenance-kit-ctr1-1.webp` |
| `columbia-taper-mud-guard-plate-CT11-01.webp` | `columbia-taper-mud-guard-plate-ct11-1.webp` |
| `columbia-taper-plastic-roller-sleeve-CT129B-01.webp` | `columbia-taper-plastic-roller-sleeve-ct129b-1.webp` |
| `columbia-taper-spacer-bar-CT51-01.webp` | `columbia-taper-spacer-bar-ct51-1.webp` |
| `columbia-taper-tube-holding-bracket-lower-CT38-01.webp` | `columbia-taper-tube-holding-bracket-lower-ct38-1.webp` |
| `columbia-taper-tube-holding-bracket-upper-CT37-01.webp` | `columbia-taper-tube-holding-bracket-upper-ct37-1.webp` |
| `columbia-twist-lock-extendable-handle-3-8-TL38-01.webp` | `columbia-twist-lock-extendable-handle-3-8-tl38-1.webp` |
| `columbia-two-way-internal-corner-applicator-ICATW-01.webp` | `columbia-two-way-internal-corner-applicator-ICATW-1.webp` |
| `columbia-two-way-internal-corner-applicator-ICATW-02.webp` | `columbia-two-way-internal-corner-applicator-ICATW-2.webp` |
| `columbia-wide-outside-corner-roller-COBCRW-01.webp` | `columbia-wide-outside-corner-roller-cobcrw-1.webp` |

</details>

---

## 4 · Truly Missing Images (Need Upload)

These **299** image filenames are referenced in the catalog but have no match on disk even after suffix normalization. They represent products that have never had images uploaded.

**246 unique SKUs** affected. First 50 files:

| Catalog Filename | SKU |
|------------------|-----|
| `columbia-1-16-x-3-8-split-pin-FA201-01.webp` | `FA201` |
| `columbia-1-4-20-nyloc-nut-FA290-01.webp` | `FA290` |
| `columbia-1-4-20-x-1-2-flat-socket-FA295-01.webp` | `FA295` |
| `columbia-1-4-20-x-3-8-socket-hd-screw-FA294-01.webp` | `FA294` |
| `columbia-1-4-e-clip-for-matrix-handle-FA379-01.webp` | `FA379` |
| `columbia-1-4-plastic-washer-FA285-01.webp` | `FA285` |
| `columbia-1-8-e-clip-for-matrix-handle-FA380-01.webp` | `FA380` |
| `columbia-1-8-x-3-8-special-washer-FA225-01.webp` | `FA225` |
| `columbia-10-24-x-1-1-2-pan-slot-FA314-01.webp` | `FA314` |
| `columbia-10-24-x-1-1-4in-hex-bolt-FA279-01.webp` | `FA279` |
| `columbia-10-24-x-1-4-set-screw-FA312-01.webp` | `FA312` |
| `columbia-10-24-x-3-4-hex-bolt-FA275-01.webp` | `FA275` |
| `columbia-10-24-x-3-8-socket-hd-screw-FA274-01.webp` | `FA274` |
| `columbia-10-24-x-7-8-pan-head-screw-FA276-01.webp` | `FA276` |
| `columbia-10-inch-fat-boy-automatic-assist-dry-10FBBA-01.webp` | `10FBBA` |
| `columbia-10-inch-inside-track-fat-boy-flat-bo-10ITFB-01.webp` | `10ITFB` |
| `columbia-10-inch-stainless-steel-comfort-grip-CTK10-01.webp` | `CTK10` |
| `columbia-12-automatic-flat-box-12FFBA-01.webp` | `12FFBA` |
| `columbia-12-fat-boy-automatic-assist-drywall-flat-box-12FBBA-01.webp` | `12FBBA` |
| `columbia-12-flat-finishing-box-12FFB-01.webp` | `12FFB` |
| `columbia-12-inch-inside-track-fat-boy-flat-bo-12ITFB-01.webp` | `12ITFB` |
| `columbia-12-inch-stainless-steel-comfort-grip-CTK12-01.webp` | `CTK12` |
| `columbia-12-sabre-smoothing-blade-SSB12-01.webp` | `SSB12` |
| `columbia-14-automatic-flat-box-14FFBA-01.webp` | `14FFBA` |
| `columbia-14-flat-box-14FFB-01.webp` | `14FFB` |
| `columbia-14-inch-stainless-steel-comfort-grip-CTK14-01.webp` | `CTK14` |
| `columbia-14-sabre-smoothing-blade-SSB14-01.webp` | `SSB14` |
| `columbia-16-sabre-smoothing-blade-SSB16-01.webp` | `SSB16` |
| `columbia-18-closet-monster-flat-box-handle-CMH-01.webp` | `CMH` |
| `columbia-18-closet-monster-flat-box-handle-CMH-02.webp` | `CMH` |
| `columbia-18-inch-closet-monster-flat-box-hand-CMH-01.webp` | `CMH` |
| `columbia-18-inch-closet-monster-flat-box-hand-CMH-02.webp` | `CMH` |
| `columbia-18-sabre-smoothing-blade-SSB18-01.webp` | `SSB18` |
| `columbia-180-grip-flat-box-handle-COL-BH-01.webp` | `3BH` |
| `columbia-2-5-angle-head-carbide-blade-AH325-01.webp` | `AH325` |
| `columbia-2-5-angle-head-frame-tension-spring-AH725-01.webp` | `AH725` |
| `columbia-2-5-anglehead-25AH-01.webp` | `25AH` |
| `columbia-2-5-anglehead-blade-maintenance-kit-AHRBK25-01.webp` | `AHRBK25` |
| `columbia-2-anglehead-2AH-01.webp` | `2AH` |
| `columbia-2-inch-angle-head-frame-tension-spri-AH72-01.webp` | `AH72` |
| `columbia-2-inch-anglehead-blade-maintenance-k-AHRBK2-01.webp` | `AHRBK2` |
| `columbia-2-nailspotter-2NS-01.webp` | `2NS` |
| `columbia-2-wheel-inside-corner-applicator-ICA21-02.webp` | `ICA21` |
| `columbia-2-wheel-inside-corner-applicator-ICA21-03.webp` | `ICA21` |
| `columbia-2-wheel-inside-corner-applicator-ICA21-04.webp` | `ICA21` |
| `columbia-24-cam-lock-tube-CLT24-01.webp` | `CLT24` |
| `columbia-24-compound-mud-tube-CMT24-01.webp` | `CMT24` |
| `columbia-24-sabre-smoothing-blade-SSB24-01.webp` | `SSB24` |
| `columbia-29-39-predator-matrix-box-handle-PMHS-01.webp` | `PMHS` |
| `columbia-29-inch-39-inch-predator-matrix-box-PMHS-01.webp` | `PMHS` |
| `columbia-3-5-angle-head-carbide-blade-AH335-01.webp` | `AH335` |
| `columbia-3-5-anglehead-35AH-01.webp` | `35AH` |
| `columbia-3-5-anglehead-blade-maintenance-kit-AHRBK35-01.webp` | `AHRBK35` |
| `columbia-3-5-combo-flusher-35CSF-01.webp` | `35CSF` |
| `columbia-3-5-direct-corner-flusher-35DF-01.webp` | `35DF` |
| `columbia-3-5-extendable-one-handle-C1HEXT-01.webp` | `C1HEXT` |
| `columbia-3-5-extendable-one-handle-C1HEXT-02.webp` | `C1HEXT` |
| `columbia-3-5-extendable-one-handle-C1HEXT-03.webp` | `C1HEXT` |
| `columbia-3-5-extendable-one-handle-C1HEXT-04.webp` | `C1HEXT` |
| `columbia-3-5-predator-one-extendable-handle-PC1HEXT-01.webp` | `PC1HEXT` |
| `columbia-3-5-standard-corner-flusher-35SF-01.webp` | `35SF` |
| `columbia-3-anglehead-3AH-01.webp` | `3AH` |
| `columbia-3-combo-flusher-3CSF-01.webp` | `3CSF` |
| `columbia-3-direct-corner-flusher-3DF-01.webp` | `3DF` |
| `columbia-3-inch-widetrack-direct-corner-flush-3WTDF-01.webp` | `3WTDF` |
| `columbia-3-inch-widetrack-direct-corner-flush-3WTDF-02.webp` | `3WTDF` |
| `columbia-3-nailspotter-3NS-01.webp` | `3NS` |
| `columbia-3-standard-corner-flusher-3SF-01.webp` | `3SF` |
| `columbia-3-standard-corner-flusher-3WTSF-01.webp` | `3WTSF` |
| `columbia-3-widetrack-direct-corner-flusher-3WTDF-01.webp` | `3WTDF` |
| `columbia-3-widetrack-direct-corner-flusher-3WTDF-02.webp` | `3WTDF` |
| `columbia-32-cam-lock-tube-CLT32-01.webp` | `CLT32` |
| `columbia-32-compound-mud-tube-CMT32-01.webp` | `CMT32` |
| `columbia-32-sabre-smoothing-blade-SSB32-01.webp` | `SSB32` |
| `columbia-33-64-x-7-8-flat-washer-FA308-01.webp` | `FA308` |
| `columbia-36-inch-180-grip-bent-flat-box-handl-3BBH-01.webp` | `3BBH` |
| `columbia-4-40-x-3-4-bind-head-screw-FA220-01.webp` | `FA220` |
| `columbia-4-8-long-extendible-handle-CHXL-01.webp` | `CHXL` |
| `columbia-4-8-predator-long-extendable-handle-PCHXL-01.webp` | `PCHXL` |
| `columbia-4-extendable-one-handle-C1H-01.webp` | `C1H` |
| `columbia-4-extendable-one-handle-C1H-02.webp` | `C1H` |
| `columbia-4-extendable-one-handle-C1H-03.webp` | `C1H` |
| `columbia-4-extendable-one-handle-C1H-04.webp` | `C1H` |
| `columbia-4-wheel-inside-corner-applicator-ICA41-02.webp` | `ICA41` |
| `columbia-4-wheel-inside-corner-applicator-ICA41-03.webp` | `ICA41` |
| `columbia-4-wheel-inside-corner-applicator-ICA41-04.webp` | `ICA41` |
| `columbia-40-58-predator-matrix-box-handle-PMH-01.webp` | `PMH` |
| `columbia-40-inch-58-inch-predator-matrix-box-PMH-01.webp` | `PMH` |
| `columbia-40-sabre-smoothing-blade-SSB40-01.webp` | `SSB40` |
| `columbia-41-75-inch-sabre-smoothing-blade-ext-SBP-01.webp` | `SBP` |
| `columbia-41-75-sabre-smoothing-blade-extension-pole-SBP-01.webp` | `SBP` |
| `columbia-42-180-grip-bent-flat-box-handle-42BBH-01.webp` | `42BBH` |
| `columbia-42-180-grip-flat-box-handle-42BH-01.webp` | `42BH` |
| `columbia-42-cam-lock-tube-CLT42-01.webp` | `CLT42` |
| `columbia-42-compound-mud-tube-CMT42-01.webp` | `CMT42` |
| `columbia-42-predator-cam-lock-tube-PCLT42-01.webp` | `PCLT42` |
| `columbia-42-predator-compound-tube-PCMT42-01.webp` | `PCMT42` |
| `columbia-48-180-grip-bent-flat-box-handle-4BBH-01.webp` | `4BBH` |
| `columbia-48-180-grip-flat-box-handle-4BH-01.webp` | `4BH` |
| `columbia-48-sabre-smoothing-blade-SSB48-01.webp` | `SSB48` |
| *…and 199 more* | |

---

## 5 · Orphaned Images on Disk

These **259** files exist in `Production/Images/` but are not referenced by any catalog row. All are Columbia brand. Most use the old naming convention (`-1.webp` style) superseded by the catalog update. They should be audited against the suffix-fixable list — those in that list are **needed once renamed**; the remainder can be archived or deleted.

- **107** orphaned files are the rename-target (needed by catalog after rename)
- **152** orphaned files have no catalog reference even after normalization → safe to archive

<details><summary>View truly orphaned files (no catalog match)</summary>

| Filename |
|----------|
| `columbia-1-2-x-7-8-flat-washer-FA308-1.webp` |
| `columbia-1-4-20-hex-nut-CT109-1.webp` |
| `columbia-1-4-20-nyloc-jam-nut-FA292-2.webp` |
| `columbia-1-4-20-x-38-socket-FA294-1.webp` |
| `columbia-1-4-ss-e-clip-FA379-1.webp` |
| `columbia-1-4-x-1-2-flathead-socket-FA295-1.webp` |
| `columbia-1-8-ss-e-clip-FA380-1.webp` |
| `columbia-1-8-x-3-8-rivet-shoulder-washer-FA225-1.webp` |
| `columbia-10-24-x-1-14in-hex-bolt-fa279-1.webp` |
| `columbia-10-24-x-1-4-socket-hand-set-FA312-1.webp` |
| `columbia-10-24-x-1-4-socket-hand-set-FA312-2.webp` |
| `columbia-10-24-x-3-8-socket-FA274-1.webp` |
| `columbia-10-24-x-7-8-hex-bolt-FA275-1.webp` |
| `columbia-10-24-x-7-8-pan-slot-FA276-1.webp` |
| `columbia-10-belleville-washer-FA280-2.webp` |
| `columbia-10-fat-boy-flat-box-10fbb-1.webp` |
| `columbia-10-flat-washer-FA268-2.webp` |
| `columbia-10-tomahawk-smoothing-blade-tsb10-1.webp` |
| `columbia-116-x-38-split-pin-fa201-1.webp` |
| `columbia-12-stainless-steel-mud-pan-c12mpx6-1.webp` |
| `columbia-2-angle-head-carbide-blade-ah32-1.webp` |
| `columbia-2-angle-head-frame-tension-spring-ah72-1.webp` |
| `columbia-2-anglehead-blade-maintenance-kit-ahrbk2-1.webp` |
| `columbia-25-angle-head-carbide-blade-ah325-1.webp` |
| `columbia-25-angle-head-frame-tension-spring-ah725-1.webp` |
| `columbia-25-anglehead-25ah-1.webp` |
| `columbia-25-anglehead-blade-maintenance-kit-ahrbk25-1.webp` |
| `columbia-25-combo-flusher-25csf-1.webp` |
| `columbia-25-direct-corner-flusher-25df-1.webp` |
| `columbia-25-standard-corner-flusher-25sf-1.webp` |
| `columbia-35-angle-head-carbide-blade-ah335-1.webp` |
| `columbia-35-angle-head-frame-tension-spring-ah735-1.webp` |
| `columbia-35-anglehead-35ah-1.webp` |
| `columbia-35-anglehead-blade-maintenance-kit-ahrbk35-1.webp` |
| `columbia-35-combo-flusher-35csf-1.webp` |
| `columbia-35-direct-corner-flusher-35df-1.webp` |
| `columbia-35-standard-corner-flusher-35sf-1.webp` |
| `columbia-4-40-x-1-8-binder-slot-FA208-2.webp` |
| `columbia-4-40-x-3-4-hex-bolt-FA220-1.webp` |
| `columbia-4-40-x-3-4-hex-bolt-FA220-2.webp` |
| `columbia-5-40-x-38-bind-head-screw-fa222-1.webp` |
| `columbia-55-fat-boy-flat-box-55fbb-1.webp` |
| `columbia-55-flat-finishing-box-55ffb-1.webp` |
| `columbia-6-32-hex-nut-FA232-2.webp` |
| `columbia-6-32-x-1-2-fillister-slot-FA245-1.webp` |
| `columbia-6-32-x-1-2-fillister-slot-FA245-2.webp` |
| `columbia-6-32-x-3-8-hex-bolt-FA231-1.webp` |
| `columbia-6-32-x-3-8-hex-bolt-FA231-2.webp` |
| `columbia-7-tomahawk-smoothing-blade-tsb7-6.webp` |
| `columbia-7-tomahawk-smoothing-blade-tsb7-7.webp` |
| `columbia-7-tomahawk-smoothing-blade-tsb7-8.webp` |
| `columbia-7-tomahawk-smoothing-blade-tsb7-9.webp` |
| `columbia-8-32-x-1-1-2-pan-slot-FA267-1.webp` |
| `columbia-8-32-x-1-2-socket-FA262-1.webp` |
| `columbia-8-32-x-1-2-socket-FA262-2.webp` |
| `columbia-8-32-x-3-16-pan-slot-FA256-1.webp` |
| `columbia-8-32-x-3-16-pan-slot-FA256-2.webp` |
| `columbia-8-32-x-3-8-socket-screw-FA261-1.webp` |
| `columbia-8-fat-boy-flat-box-8fbb-2.webp` |
| `columbia-8-flat-washer-FA253-2.webp` |
| `columbia-8-star-washer-FA252-2.webp` |
| `columbia-barrel-main-body-CT103-1.webp` |
| `columbia-bearing-CT125A-1.webp` |
| `columbia-bearing-sleeve-CFB16-1.webp` |
| `columbia-bottom-retainer-corner-clip-AH9-1.webp` |
| `columbia-box-mount-CFB8-1.webp` |
| `columbia-bracket-brace-CT87A-1.webp` |
| `columbia-cable-drum-CT73-1.webp` |
| `columbia-cap-reinforcing-tab-CT35-1.webp` |
| `columbia-chain-tension-guide-bracket-CT31-1.webp` |
| `columbia-clutch-release-rod-CT88-1.webp` |
| `columbia-clutch-release-shaft-CT85-1.webp` |
| `columbia-clutch-return-spring-CT81-1.webp` |
| `columbia-connecting-rod-CT45-1.webp` |
| `columbia-connecting-stud-CT112-1.webp` |
| `columbia-corner-cobra-CC-1.webp` |
| `columbia-corner-roller-CR-1.webp` |
| `columbia-crimper-lever-CT105-1.webp` |
| `columbia-crimping-arm-shaft-bushing-l-CT10A-1.webp` |
| `columbia-crimping-wheel-CT47-1.webp` |
| `columbia-crimping-wheel-bushing-CT50-1.webp` |
| `columbia-ct86-toe-kicker-cable-CT86-1.webp` |
| `columbia-cttmh9-mh9-1.webp` |
| `columbia-drive-chain-CT78-1.webp` |
| `columbia-drive-sprocket-large-CT77-1.webp` |
| `columbia-drive-sprocket-small-CT71-1.webp` |
| `columbia-extension-shaft-CT130-1.webp` |
| `columbia-extension-shaft-bracket-CT127-1.webp` |
| `columbia-external-90-applicator-CEXT90-1.webp` |
| `columbia-external-90-applicator-CEXT90-2.webp` |
| `columbia-funnel-retainer-clip-AH6A-1.webp` |
| `columbia-grip-adjuster-housing-MH21-1.webp` |
| `columbia-guard-ring-CT115-1.webp` |
| `columbia-guide-rod-bushing-CT58-1.webp` |
| `columbia-hinge-block-CT20-1.webp` |
| `columbia-hollow-shaft-CT79-1.webp` |
| `columbia-hub-CT68-1.webp` |
| `columbia-insert-bushing-for-ct-7a-CT2-1.webp` |
| `columbia-knife-guide-bracket-left-CT27-1.webp` |
| `columbia-knife-guide-square-tube-CT25-1.webp` |
| `columbia-knife-retainer-block-CT41-1.webp` |
| `columbia-left-nylatron-chain-roller-large-CT29A-1.webp` |
| `columbia-long-extendable-handle-4-8-CHXL-1.webp` |
| `columbia-micro-chain-CT43-1.webp` |
| `columbia-mounting-plate-BH1-1.webp` |
| `columbia-mounting-plate-BH1-2.webp` |
| `columbia-mud-shut-off-gasket-CT96-1.webp` |
| `columbia-mud-supply-seal-plate-shaft-CT98-1.webp` |
| `columbia-mud-supply-valve-body-CT97-1.webp` |
| `columbia-needle-return-shaft-CT64-1.webp` |
| `columbia-needle-return-spring-CT65-1.webp` |
| `columbia-outside-bead-bullnose-corner-roller-CBNCR-1.webp` |
| `columbia-outside-bead-corner-roller-COBCR-1.webp` |
| `columbia-paper-feed-guide-CT19-1.webp` |
| `columbia-pinch-brake-MH17-1.webp` |
| `columbia-pinch-brake-bushing-MH24-1.webp` |
| `columbia-pinch-brake-stem-MH25-1.webp` |
| `columbia-piston-assembly-for-taper-cta107-2.webp` |
| `columbia-piston-body-CT107-1.webp` |
| `columbia-piston-cup-CT111-1.webp` |
| `columbia-plate-BH2-1.webp` |
| `columbia-powerfill-3-5-pro-series-cordless-loading-pump-CPFP-1.webp` |
| `columbia-powerfill-3-5-pro-series-cordless-loading-pump-CPFP-2.webp` |
| `columbia-quick-clean-mud-pump-box-filler-not-included-HMP-1.webp` |
| `columbia-ratchet-gear-CT67-1.webp` |
| `columbia-release-clip-bushing-CT92-1.webp` |
| `columbia-release-rod-sleeve-CT89-1.webp` |
| `columbia-removable-cover-plate-attachment-block-ct34r-1.webp` |
| `columbia-replacement-12-blade-for-tomahawk-sb212-1.webp` |
| `columbia-return-spring-tube-CT36-1.webp` |
| `columbia-right-nylatron-chain-roller-small-CT29-1.webp` |
| `columbia-right-wafer-bushing-CT5-1.webp` |
| `columbia-roller-bushing-CT28-1.webp` |
| `columbia-rollers-CT125-1.webp` |
| `columbia-sawed-off-automatic-taper-39-STAPER-1.webp` |
| `columbia-sawed-off-automatic-taper-39-STAPER-2.webp` |
| `columbia-sawed-off-automatic-taper-39-STAPER-3.webp` |
| `columbia-sawed-off-automatic-taper-39-STAPER-4.webp` |
| `columbia-sawed-off-automatic-taper-39-STAPER-5.webp` |
| `columbia-side-blade-AH4-1.webp` |
| `columbia-side-plate-hub-CT7A-1.webp` |
| `columbia-split-pin-14-x-2-fa289-1.webp` |
| `columbia-stainless-steel-side-plate-left-CT6A-1.webp` |
| `columbia-strap-CT116A-1.webp` |
| `columbia-tall-boy-loading-pump-TBMP-1.webp` |
| `columbia-tape-advance-carriage-CT57-1.webp` |
| `columbia-tape-spool-CT120-1.webp` |
| `columbia-toe-kicker-CT53-1.webp` |
| `columbia-toe-kicker-caple-retainer-clip-CT92A-1.webp` |
| `columbia-top-retainer-corner-clip-AH8-1.webp` |
| `columbia-upper-mounting-bracket-BH5-1.webp` |
| `columbia-upper-mounting-bracket-BH5-2.webp` |
</details>

---

## 6 · Level 5: Complete Image Gap

Level 5 has **766 rows** in this catalog but only **4** have image references — a **99.5% gap**.

| Level 5 Type | No-Image Rows |
|---|---|
| Parent / simple | 590 |
| Variation | 172 |

Level 5 images are **not present** in `Production/Images/` at all — the live server has no Level 5 product images. This brand requires a full image upload and catalog assignment pass.

Sample Level 5 SKUs missing images:

| SKU | Name | Type |
|-----|------|------|
| `4-760` | Level5 Automatic Taper | simple |
| `BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE` | Level5 Blue Steel Big Back Taping Knife - Soft Grip Handle | variable |
| `BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE` | Level5 Blue Steel Taping Knife - Soft Grip Handle | variable |
| `CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE` | Level5 Carbon Steel Finishing Knife with Soft Grip Handle | variable |
| `5-603` | Level5 Carbon Steel Joint Knife Set 5 - 603 | simple |
| `5-200` | Level5 Carbon Steel Specialized Putty Knife with Soft Grip H | simple |
| `COMPOSITE-SKIMMING-BLADE` | Level5 Composite Skimming Blade | variable |
| `4-941C` | Level5 Composite Skimming Blade Pole Adapter | simple |
| `5-440C` | Level5 Composite Skimming Blade Set - 10", 16", 24" with Ext | simple |
| `5-441C` | Level5 Composite Skimming Blade Set - 10", 24", 32" with Ext | simple |
| `COMPOUND-PUMP-REPAIR-PARTS` | Level5 Compound Pump Repair Parts | variable |
| `4-771` | Level5 Compound Pump with Filler and Wrench with Bonus Stora | simple |
| `4-741` | Level5 Compound Tube | simple |
| `CORNER-APPLICATOR` | Level5 Corner Applicator | variable |
| `4-002` | Level5 Corner Drywall Compound Roller Cover Replacement | simple |
| `4-006` | Level5 Corner Drywall Compound Roller with Frame | simple |
| `CORNER-FINISHER` | Level5 Corner Finisher | variable |
| `CORNER-FINISHER-BLADE-KIT` | Level5 Corner Finisher Blade Kit | variable |
| `CORNER-FINISHER-REBUILD-KIT` | Level5 Corner Finisher Rebuild Kit | variable |
| `CORNER-FLUSHER` | Level5 Corner Flusher | variable |

---

## 7 · SKUs With No Images — All Brands

Total rows with empty `Images` field: **1365**

| Brand | No-Image Rows | % of Brand Total |
|-------|--------------|-----------------|
| Level 5 | 762 | 99.5% |
| Columbia | 515 | 45.6% |
| TapeTech | 81 | 13.6% |
| Dura-Stilts | 6 | 7.7% |
| Asgard | 1 | 3.4% |

---

## 8 · Image Sequence Gaps on Disk

**4 products** on disk have non-contiguous image numbers:

| Product Base | Found | Missing |
|---|---|---|
| `columbia-7-tomahawk-smoothing-blade-tsb7` | [1, 6, 7, 8, 9] | **[2, 3, 4, 5]** |
| `platinum-pt-10fb-PT-10FB` | [1, 2, 3, 5] | **[4]** |
| `platinum-pt-ct42-PT-CT42` | [2] | **[1]** |
| `tapetech-tool-caddy-tc01tt` | [1, 2, 4, 5, 6] | **[3]** |

---

## 9 · Action Plan (Prioritized)

| Priority | Category | Action | Volume |
|----------|----------|--------|--------|
| 🔴 **Critical** | Missing images | Upload **299 truly missing** Columbia images to `Production/Images/` — these are broken refs on the live site | 299 files |
| 🔴 **Critical** | Naming mismatch | Batch-rename **107 disk files** from old `-N` style to `-0N` style to match catalog URLs | 107 files |
| 🔴 **Critical** | Level 5 images | Upload Level 5 product images and assign to **590 parent rows** and **172 variation rows** | 766 rows |
| 🟠 **High** | No-image Columbia | Assign images to **515** Columbia rows with no `Images` value | 515 rows |
| 🟠 **High** | No-image TapeTech | Assign images to **81** TapeTech no-image rows | 81 rows |
| 🟡 **Medium** | Orphaned images | Archive or delete **152 truly orphaned** disk images with no catalog reference | 152 files |
| 🟡 **Medium** | Sequence gaps | Investigate **4** products with numbered image gaps | 4 products |
| 🟢 **Low** | Other brands | Verify Asgard (1 no-image), Dura-Stilts (6 no-image) are intentional | 7 rows |

---

## 10 · Reference: Previous Audit Cross-Check

The following prior reports in `products/reports/` are consistent with these findings:

| Prior Report | Relevance |
|---|---|
| `columbia_image_basename_mismatches.csv` | Documents the slug/basename mismatches — directly aligns with the **107 suffix-fixable** pairs found here |
| `columbia_live_image_unmatched_skus.csv` | Columbia SKUs that had no live image — consistent with the **truly missing** set |
| `columbia_unmatched_image_candidates_ranked.csv` | Ranked candidate matches for unmatched Columbia images |
| `image_cross_reference.csv` | Prior cross-reference output; this audit supersedes it with current disk state |
| `wc-catalog-audit-summary.md` | High-level catalog quality audit; image coverage is a known open item |

---

*Audit script: `scripts/production_catalog/audit_production_full.py` | Generated: 2026-05-11 00:48:49*