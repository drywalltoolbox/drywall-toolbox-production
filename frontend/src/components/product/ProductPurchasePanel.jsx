import { LockKeyhole, Minus, Plus, ShoppingCart } from 'lucide-react';

export default function ProductPurchasePanel({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onAddToCart,
  onExpressCheckout,
  isExpressCheckoutPending,
  canExpressCheckout,
  canAddToCart,
  isOutOfStock,
  needsVariation,
  hasCompleteSelection,
  addToCartState = 'idle',
}) {
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (Number.isFinite(val) && val >= 1 && val <= 99) {
      onQuantityChange?.(val);
    }
  };

  const addToCartPending = addToCartState === 'adding' || addToCartState === 'added';
  const addToCartLabel = isOutOfStock
        ? 'Out of Stock'
        : needsVariation && !hasCompleteSelection
          ? 'Select Options'
          : 'Add to Cart';

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
          disabled={!canAddToCart || addToCartPending}
          className={`dtb-pdp-add-to-cart is-${addToCartState}`}
          data-dtb-cart-action="add"
          data-dtb-cart-feedback-mode="controlled"
          data-state={addToCartState}
          aria-busy={addToCartState === 'adding'}
        >
          {addToCartState === 'added' ? (
            <>
              <svg className="dtb-pdp-add-to-cart__success-mark" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="dtb-pdp-add-to-cart__success-circle" cx="12" cy="12" r="9" fill="none" />
                <path className="dtb-pdp-add-to-cart__success-check" fill="none" d="m7.5 12.2 3 3 6-6" />
              </svg>
              <span className="sr-only" aria-live="polite">Added to cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="dtb-pdp-add-to-cart__cart" size={16} aria-hidden="true" />
              <span>{addToCartLabel}</span>
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onExpressCheckout}
        disabled={!canExpressCheckout || isExpressCheckoutPending}
        className="dtb-pdp-express-checkout"
      >
        <LockKeyhole size={15} aria-hidden="true" />
        <span aria-live="polite">
          {isExpressCheckoutPending ? 'Preparing secure checkout…' : 'Buy now'}
        </span>
      </button>
      <p className="dtb-pdp-express-checkout__note">
        Eligible express payment methods are shown securely at checkout.
      </p>
    </div>
  );
}
