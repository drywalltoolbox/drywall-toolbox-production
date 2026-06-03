# Platinum ↔ Level5 Schematic Mapping Audit — Current Assets

## Scope

This audit is re-anchored to the current Platinum schematic tree under:

- `frontend/public/brands/Platinum/Schematics/FinishingBoxes/FlatBox/`
- `frontend/public/brands/Platinum/Schematics/Pumps/CompoundPump/`
- `frontend/public/brands/Platinum/Schematics/CornerRollers/OutsideCornerRoller/`
- `frontend/public/brands/Platinum/Schematics/Handles/*`
- `frontend/public/brands/Platinum/Schematics/CornerFinishers/*`

The older root-level Platinum paths (`CompoundPump`, `FlatBox`, `OutsideCornerRoller`, `CornerRollerHandle`) are stale and should not be used for future audit references.

## Core rule

Do not copy Level5 part numbers into Platinum `sku` fields. Level5 part numbers are retained only as source references for candidate naming.

## Current findings

### 1. Platinum Flat Box

Current Platinum Flat Box JSON has extracted labels/hotspots, but part names are still placeholders (`Part (n)`) and SKUs are numeric placeholders. The current label set closely aligns with the current Level5 `10-inch-Flat-Box` schematic labels.

Status: safe to use Level5 labels as a high-confidence naming reference, with size-sensitive names neutralized because the Platinum schematic title is generic `Flat Box`.

Examples:

- Level5 `10in Flat Box Blade` → recommended Platinum name: `Flat Box Blade`
- Level5 `10in Blade Holder Assembly` → recommended Platinum name: `Blade Holder Assembly`
- Level5 `10in Pressure Plate` → recommended Platinum name: `Pressure Plate`
- Level5 `Flat Box Seal, 10in` → recommended Platinum name: `Flat Box Seal`

### 2. Platinum Compound Pump

Current Platinum Compound Pump has extracted labels/hotspots, but part names are placeholders. Labels `1–48` overlap with the current Level5 compound pump JSON, while `49` is present in the older scraped manifest as `Pump Foot Valve Assembly`. Platinum labels `50–60` do not currently have a Level5 source match in the accessible frontend JSON or scraped manifest and remain unresolved.

Status: mixed confidence.

- Labels `1–48`: candidate mappings from Level5; most are high confidence after visual spot-check.
- Labels `10`, `11`, `28`: mapped from scraped manifest because current Level5 frontend JSON contains placeholder numeric names.
- Label `49`: candidate from scraped manifest only.
- Labels `50–60`: unresolved.

### 3. Platinum Outside Corner Roller

Blocked from direct Level5 inheritance. The Level5 reference in the current frontend is `Corner Roller`, while the Platinum asset is explicitly `Outside Corner Roller`. Numeric label reuse is unsafe unless the actual callout geometry is visually confirmed against a matching outside-corner roller source.

Status: review-only candidates.

### 4. Platinum Handles / Corner Finisher

These are now present in the new Platinum tree. They should be mapped in a second pass against Level5 handle and corner-finisher references after the frontend import/path issue is resolved and visual sheets can be generated from the current PNG files.

## Output file

The detailed crosswalk is:

`products/Production/refs/platinum_level5_current_schematic_crosswalk.csv`

Interpretation:

- `write_to_platinum_name=yes`: suitable to update the Platinum `name` field after spot-checking the current rendered diagram.
- `write_to_platinum_name=no`: candidate/reference only; do not write automatically.
- `platinum_sku_policy`: confirms Level5 part numbers are not Platinum SKUs.

## Frontend asset issue discovered

`frontend/src/pages/Schematics.jsx` still imports/falls back to old Platinum paths while the current checkpoint moved assets into category folders. Before these mappings are visible in the frontend, update Platinum imports/fallbacks from stale paths to the new category-based paths.
