/**
 * frontend/src/components/product/ProductSkuBlock.jsx
 *
 * Displays SKU (and optionally MPN) for the selected variation or parent.
 *
 * Props:
 *   product           — parent product
 *   selectedVariation — selected variation or null
 */

export default function ProductSkuBlock({ product, selectedVariation }) {
  const sku = selectedVariation?.sku || product?.sku;
  const mpn = selectedVariation?.mpn || product?.mpn;

  if (!sku && !mpn) return null;

  return (
    <div className="dtb-pdp-header__meta" style={{ marginTop: 0 }}>
      {sku && (
        <span className="dtb-pdp-header__meta-item">
          <span className="dtb-pdp-header__meta-label">SKU</span>
          <span className="dtb-pdp-header__meta-value">{sku}</span>
        </span>
      )}
      {mpn && (
        <span className="dtb-pdp-header__meta-item">
          <span className="dtb-pdp-header__meta-label">MPN</span>
          <span className="dtb-pdp-header__meta-value">{mpn}</span>
        </span>
      )}
    </div>
  );
}
