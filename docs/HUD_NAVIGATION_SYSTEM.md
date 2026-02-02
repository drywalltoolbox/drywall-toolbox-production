# HUD Navigation System for Interactive Schematic Viewer

## Overview
The Parts page now features a sleek, HUD-style (Heads-Up Display) navigation system that properly implements a **Brand → Product → Schematic** workflow, connecting directly to the existing product catalog.

## Navigation Flow

### 1. Brand Selection (Level 1)
- **Purpose**: Select manufacturer/brand
- **Data Source**: Dynamically loaded from `public/tswfast_all_products.csv`
- **UI Style**: Dark gradient card with blue accent border
- **Features**:
  - Shows top 8 brands initially
  - Active selection highlighted with blue glow
  - Resets product and schematic selection when changed

### 2. Product Selection (Level 2)
- **Purpose**: Select specific tool/product within brand
- **Data Source**: Filtered products from catalog matching selected brand
- **UI Style**: Dark gradient card with light blue accent
- **Features**:
  - Grid layout with 220px min column width
  - Shows up to 30 products with scrollable overflow
  - Displays product name + part number
  - Product count badge showing available items
  - Only visible when brand is selected and has products

### 3. Schematic Selection (Level 3)
- **Purpose**: Select available technical diagram
- **Data Source**: Hardcoded schematic definitions in Parts.jsx
- **UI Style**: Dark gradient card with bright blue accent
- **Features**:
  - Currently shows: "15" Corner Roller Assembly" and "Automatic Taper G2"
  - Active schematic highlighted with bright blue background
  - Always visible (available schematics)

## Technical Details

### State Management
```javascript
const [selectedBrand, setSelectedBrand] = useState('Columbia Tools');
const [selectedProduct, setSelectedProduct] = useState(null);
const [selectedSchematic, setSelectedSchematic] = useState('corner-roller-assy');
const [products, setProducts] = useState([]);
const [brands, setBrands] = useState([]);
```

### Data Flow
1. **On Mount**: Load all products from CSV → Extract unique brands
2. **On Brand Select**: Filter products by brand → Reset product selection
3. **On Product Select**: Store selected product → Can auto-match schematic if naming convention matches
4. **On Schematic Select**: Display interactive diagram with hotspots

### Product Catalog Integration
- **CSV Location**: `public/tswfast_all_products.csv`
- **Loader Function**: `loadProducts()` from `src/data/products.js`
- **CSV Columns**:
  - `brand` - Manufacturer name
  - `product_name` - Full product name
  - `part_number` - SKU/Part number
  - `url` - Product page URL
  - `image_url` - Product image
  - `short_description` - Brief description
  - `category` - Product category
  - `specifications` - JSON specifications

### Available Brands (Sample)
- Columbia Tools (24 products)
- TapeTech
- Delko
- Wal-Board
- TrimTex
- and 190+ more brands

## Visual Design

### Color Scheme
- **Level 1 (Brand)**: Dark slate with primary blue (#2563eb)
- **Level 2 (Product)**: Dark slate with highlight blue (#60a5fa)
- **Level 3 (Schematic)**: Dark slate with bright blue (#93c5fd)

### Hierarchy Indicators
Each level has a colored vertical accent bar:
- Level 1: `--tension-accent` (blue)
- Level 2: `--tension-highlight` (light blue)
- Level 3: `rgb(147, 197, 253)` (bright blue)

### Interactive States
- **Default**: Semi-transparent white background
- **Hover**: Brighter background + colored border hint
- **Active**: Colored background + glow effect

## Future Enhancements

### Planned Features
1. **Search/Filter**: Add search box for products within brand
2. **Category Grouping**: Group products by category in Level 2
3. **Product Images**: Show thumbnails in product selection
4. **Schematic Auto-Match**: Automatically select schematic based on product name matching
5. **Brand Logos**: Add brand logos next to names
6. **Favorites**: Save frequently accessed brand/product combinations
7. **Recent History**: Show recently viewed schematics

### Schematic Expansion
To add more schematics:
1. Add schematic data to `schematics` array in Parts.jsx
2. Include image path, dimensions, and hotspot coordinates
3. Map to relevant products using naming convention
4. Document in this file

### Product Catalog Sync
The catalog is automatically loaded from CSV on page mount. To update products:
1. Update `public/tswfast_all_products.csv`
2. Refresh page - brands and products will update automatically
3. No code changes needed

## Responsive Design
- **Desktop**: Full 3-level HUD with grid layouts
- **Tablet**: Stacked levels with wrapped buttons
- **Mobile**: Vertical stack with scrollable product list

## Performance Considerations
- **Product Loading**: Async load on mount (non-blocking)
- **Product Display**: Limits to 30 products with scroll
- **Brand Display**: Limits to 8 brands initially
- **Filtering**: Client-side filtering (fast)

## Accessibility
- Semantic button elements for selections
- `title` attributes with descriptions
- Keyboard navigation support
- High contrast active states
- Clear visual hierarchy

## Files Modified
- `src/pages/Parts.jsx` - Added HUD navigation system
- `src/data/products.js` - Product loading utilities (existing)
- `public/tswfast_all_products.csv` - Product catalog data (existing)

## Related Documentation
- `docs/SCHEMATIC_IMPLEMENTATION.md` - Technical diagram implementation
- `docs/ADDING_SCHEMATICS_GUIDE.md` - How to add new schematics
- `docs/ECOMMERCE_INTEGRATION.md` - Cart and checkout integration
