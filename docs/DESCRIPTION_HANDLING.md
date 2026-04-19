# Variable Product Description Handling

## Current Structure

### Parent Product (EZFB-TT - EasyClean® Finishing Box)
```
Type: variable
Name: EasyClean® Finishing Box
Short description: "The TapeTech EasyClean® Finishing Box automatically..."
Description: [627 character detailed product description]
Images: (EMPTY - inherits from variations)
Attributes: Size: 7"|10"|12"
```

### Variations (EZ07TT, EZ10TT, EZ12TT)
```
Type: variation
Name: (EMPTY - WooCommerce auto-generates from parent + attribute)
Short description: (EMPTY)
Description: [Same 627 character description as parent]
Images: [Product-specific images for this size]
Parent: EZFB-TT
Attribute: Size: 7" | Size: 10" | Size: 12"
Weight/Dimensions: [Size-specific values]
```

## Frontend Behavior

### How WooCommerce Displays This:

**Single Product Page for "EasyClean® Finishing Box"**
- **Title**: EasyClean® Finishing Box
- **Description**: Shows parent's description (627 chars) - ONE unified description
- **Images**: Display from selected variation
- **Size Dropdown**: 7" | 10" | 12"
- **When customer selects size**:
  - Product variant changes
  - Images update to that size's images
  - Weight/dimensions update
  - Price updates (if different per variation)
  - Product name shows: "EasyClean® Finishing Box - 7"" (auto-generated)

### Key Design Decisions:

✅ **One Description for All Sizes**
- Parent description applies to entire product
- Variations inherit parent description
- No separate descriptions per size (unless specifically set)
- Cleaner UX: customer reads once, applies to all sizes

✅ **Images Per Variation**
- Each size has its own product images
- When size changes, images change
- Shows actual product photo for that specific size

✅ **Unified Product Experience**
- All sizes on one page
- One set of reviews/ratings
- Simplified inventory (track by variation)
- Professional, non-redundant approach

## If You Need Different Descriptions Per Size

You could add **Attribute 2 name** and **Attribute 2 value(s)** to variations, but typically:

### Option A: Shared Description (Current ✅)
- One description covers all sizes
- Professional, standard e-commerce practice
- Works for tools (descriptions don't change by size)

### Option B: Variation-Specific Meta (If Needed)
- Add hidden meta fields per variation
- Use WooCommerce template to display variation-specific text
- More complex setup
- Not typically needed for drywall tools

## Your Frontend Implementation

When you fetch product data:

```javascript
// Parent Product
GET /products/EZFB-TT
→ Returns: Name, Description, Categories, Sizes available

// Product with Selected Size
GET /products/EZFB-TT?variation=EZ07TT
→ Returns: Parent info + Images for 7", Weight 2.2 lbs, Dimensions, etc.
```

## Summary

**Your description strategy is optimal:**
- ✅ One "master" description per product family
- ✅ Size-specific images and dimensions
- ✅ Professional WooCommerce standard
- ✅ Cleaner customer experience
- ✅ Easier inventory management

The unified description works perfectly because TapeTech tools (finishing boxes, knives, handles) function the same regardless of size—only the specs change, not the functionality or use case.
