# Schematics Directory

This directory contains all tools and data files for processing interactive schematic diagrams with hotspot annotations.

## Files

### Data Files
- `15TT_SCH-1_hotspots.json` - Hotspot coordinate data for the 15" Corner Roller Assembly
- `15TT_SCH-1_hotspots.csv` - CSV version of hotspot data
- `15tt-sch-1-generated.json` - Generated schematic entry ready for Parts.jsx

### Processing Scripts
- `process-schematic.cjs` - Main tool for converting hotspot data to React component format
- `calculate-hotspots.js` - Simple coordinate calculator for verification
- `check-image-size.cjs` - Utility to read actual PNG image dimensions

## Quick Start

### 1. Check Image Dimensions
Before processing any schematic, determine the actual image dimensions:

```bash
node schematics/check-image-size.cjs
```

**Important:** The script reads from `public/15TT_SCH-1.png`. Update the file path in the script for different images.

### 2. Process Hotspot Data
Convert JSON hotspot data to React component format:

```bash
node schematics/process-schematic.cjs <hotspot-json> <image-width> <image-height>
```

**Example:**
```bash
node schematics/process-schematic.cjs schematics/15TT_SCH-1_hotspots.json 3400 2200
```

This will:
- Calculate correct percentage-based positions
- Suggest materials and prices based on part descriptions
- Generate formatted output for Parts.jsx
- Create a `*-generated.json` file with the complete schematic entry

### 3. Verify Coordinates
Use the simple calculator to verify specific coordinates:

```bash
node schematics/calculate-hotspots.js
```

## Workflow for Adding New Schematics

### Step 1: Prepare Files
1. Place schematic image in `public/` folder (e.g., `public/NEW_SCHEMATIC.png`)
2. Create or obtain hotspot data file (JSON format preferred)
3. Place hotspot data in `schematics/` directory

### Step 2: Get Image Dimensions
Update `check-image-size.cjs` to point to your image:
```javascript
const buffer = fs.readFileSync('public/YOUR_IMAGE.png');
```

Run:
```bash
node schematics/check-image-size.cjs
```

Note the dimensions (e.g., 3400 x 2200).

### Step 3: Process Hotspots
```bash
node schematics/process-schematic.cjs schematics/YOUR_hotspots.json WIDTH HEIGHT
```

### Step 4: Review Output
The script outputs:
1. Complete schematic entry (copy to Parts.jsx)
2. Parts table for review
3. Generated JSON file saved to schematics/

### Step 5: Manual Updates
Review and adjust:
- Title and description
- Material types (auto-suggested but may need correction)
- Prices (estimated based on part type)
- Part categories

### Step 6: Integrate
1. Copy the generated schematic object
2. Paste into `src/pages/Parts.jsx` in the `schematics` array
3. Test in browser at `http://localhost:5173/parts`

## Hotspot Data Format

### JSON Format (Preferred)
```json
{
  "image": {
    "width": 300,
    "height": 150,
    "source": "SCHEMATIC.png"
  },
  "hotspots": [
    {
      "id": "01",
      "pixel_coords": {
        "x": 1130,
        "y": 330
      },
      "part_info": {
        "part_number": "164348",
        "description": "Handle Assembly",
        "quantity": 1
      }
    }
  ]
}
```

### CSV Format
```csv
ID,X,Y,Part_Number,Description,Quantity
01,1130,330,164348,"Handle Assembly",1
```

## Coordinate Calculation

The scripts convert pixel coordinates to percentage-based positions:

```javascript
leftPercent = (pixelX / imageWidth) * 100
topPercent = (pixelY / imageHeight) * 100
```

**Critical:** Always use the **actual** image dimensions, not the reference dimensions from the JSON file.

## Material Type Suggestions

The processor auto-suggests materials based on keywords in descriptions:
- "brass" → `BRASS`
- "stainless steel" → `STAINLESS-STEEL`
- "chrome steel" → `CHROME-STEEL`
- "aluminum" → `ALUMINUM`
- "roller" → `POLYURETHANE`
- "bushing" → `BRONZE`
- "grip/handle" → `RUBBER`
- Default → `STEEL`

Always review and adjust as needed.

## Price Estimation

Prices are estimated based on part type:
- Small hardware (pins, screws, washers): $1.50 - $2.50
- Bushings and couplings: $6.00 - $8.00
- Rollers: $22.00
- Axles: $8.50 - $10.50
- Assemblies and heads: $45.00 - $65.00
- Handles and grips: $8.50

**Important:** These are estimates. Update with actual pricing before deployment.

## Troubleshooting

### Hotspots not aligned correctly
1. Verify image dimensions with `check-image-size.cjs`
2. Re-run `process-schematic.cjs` with correct dimensions
3. Check that CSS uses `display: inline-block` for `.schematic-container`

### Image appears distorted
- Ensure `imageWidth` and `imageHeight` in Parts.jsx match actual image dimensions

### Hotspots don't show up
- Check browser console for errors
- Verify image path starts with `/` and file exists in `public/`
- Confirm CSS is loaded (check `.hotspot` class)

### Modal cut off at edges
- CSS should have `overflow: visible` on `.schematic-container`
- Check parent containers don't have `overflow: hidden`

## File Naming Convention

- Hotspot data: `[SCHEMATIC-ID]_hotspots.json`
- Generated output: `[schematic-id]-generated.json`
- Images: `[SCHEMATIC-ID].png` (in `public/` folder)

Examples:
- `15TT_SCH-1_hotspots.json`
- `15tt-sch-1-generated.json`
- `15TT_SCH-1.png`

## Adding Files to This Directory

When you create new schematic data:

```bash
# Place hotspot data here
Move-Item -Path "NEW_hotspots.json" -Destination "schematics\"

# Keep images in public folder
Move-Item -Path "NEW_IMAGE.png" -Destination "public\"
```

## Version Control

All files in this directory should be committed:
```bash
git add schematics/
git commit -m "Add schematic processing tools and data"
```

## Documentation

For full implementation details, see:
- `docs/SCHEMATIC_IMPLEMENTATION.md` - Technical implementation details
- `docs/ADDING_SCHEMATICS_GUIDE.md` - Step-by-step guide for adding new schematics

## Support

If you encounter issues:
1. Check actual image dimensions match configured dimensions
2. Review coordinate calculations
3. Verify file paths and naming
4. Test with the working example (15TT_SCH-1)
