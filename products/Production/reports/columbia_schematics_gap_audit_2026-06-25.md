# Columbia Schematics Gap Audit

Date: 2026-06-25
Repository: `elliotttmiller/drywall-toolbox`
Official source reviewed: `https://www.columbiatools.com/dealer-resources/schematics/`

## Scope

This audit compares Columbia's public schematics library against the active Columbia schematic coverage currently wired into Drywall Toolbox.

Repo sources checked:

- `frontend/src/pages/Schematics.jsx`
  - Columbia static JSON imports
  - Columbia static WebP fallback mappings
- `frontend/src/data/schematicMappings.js`
  - active UI-visible Columbia schematic definitions
- `products/Production/launch/dtb_schematics_bulk_import_seed.csv`
  - backend/import seed rows for Columbia schematics

Selection rule applied:

- Keep one canonical schematic per logical tool/subassembly.
- Prefer `2022` when available.
- Use `2019` when no 2022 version exists.
- Use classic only when no newer/current equivalent exists.
- Exclude repeated duplicate entries from the Columbia page.
- Exclude operations manuals, repair manuals, and maintenance guides.

## Current active Columbia coverage in repo

The repo currently has active Columbia UI definitions for the following logical schematics:

| Existing schematic id | Existing UI title | Status |
|---|---|---|
| `columbia-matrix` | Predator Matrix Handle | Present |
| `columbia-one` | Columbia One Handle | Present, repo-specific/extra relative to current Columbia page |
| `columbia-long-extendable-handle` | Long Extendable Handle | Present, repo-specific/ambiguous relative to current Columbia page |
| `columbia-flat-box-handle` | Flat Box Handle | Present |
| `columbia-closet-monster-flat-box-handle` | Closet Monster Handle | Present |
| `columbia-predator-taper` | Predator Automatic Taper | Present |
| `columbia-semi-automatic-taper` | Semi-Automatic Taper | Present |
| `columbia-2-way-internal-corner` | 2-Way Internal Corner Applicator | Present |
| `columbia-external-corner-applicator` | External Corner Applicator | Present |
| `columbia-standard-outside-corner-roller` | Standard Outside Corner Roller | Present |
| `columbia-inside-corner-roller` | Inside Corner Roller | Present |
| `columbia-throttle-box` | Throttle Corner Box | Present; likely covers Columbia's current Corner Flusher Box entry |
| `columbia-automatic-flat-box` | Automatic Flat Box | Present |
| `columbia-flat-box` | Standard Flat Box | Present |
| `columbia-fat-boy-box` | Fat Boy Flat Box | Present |
| `columbia-angle-head` | Angle Head Corner Finisher | Present |
| `columbia-gooseneck-adapter` | Gooseneck Adapter | Present |
| `columbia-mud-pump` | Mud Pump | Present |
| `columbia-tall-boy-mud-pump` | Tall Boy Mud Pump | Present |
| `columbia-nailspotter` | Nailspotter | Present |
| `columbia-tomahawk-smoothing-blades` | Tomahawk Smoothing Blades | Present |
| `columbia-standard-corner-flusher` | Standard Corner Flusher | Present |
| `columbia-direct-corner-flusher` | Direct Corner Flusher | Present |
| `columbia-combo-flusher` | Combo Corner Flusher | Present |
| `columbia-sander-head` | Sander Head | Present, repo-specific/extra relative to current Columbia page |
| `columbia-compound-tube` | Compound Tube | Present |
| `columbia-cam-lock-tube` | Cam Lock Compound Tube | Present |

## Missing canonical Columbia schematics

These are the missing unique schematics after deduping old/classic/repeated entries and applying the newest-version preference.

| Priority | Columbia official schematic | Columbia category | Preferred version rule | Repo status | Recommended repo path |
|---:|---|---|---|---|---|
| 1 | Angle Head Sub Assemblies 2022 | Angle Heads | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/Angleheads/AngleHeadSubAssemblies/` |
| 2 | Angle Head Quick Release | Angle Heads | No 2022-specific version shown; use current non-classic | Missing | `frontend/public/brands/Columbia/Schematics/Angleheads/AngleHeadQuickRelease/` |
| 3 | Automatic Taper Sub Assemblies 2022 | Automatic Tapers | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/SubAssemblies/` |
| 4 | Automatic Taper Body 2022 | Automatic Tapers | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/Body/` |
| 5 | Automatic Taper Head 2022 | Automatic Tapers | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/Head/` |
| 6 | Automatic Taper Head Quick Release Cap | Automatic Tapers | Current non-classic cap schematic | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/QuickReleaseCap/` |
| 7 | Automatic Taper Head Quick Release O-Ring Cap | Automatic Tapers | Current non-classic cap schematic | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/QuickReleaseORingCap/` |
| 8 | Automatic Taper Head Cam Lock | Automatic Tapers | Current non-classic head variant | Missing | `frontend/public/brands/Columbia/Schematics/AutomaticTapers/AutomaticTaper/CamLockHead/` |
| 9 | Reachline Extendable Handles | Extendable Handles | Current non-classic schematic | Missing | `frontend/public/brands/Columbia/Schematics/Handles/ReachlineExtendableHandles/` |
| 10 | Dropdown Extendable Handles | Extendable Handles | Current non-classic schematic | Missing | `frontend/public/brands/Columbia/Schematics/Handles/DropdownExtendableHandles/` |
| 11 | Fixed Handles 3' | Fixed Handles | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/Handles/FixedHandle3ft/` |
| 12 | Fixed Handles 4' | Fixed Handles | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/Handles/FixedHandle4ft/` |
| 13 | 180 Grip Bent Box Handle | Flat Box Handles | Current non-classic schematic | Missing | `frontend/public/brands/Columbia/Schematics/Handles/FlatBoxHandleBent180Grip/` |
| 14 | 180 Grip Extendable Box Handle | Hydra Reach Flat Box Handles | Current 180 Grip version | Missing | `frontend/public/brands/Columbia/Schematics/Handles/HydraReach180Grip/BoxHandle/` |
| 15 | 180 Grip Extendable Box Handle Reservoir | Hydra Reach Flat Box Handles | Current 180 Grip version | Missing | `frontend/public/brands/Columbia/Schematics/Handles/HydraReach180Grip/Reservoir/` |
| 16 | 180 Grip Extendable Box Handle Extension | Hydra Reach Flat Box Handles | Current 180 Grip version | Missing | `frontend/public/brands/Columbia/Schematics/Handles/HydraReach180Grip/Extension/` |
| 17 | 180 Grip Extendable Box Handle Head | Hydra Reach Flat Box Handles | Current 180 Grip version | Missing | `frontend/public/brands/Columbia/Schematics/Handles/HydraReach180Grip/Head/` |
| 18 | Flat Finisher Box Hinged Sub Assemblies 2022 | Flat Finisher Flat Boxes | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/FinishingBoxes/FlatBoxHingedSubAssemblies/` |
| 19 | 5.5" Flat Finisher Box Door Assembly | Flat Finisher Flat Boxes | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/FinishingBoxes/FlatBoxDoorAssembly5_5/` |
| 20 | Automatic Fat Boy Box | Fat Boy Flat Boxes | No 2022 variant shown; distinct from hinged door | Missing | `frontend/public/brands/Columbia/Schematics/FinishingBoxes/AutomaticFatBoyBox/` |
| 21 | Inside Track Fat Boy Box | Inside Track Flat Boxes | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/FinishingBoxes/InsideTrackFatBoyBox/` |
| 22 | Tall Boy Gooseneck | Pump Accessories | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/Pumps/TallBoyGooseneck/` |
| 23 | Nail Spotter Subassemblies 2022 | Nail Spotters | 2022 available | Missing | `frontend/public/brands/Columbia/Schematics/Nailspotters/NailSpotterSubassemblies/` |
| 24 | 4" Flat Applicator | Applicators | No newer duplicate shown | Missing | `frontend/public/brands/Columbia/Schematics/Applicators/FlatApplicator4in/` |

## Intentionally excluded as older/duplicate

The following official entries should not be added unless there is a specific support requirement for older serial-number tools:

- Classic Angle Head
- Classic Angle Head Quick Release
- Classic Automatic Taper Body
- Classic Automatic Taper Head
- Automatic Taper Body 2018
- Automatic Taper Body 2015
- Predator Automatic Taper Body 2017
- Corner Flusher Box 2014
- Classic Corner Flusher Box
- Classic 180 Grip Box Handle
- Classic Flat Box Handle
- Classic Closet Monster Handle
- Classic Extendable Box Handle and its Reservoir/Extension/Head component schematics
- Fat Boy Box Hinged Door 2015
- Classic Fat Boy Box
- Regular Mud Pump 2019 / Quick Clean Mud Pump, unless needed as a serial-number-specific replacement for the 2022 Mud Pump schematic
- Tall Boy Mud Pump 2018
- Tall Boy Mud Pump 2016
- Box Filler 2014
- Compound Tube 2016
- Compound Tube 2014
- Compound Tube 2009
- Classic Combo Flusher
- Semi Automatic Taper Classic

## Implementation checklist

For each missing schematic that should be added:

1. Download the official Columbia schematic PDF/image from the Columbia schematics page.
2. Convert diagram pages to WebP using the existing schematic conversion workflow.
3. Extract parts into `schematic_data.json` with normalized `id`, `name`, `quantity`, and `sku` fields.
4. Add the JSON import to `frontend/src/pages/Schematics.jsx`.
5. Add the WebP fallback mapping to `_fallbacks` in `frontend/src/pages/Schematics.jsx`.
6. Add/merge a UI definition in `frontend/src/data/schematicMappings.js` if the schematic should be directly user-visible.
7. Add/update `products/Production/launch/dtb_schematics_bulk_import_seed.csv` so backend/import tooling sees the schematic.
8. Run frontend build validation and schematic media manifest smoke checks.

## Risk notes

- Columbia's public page contains repeated tiles and older variants. Do not import every tile verbatim.
- Some existing repo entries are grouped logical schematics, not one-to-one copies of Columbia page tiles. Keep grouped entries when the UI benefits from fewer choices.
- `columbia-throttle-box` appears to cover the current Corner Flusher Box family, but the naming should be normalized in a future cleanup pass if exact user-facing naming matters.
