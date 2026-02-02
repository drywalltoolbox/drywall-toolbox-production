# Schematic Processing Quick Reference

## One-Command Processing

```bash
# 1. Check image size
node schematics/check-image-size.cjs

# 2. Process hotspots (update dimensions from step 1)
node schematics/process-schematic.cjs schematics/YOUR_hotspots.json WIDTH HEIGHT

# 3. Copy output to src/pages/Parts.jsx
```

## File Locations

```
project-root/
├── schematics/          # All hotspot data & processing scripts
│   ├── *_hotspots.json  # Input: Hotspot coordinate data
│   ├── *.cjs            # Scripts: Processing tools
│   └── README.md        # Full documentation
│
├── public/              # Static assets
│   └── *.png            # Schematic images
│
├── src/
│   ├── pages/
│   │   └── Parts.jsx    # Output: Add generated schematics here
│   └── styles/
│       └── machined-design.css  # Hotspot styling
│
└── docs/
    ├── SCHEMATIC_IMPLEMENTATION.md
    └── ADDING_SCHEMATICS_GUIDE.md
```

## Common Tasks

### Add New Schematic
```bash
# 1. Add files
Move-Item "NEW.png" -Destination "public\"
Move-Item "NEW_hotspots.json" -Destination "schematics\"

# 2. Get dimensions
# Edit check-image-size.cjs: change filename to 'public/NEW.png'
node schematics/check-image-size.cjs

# 3. Process
node schematics/process-schematic.cjs schematics/NEW_hotspots.json 3400 2200

# 4. Copy output to Parts.jsx
```

### Verify Existing Coordinates
```bash
node schematics/calculate-hotspots.js
```

### Update Hotspot Positions
```bash
# After editing JSON file
node schematics/process-schematic.cjs schematics/YOUR_hotspots.json WIDTH HEIGHT
```

## Critical Settings

**Image Dimensions:** Must be actual PNG dimensions (check with `check-image-size.cjs`)

**CSS:** `.schematic-container` must have:
- `display: inline-block`
- `position: relative`
- `overflow: visible`

**Coordinates:** Always percentage-based:
- `left: (pixelX / imageWidth) * 100%`
- `top: (pixelY / imageHeight) * 100%`

## Hotspot Data Format

```json
{
  "id": "01",
  "pixel_coords": { "x": 1130, "y": 330 },
  "part_info": {
    "part_number": "164348",
    "description": "Handle Assembly",
    "quantity": 1
  }
}
```

## Output Format

```javascript
{
  id: '01',
  name: 'Handle Assembly',
  sku: '164348',
  material: 'ALUMINUM',
  price: 45.00,
  position: { top: '15.00%', left: '33.24%' },
  quantity: 1
}
```

## Testing
```bash
npm run dev
# Visit: http://localhost:5173/parts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hotspots misaligned | Verify image dimensions, recalculate |
| Hotspots missing | Check console, verify image path |
| Modal cut off | Check CSS overflow settings |

## Material Types

Common values:
- `STEEL`, `STAINLESS-STEEL`, `CHROME-STEEL`, `ALLOY-STEEL`, `CARBON-STEEL`
- `ALUMINUM`, `BRASS`, `BRONZE`, `ZINC-ALLOY`
- `RUBBER`, `POLYURETHANE`, `POLYMER`

## Example: 15" Corner Roller

```bash
node schematics/check-image-size.cjs
# Output: 3400 x 2200

node schematics/process-schematic.cjs schematics/15TT_SCH-1_hotspots.json 3400 2200
# Output: Generated entry saved to 15tt-sch-1-generated.json
```

Result: 14 hotspots perfectly positioned on schematic diagram
