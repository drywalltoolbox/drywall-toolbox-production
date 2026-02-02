# Interactive Schematic Viewer - Implementation Guide

## Overview
This document describes the implementation of the interactive schematic viewer for the 15" Corner Roller Assembly (15TT_SCH-1) in the Drywall Toolbox application.

## Files Modified
- `src/pages/Parts.jsx` - Added new schematic entry with exact hotspot coordinates

## Implementation Details

### 1. Schematic Data Structure
The Corner Roller Assembly schematic has been added with the following properties:

```javascript
{
  id: 'corner-roller-assy',
  title: '15" Corner Roller Assembly',
  description: 'Complete corner roller assembly with swivel coupling and precision rollers',
  image: '/15TT_SCH-1.png',
  imageWidth: 3400,
  imageHeight: 2200,
  parts: [...]
}
```

### 2. Hotspot Coordinates
All 14 hotspots have been precisely mapped from the provided JSON data:

| ID | Part Number | Description | Position (Top, Left) |
|----|-------------|-------------|---------------------|
| 01 | 164348 | Handle Assembly | 15.00%, 33.24% |
| 02 | 150003F | Coupling | 22.95%, 20.59% |
| 03 | 059143 | Cotter Pin, 1/16 x 1/2 | 25.23%, 16.18% |
| 04 | 156001F | Corner Roller Head | 48.86%, 23.82% |
| 05 | 150004F | Swivel Coupling Pin | 51.59%, 20.88% |
| 06 | 150008 | Thrust Washer (Qty: 4) | 48.64%, 12.65% |
| 07 | 809006 | Brass Washer (Qty: 4) | 50.00%, 4.41% |
| 08 | 159006 | Roller Axle, 1/4-20 x 1 1/4 Hex. (Qty: 4) | 45.23%, 3.53% |
| 09 | 150011F | Roller Bushing (Qty: 4) | 43.18%, 5.74% |
| 10 | 150005 | Roller (Qty: 4) | 41.82%, 7.35% |
| 11 | 159010 | Screw, 8-32 x 3/8 Fil. Hd. Nylock | 34.32%, 11.18% |
| 12 | 154007 | Swivel Assy. | 37.27%, 12.79% |
| 13 | 150009 | Swivel Axle | 19.09%, 15.29% |
| 14 | 151042 | Handle Grip, Black | 8.86%, 33.24% |

### 3. Coordinate Conversion
The coordinates were converted from the normalized values in the JSON file:
- Original pixel coordinates from `15TT_SCH-1_hotspots.json`
- Normalized coordinates (x/300, y/150) converted to percentages
- Top = (y / imageHeight) × 100%
- Left = (x / imageWidth) × 100%

### 4. Features Implemented

#### Interactive Hotspots
- Clickable circular hotspots with pulsing animation
- Hover effects for better UX
- Active state highlighting

#### Part Information Modals
- Part name and SKU
- Material specification
- Quantity indicator (for parts with qty > 1)
- Price display
- "Add to Cart" functionality

#### Image Rendering
- Supports both SVG diagrams (for legacy schematics) and actual images
- Responsive image sizing
- Maintains aspect ratio

#### Shopping Cart Integration
- Each part can be added directly to the cart from the modal
- Toast notification on successful add
- Cart context integration

### 5. Styling
The implementation uses existing CSS classes from `machined-design.css`:
- `.schematic-container` - Main container with aspect ratio
- `.hotspot` - Circular clickable indicators with pulse animation
- `.part-modal` - Information popup with smooth transitions
- `.part-meta` - Monospace font for technical specifications

### 6. User Experience
1. User selects "15" Corner Roller Assembly" from the schematic selector
2. The actual schematic image appears with 14 interactive hotspots
3. Clicking a hotspot reveals detailed part information
4. User can add parts directly to cart from the modal
5. Toast notification confirms the addition

## Testing
- Development server running at `http://localhost:5173/`
- Navigate to `/parts` to access the interactive viewer
- The Corner Roller Assembly is now the default selection

## Future Enhancements
1. Add zoom and pan functionality for detailed inspection
2. Implement part highlighting on hover
3. Add related parts suggestions
4. Include assembly instructions or videos
5. Add PDF export of parts list

## Files Reference
- Image: `public/15TT_SCH-1.png`
- Data: `schematics/15TT_SCH-1_hotspots.json`
- CSV: `schematics/15TT_SCH-1_hotspots.csv`
- Component: `src/pages/Parts.jsx`
- Styles: `src/styles/machined-design.css`
- Processing Tools: `schematics/` directory

## Maintenance Notes
To add new schematics:
1. Place image in `/public` folder
2. Create hotspot data (JSON format with normalized coordinates)
3. Add new entry to `schematics` array in `Parts.jsx`
4. Convert coordinates to percentage-based positioning
5. Test hotspot accuracy and adjust as needed
