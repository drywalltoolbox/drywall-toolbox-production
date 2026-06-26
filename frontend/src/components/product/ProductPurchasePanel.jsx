import { Minus, Plus, ShoppingCart } from 'lucide-react';

export default function ProductPurchasePanel({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onAddToCart,
  canAddToCart,
  isOutOfStock,
  needsVariation,
  hasCompleteSelection,
}) {
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (Number.isFinite(val) && val >= 1 && val <= 99) {
      onQuantityChange?.(val);
    }
  };

  return (
    <div className="product-detail-purchase-panel dtb-pdp-purchase-panel">
      <div className="dtb-pdp-purchase-row">
        <div className="dtb-pdp-qty-root" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={onDecrease}
            disabled={quantity <= 1}
            className="dtb-pdp-qty-btn"
            aria-label="Decrease quantity"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <input
            type="number"
            className="dtb-pdp-qty-input"
            value={quantity}
            min={1}
            max={99}
            onChange={handleInputChange}
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={onIncrease}
            disabled={quantity >= 99}
            className="dtb-pdp-qty-btn"
            aria-label="Increase quantity"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAddToCart}
          className="dtb-pdp-add-to-cart"
        >
          <ShoppingCart size={16} />
          <span aria-live="polite">
            {isOutOfStock ? 'Out of Stock' : (needsVariation && !hasCompleteSelection ? 'Select Options' : 'Add to Cart')}
          </span>
        </button>
      </div>
    </div>
  );
}
