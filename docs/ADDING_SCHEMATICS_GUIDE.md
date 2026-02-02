# Adding New Schematic Diagrams - Complete Guide

This guide explains how to add new interactive schematic diagrams to the Drywall Toolbox application.

## Prerequisites

- Schematic diagram image (PNG format recommended)
- Hotspot coordinate data (can be in JSON or CSV format)
- Part information (part numbers, descriptions, materials, prices)

## Step 1: Prepare the Image

1. **Place the image in the public folder:**
   ```
   public/YOUR_SCHEMATIC_NAME.png
   ```

2. **Image requirements:**
   - High resolution (1200x1200 or larger recommended)
   - Clear part callouts with numbers
   - Good contrast for visibility
   - PNG or JPG format

## Step 2: Create or Convert Hotspot Data

### Option A: You have a JSON file with pixel coordinates

Example format (`YOUR_SCHEMATIC_hotspots.json`):
```json
{
  "image": {
    "width": 300,
    "height": 150,
    "source": "YOUR_SCHEMATIC.png"
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

### Option B: You have a CSV file

Example format (`YOUR_SCHEMATIC_hotspots.csv`):
```csv
ID,X,Y,Part_Number,Description,Quantity
01,1130,330,164348,"Handle Assembly",1
```

## Step 3: Calculate Correct Percentage Coordinates

Use the provided calculation script:

1. **Create a calculation script** (if not exists: `calculate-hotspots.js`)

2. **Update the script with your hotspot data**

3. **Run the script:**
   ```bash
   node calculate-hotspots.js
   ```

4. **Copy the output coordinates** - these will be in the format:
   ```javascript
   { top: '27.50%', left: '94.17%' }
   ```

### Formula for Manual Calculation

If you know your image dimensions:

```javascript
// For each hotspot:
const leftPercent = (pixelX / imageWidth) * 100;
const topPercent = (pixelY / imageHeight) * 100;

position: { 
  top: `${topPercent.toFixed(2)}%`, 
  left: `${leftPercent.toFixed(2)}%` 
}
```

## Step 4: Add Schematic to Parts.jsx

Open `src/pages/Parts.jsx` and add a new entry to the `schematics` array:

```javascript
{
  id: 'your-schematic-id',  // Unique ID (kebab-case)
  title: 'Your Tool Name',   // Display title
  description: 'Brief description of the tool',
  image: '/YOUR_SCHEMATIC.png',  // Path to image in public folder
  imageWidth: 1200,  // Actual image width
  imageHeight: 1200, // Actual image height
  parts: [
    {
      id: '01',  // Part ID (matches diagram callout)
      name: 'Part Name',
      sku: 'PART-NUMBER',
      material: 'MATERIAL-TYPE',  // e.g., 'STEEL', 'ALUMINUM', 'BRASS'
      price: 45.00,
      position: { top: '27.50%', left: '94.17%' },  // From Step 3
      quantity: 1  // Default 1, or higher if multiple units
    },
    // ... more parts
  ]
}
```

## Step 5: Material Types Reference

Common material types used in the system:
- `STEEL`
- `STAINLESS-STEEL`
- `CHROME-STEEL`
- `ALLOY-STEEL`
- `ALUMINUM`
- `BRASS`
- `BRONZE`
- `RUBBER`
- `POLYURETHANE`
- `POLYMER`
- `ZINC-ALLOY`
- `CARBON-STEEL`

## Step 6: Test the Implementation

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Parts page:**
   ```
   http://localhost:5173/parts
   ```

3. **Check for issues:**
   - [ ] All hotspots appear on the diagram
   - [ ] Hotspots are positioned correctly over their part callouts
   - [ ] Clicking hotspots shows the correct part information
   - [ ] Parts can be added to cart successfully
   - [ ] Schematic selector shows your new tool

## Step 7: Adjust Hotspot Positions (If Needed)

If hotspots are not perfectly aligned:

1. **Identify the image dimensions:**
   - Use an image viewer or browser dev tools
   - Right-click image → Properties → Details

2. **Update imageWidth and imageHeight** in your schematic entry

3. **Recalculate percentages** using the correct dimensions

4. **Fine-tune positions** by adjusting the percentage values:
   - Increase `left` → moves right
   - Decrease `left` → moves left
   - Increase `top` → moves down
   - Decrease `top` → moves up

## Common Issues and Solutions

### Issue: Hotspots appear clustered or in wrong positions
**Solution:** Verify image dimensions and recalculate percentages

### Issue: Image appears distorted
**Solution:** Check that imageWidth and imageHeight match actual image dimensions

### Issue: Hotspots don't show up
**Solution:** 
- Check browser console for errors
- Verify image path is correct (starts with `/`)
- Ensure image is in the `public` folder

### Issue: Modal appears cut off at edges
**Solution:** The CSS has `overflow: visible` on `.schematic-container` - check that parent containers also allow overflow

## Best Practices

1. **Naming Convention:**
   - Use kebab-case for IDs: `corner-roller-assy`
   - Use descriptive titles: "15″ Corner Roller Assembly"

2. **Image Quality:**
   - Minimum 1000px width recommended
   - Clear, high-contrast images work best
   - Avoid compressed/low-quality images

3. **Part Pricing:**
   - Use realistic prices based on your product catalog
   - Keep 2 decimal places: `45.00` not `45`

4. **Testing:**
   - Test on different screen sizes
   - Verify all hotspots are clickable
   - Check cart integration works

5. **Documentation:**
   - Keep a reference of your image dimensions
   - Document any special positioning notes
   - Save your hotspot calculation scripts

## Example: Complete Schematic Entry

```javascript
{
  id: 'corner-roller-assy',
  title: '15" Corner Roller Assembly',
  description: 'Complete corner roller assembly with swivel coupling and precision rollers',
  image: '/15TT_SCH-1.png',
  imageWidth: 1200,
  imageHeight: 1200,
  parts: [
    {
      id: '01',
      name: 'Handle Assembly',
      sku: '164348',
      material: 'ALUMINUM',
      price: 45.00,
      position: { top: '27.50%', left: '94.17%' },
      quantity: 1
    },
    {
      id: '06',
      name: 'Thrust Washer',
      sku: '150008',
      material: 'BRASS',
      price: 5.50,
      position: { top: '89.17%', left: '35.83%' },
      quantity: 4  // Note: quantity > 1 for multiple units
    }
  ]
}
```

## Automation Script Template

Save this as `add-schematic-helper.js`:

```javascript
const fs = require('fs');

// Configuration
const config = {
  imagePath: '/YOUR_IMAGE.png',
  imageWidth: 1200,
  imageHeight: 1200,
  jsonFile: './YOUR_SCHEMATIC_hotspots.json'
};

// Read JSON data
const data = JSON.parse(fs.readFileSync(config.jsonFile, 'utf8'));

// Generate schematic entry
const schematicEntry = {
  id: 'your-schematic-id',
  title: 'Your Tool Name',
  description: 'Tool description',
  image: config.imagePath,
  imageWidth: config.imageWidth,
  imageHeight: config.imageHeight,
  parts: data.hotspots.map(h => ({
    id: h.id,
    name: h.part_info.description,
    sku: h.part_info.part_number,
    material: 'STEEL', // Update manually
    price: 0.00, // Update manually
    position: {
      top: `${(h.pixel_coords.y / config.imageHeight * 100).toFixed(2)}%`,
      left: `${(h.pixel_coords.x / config.imageWidth * 100).toFixed(2)}%`
    },
    quantity: h.part_info.quantity || 1
  }))
};

console.log(JSON.stringify(schematicEntry, null, 2));
```

Run with:
```bash
node schematics/add-schematic-helper.js > schematic-output.json
```

## Support Files

Keep these files in the `schematics/` directory for reference:
- Original hotspot JSON/CSV data
- Calculation scripts
- Image source files
- Any special notes about positioning

## Version Control

When committing new schematics:
```bash
git add public/YOUR_SCHEMATIC.png
git add src/pages/Parts.jsx
git commit -m "Add YOUR_TOOL schematic with interactive hotspots"
```

---

**Need Help?** 
- Check the existing Corner Roller Assembly implementation as a reference
- Review `docs/SCHEMATIC_IMPLEMENTATION.md` for the technical details
- Test thoroughly before deploying
