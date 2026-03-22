# Columbia Parts Schematics Categories

This document outlines how Columbia Taping Tools part schematics are organized by category in the Parts page.

## Category Structure

Each Columbia schematic now has a `category` property that allows for filtering and organization.

### Handles (2)
- **Predator Matrix Handle** - Multi-page schematic with box handle, head, lever, pinchbox, and extension housing
- **Gooseneck Adapter** - Adapter schematic

### Automatic Tapers (1)
- **Predator Taper** - Two-page taper schematic with body and head details

### Applicators (2)
- **2-Way Internal Corner Applicator** - Internal corner application tool
- **External Corner Applicator** - External corner application tool

### Corner Rollers (2)
- **Standard Outside Corner Roller** - Outside corner finishing roller
- **Inside Corner Roller** - Inside corner finishing roller

### Corner Boxes (1)
- **Throttle Box** - Corner box schematic

### Finishing Boxes (3)
- **Automatic Flat Box** - Automatic flat finishing box with 66 parts
- **Flat Box** - Manual flat finishing box with 53 parts
- **Fat Boy Box** - Large capacity flat box with 49 parts

### Angleheads (1)
- **Angle Head** - Angle head applicator schematic

### Pumps (2)
- **Mud Pump** - Standard mud pump schematic
- **Tall Boy Mud Pump** - Large capacity mud pump with 53 parts

## Category Counts

| Category | Count |
|----------|-------|
| Handles | 2 |
| Automatic Tapers | 1 |
| Applicators | 2 |
| Corner Rollers | 2 |
| Corner Boxes | 1 |
| Finishing Boxes | 3 |
| Angleheads | 1 |
| Pumps | 2 |
| **TOTAL** | **14** |

## Unused Categories

The following categories were defined but don't currently have schematics:
- Smoothing Blades
- Nailspotters
- Corner Flushers
- Semi Automatic Taper
- Sanders
- Compound Tubes

These can be populated as new schematics are added to the Parts page.

## Implementation Notes

- Each schematic object in the `schematics` array now includes a `category` property
- The ToolSelector component can be updated to filter by category
- Categories are string values for easy filtering and future UI updates
- All Columbia schematics are filtered to the "Columbia Taping Tools" brand
