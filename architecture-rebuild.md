Yes. The correct direction is **not** to add more systems. It is to make the existing catalog platform stricter, simpler, and more deterministic.

Your target should be:

```text
One SKU policy.
One parent/variation contract.
One schematic/parts contract.
One backend read model.
One frontend detail/cart path.
One CSV validator.
```

No MPN layer. No legacy SKU aliases. No parallel relationship systems. No frontend keyword matching as the source of truth.

---

# Final Simplified Architecture

## 1. SKU identity

Use only:

```text
SKU
Parent SKU
Meta: _dtb_parent_product_sku
```

Policy:

```text
SKU = canonical product identity
SKU format = uppercase, no hyphens, no spaces, no smart dashes
```

Examples:

```text
FA-347   -> FA347
AT01-AD  -> AT01AD
AH25-AD  -> AH25AD
4-734    -> 4734
```

Do **not** add:

```text
_dtb_mpn
_dtb_manufacturer_sku
_dtb_legacy_sku
_dtb_sku_aliases
```

Those are unnecessary for this phase and increase mapping risk.

---

# 2. Variable / variation contract

Your existing `ProductMeta.php` already has the right minimal variation keys:

```text
_dtb_parent_product_sku
_dtb_variation_axis
_dtb_variation_value
_dtb_variation_label
_dtb_default_variation_id
_dtb_inherit_parent_image
_dtb_variation_sort
```



Only one addition is worth making:

```text
_dtb_default_variation_sku
```

Reason: the CSV cannot reliably know WooCommerce variation IDs before import. SKU is stable; ID is not.

## Parent variable row

Required:

```text
Type = variable
SKU = normalized parent SKU
Attribute 1 name
Attribute 1 value(s)
Attribute 1 used for variations = 1
Meta: _dtb_variation_axis
Meta: _dtb_default_variation_sku
```

## Child variation row

Required:

```text
Type = variation
SKU = normalized child SKU
Parent SKU = normalized parent SKU
Attribute 1 name
Attribute 1 value(s)
Regular price if purchasable
Meta: _dtb_parent_product_sku
Meta: _dtb_variation_axis
Meta: _dtb_variation_value
Meta: _dtb_variation_label
Meta: _dtb_variation_sort
Meta: _dtb_inherit_parent_image
```

That is enough. Do not create a separate variation registry.

---

# 3. Schematic / parts contract

Keep schematic/parts linking metadata minimal:

```text
Meta: _dtb_product_kind
Meta: _dtb_is_parts
Meta: _dtb_schematic_brand
Meta: _dtb_schematic_group
Meta: _dtb_schematic_position
Meta: _dtb_replacement_part_for
Meta: _dtb_compatible_tool_skus
```

All SKU references must use normalized SKUs only.

Example part:

```text
SKU = FA347
Meta: _dtb_product_kind = part
Meta: _dtb_is_parts = 1
Meta: _dtb_schematic_brand = columbia
Meta: _dtb_schematic_group = compound_tube
Meta: _dtb_schematic_position = 14
Meta: _dtb_replacement_part_for = COLCOMPOUNDTUBE
Meta: _dtb_compatible_tool_skus = COLCOMPOUNDTUBE,COLCAMLOCKTUBE
```

No frontend keyword matching should be authoritative. Frontend can fallback to static mappings, but backend metadata should own the relationship.

---

# 4. CSV validator scope

Do not build a massive validation framework yet. Extend the existing `scripts/validate_catalog.py`.

Add only these blocker rules:

```text
sku_not_normalized
parent_sku_not_normalized
normalized_sku_collision
variation_dtb_parent_product_sku_mismatch
variation_missing_dtb_variation_axis
variation_axis_mismatch_parent
variation_missing_dtb_variation_value
variation_missing_dtb_variation_label
variation_missing_dtb_variation_sort
default_variation_sku_not_child
part_missing_schematic_group_when_schematic_position_present
part_references_unknown_compatible_tool_sku
```

That is robust without being excessive.

---

# 5. Backend updates

Implement only what directly prevents data/runtime drift.

## Required

```text
Add _dtb_default_variation_sku to ProductMeta.
Update DefaultVariationResolver to resolve by SKU before fallback.
Update VariationReadModelService to paginate variations beyond 100.
Add backend compatible-parts lookup endpoint.
```

Minimal endpoints:

```text
GET /wp-json/dtb/v1/products/:sku/compatible-parts
GET /wp-json/dtb/v1/parts/:sku/compatible-tools
```

You do not need a complex graph database or relationship engine. Use product meta queries against normalized SKUs.

---

# 6. Frontend updates

Keep frontend simple.

## Required

```text
Product detail/modal must use /wp-json/dtb/v1/catalog/products/:slug/detail.
Variation selector must use _dtb_variation_value and _dtb_variation_label.
Cart must add selected variation ID, not parent ID.
Schematics/parts UI should query backend compatible-parts endpoints.
```

Do not duplicate variation matching logic in React.

Frontend role:

```text
render backend DTO
select variation option
submit selected child variation ID
```

Backend role:

```text
own parent/child relationships
own default variation
own compatibility mappings
```

---

# 7. What to avoid

Avoid these for now:

```text
SKU alias resolver
legacy SKU layer
MPN layer
separate relationship database
full validation service framework
toolset-specific expansion
complex import orchestration UI
multi-version catalog registry
```

Those may be useful later, but right now they would slow down the core catalog correction.

---

# Production-grade but not over-engineered target

Your hardened path is:

```text
CSV
  -> normalized SKU + variation + schematic metadata
  -> validate_catalog.py blocks structural defects
  -> WooCommerce import
  -> dtb-catalog-platform normalizes DTOs
  -> frontend consumes DTOs
  -> cart uses real purchasable variation IDs
  -> schematics use normalized SKU relationships
```

That is robust because every layer agrees on the same identifiers.

It is not over-engineered because:

```text
No alias system.
No MPN mapping system.
No duplicate relationship layer.
No frontend inference.
No unnecessary database tables.
```

Bottom line:

```text
Normalize SKUs directly.
Make Parent SKU exact.
Add only the variation metadata needed for deterministic selection.
Use normalized SKUs for schematic/parts relationships.
Let the backend read model own relationships.
Let the frontend render and submit selections.
```

That gives you a production-grade catalog platform without building a second catalog-management system inside WordPress.
