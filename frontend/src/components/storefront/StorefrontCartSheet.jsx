import { Link } from 'react-router-dom';
import { ShoppingCart, X, Package, Minus, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import ProductModal from '../product/ProductModal.jsx';
import ProductDetail from '../product/ProductDetail.jsx';
import { getProduct, getProductVariations } from '../../services/api.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

const CART_QTY_SYNC_DELAY_MS = 260;
const MAX_CART_QUANTITY = 99;

function getCartItemKey(item) {
  return String(item?.cartKey || item?.key || item?.id || '');
}

function getDisplayQuantity(item, localQuantities) {
  const key = getCartItemKey(item);
  const localQty = Number(localQuantities[key]);
  const itemQty = Number(item?.quantity);
  if (Number.isFinite(localQty) && localQty >= 1) return localQty;
  if (Number.isFinite(itemQty) && itemQty >= 1) return itemQty;
  return 1;
}

function toNumericId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCartItemSku(item) {
  return String(item?.sku || item?.part_number || item?.raw?.sku || '').trim();
}

function buildFallbackProductFromCartItem(item) {
  const image = item?.image || '';
  const sku = getCartItemSku(item);
  const id = toNumericId(item?.parent_id) || toNumericId(item?.id) || sku || getCartItemKey(item);

  return {
    id,
    name: item?.name || sku || 'Product',
    brand: item?.brand || '',
    sku,
    part_number: sku,
    price: Number(item?.price) || 0,
    regular_price: item?.price != null ? String(item.price) : '',
    sale_price: '',
    image,
    images: image ? [image] : [],
    stock_status: 'instock',
    type: 'simple',
    is_variable: false,
    variation_attributes: [],
    variation_attribute_values: null,
    attributes: [],
    meta_data: [],
    short_description: '',
    description_full: '',
    _source: 'cart-fallback',
  };
}

function buildFallbackVariationFromCartItem(item) {
  const fallback = buildFallbackProductFromCartItem(item);
  return {
    ...fallback,
    id: toNumericId(item?.variation_id) || toNumericId(item?.id) || fallback.id,
    parent_id: toNumericId(item?.parent_id) || null,
    type: 'variation',
    is_variable: false,
    variation_attribute_values: Array.isArray(item?.variation_attribute_values)
      ? item.variation_attribute_values
      : [],
    variation_attribute: item?.variation_name || '',
  };
}

function findCartItemVariation(variations, item) {
  if (!Array.isArray(variations) || variations.length === 0) return null;

  const variationId = toNumericId(item?.variation_id) || toNumericId(item?.id);
  const sku = getCartItemSku(item).toLowerCase();

  return variations.find((variation) => (
    (variationId && String(variation?.id) === String(variationId))
    || (sku && String(variation?.sku || variation?.part_number || '').trim().toLowerCase() === sku)
  )) || null;
}

export default function StorefrontCartSheet({
  isOpen,
  onClose,
  cartItems = [],
  removeFromCart,
  updateQuantity,
}) {
  const { addToCart } = useCart();
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const syncTimersRef = useRef(new Map());
  const syncingKeysRef = useRef(new Set());
  const localQuantitiesRef = useRef({});

  const [removingKey, setRemovingKey] = useState(null);
  const [syncingKeys, setSyncingKeys] = useState(() => new Set());
  const [localQuantities, setLocalQuantities] = useState({});
  const [productModalState, setProductModalState] = useState(null);
  const [productModalLoadingKey, setProductModalLoadingKey] = useState('');

  const setItemSyncing = useCallback((key, isSyncing) => {
    if (!key) return;
    const next = new Set(syncingKeysRef.current);
    if (isSyncing) next.add(key);
    else next.delete(key);
    syncingKeysRef.current = next;
    setSyncingKeys(next);
  }, []);

  const clearQuantityTimer = useCallback((key) => {
    const timer = syncTimersRef.current.get(key);
    if (timer) {
      window.clearTimeout(timer);
      syncTimersRef.current.delete(key);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (overlayRef.current?.contains(document.activeElement)) {
      document.activeElement?.blur?.();
    }
    setProductModalState(null);
    onClose?.();
  }, [onClose]);

  const handleNavAndClose = useCallback((event) => {
    event.currentTarget?.blur?.();
    handleClose();
  }, [handleClose]);

  const closeProductModal = useCallback(() => {
    setProductModalState(null);
    setProductModalLoadingKey('');
  }, []);

  const handleProductModalAddToCart = useCallback(async (product, quantity = 1) => {
    await addToCart(product, quantity);
  }, [addToCart]);

  const handleOpenProduct = useCallback(async (item) => {
    const key = getCartItemKey(item);
    if (!item || !key || productModalLoadingKey === key) return;

    const fallbackProduct = buildFallbackProductFromCartItem(item);
    const fallbackVariation = buildFallbackVariationFromCartItem(item);
    const parentId = toNumericId(item?.parent_id);
    const variationId = toNumericId(item?.variation_id);

    setProductModalLoadingKey(key);

    try {
      let parentProduct = null;
      let selectedVariation = null;
      let initialVariations = [];

      if (parentId) {
        parentProduct = await getProduct(parentId);
        initialVariations = await getProductVariations(parentId);
        selectedVariation = findCartItemVariation(initialVariations, item) || fallbackVariation;
      } else {
        const fetchedProduct = await getProduct(item.id);
        if (fetchedProduct?.parent_id) {
          parentProduct = await getProduct(fetchedProduct.parent_id);
          initialVariations = await getProductVariations(fetchedProduct.parent_id);
          selectedVariation = findCartItemVariation(initialVariations, item) || fetchedProduct;
        } else {
          parentProduct = fetchedProduct || fallbackProduct;
        }
      }

      const shouldSeedVariation = Boolean(selectedVariation && (parentId || variationId || selectedVariation?.parent_id));

      setProductModalState({
        key,
        product: parentProduct || fallbackProduct,
        initialVariations,
        initialResolvedVariation: shouldSeedVariation ? selectedVariation : null,
        initialSelectedAttrs: shouldSeedVariation ? getVariationSelectionMap(selectedVariation) : {},
      });
    } catch {
      setProductModalState({
        key,
        product: fallbackProduct,
        initialVariations: [],
        initialResolvedVariation: null,
        initialSelectedAttrs: {},
      });
    } finally {
      setProductModalLoadingKey((current) => (current === key ? '' : current));
    }
  }, [productModalLoadingKey]);

  const handleRemove = useCallback(async (key) => {
    if (!key || removingKey === key) return;
    clearQuantityTimer(key);
    setItemSyncing(key, false);
    setRemovingKey(key);

    try {
      await removeFromCart?.(key);
    } finally {
      setRemovingKey((current) => (current === key ? null : current));
    }
  }, [clearQuantityTimer, removeFromCart, removingKey, setItemSyncing]);

  const scheduleQuantitySync = useCallback((key, quantity) => {
    clearQuantityTimer(key);
    setItemSyncing(key, true);

    const timer = window.setTimeout(async () => {
      syncTimersRef.current.delete(key);
      try {
        await updateQuantity?.(key, quantity);
      } finally {
        setItemSyncing(key, false);
      }
    }, CART_QTY_SYNC_DELAY_MS);

    syncTimersRef.current.set(key, timer);
  }, [clearQuantityTimer, setItemSyncing, updateQuantity]);

  const handleQtyChange = useCallback((key, delta, currentQty) => {
    if (!key || removingKey === key) return;

    const baseQty = Number(localQuantitiesRef.current[key] ?? currentQty);
    const nextQuantity = (Number.isFinite(baseQty) ? baseQty : 1) + Number(delta || 0);

    if (nextQuantity < 1) {
      handleRemove(key);
      return;
    }

    if (nextQuantity > MAX_CART_QUANTITY) return;

    setLocalQuantities((current) => {
      const next = { ...current, [key]: nextQuantity };
      localQuantitiesRef.current = next;
      return next;
    });

    scheduleQuantitySync(key, nextQuantity);
  }, [handleRemove, removingKey, scheduleQuantitySync]);

  useEffect(() => {
    const next = {};
    const activeSyncKeys = syncingKeysRef.current;

    for (const item of cartItems) {
      const key = getCartItemKey(item);
      if (!key) continue;
      const localQty = localQuantitiesRef.current[key];
      next[key] = activeSyncKeys.has(key) && Number.isFinite(Number(localQty))
        ? Number(localQty)
        : item.quantity;
    }

    localQuantitiesRef.current = next;
    setLocalQuantities(next);
  }, [cartItems]);

  useEffect(() => () => {
    syncTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    syncTimersRef.current.clear();
  }, []);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      closeButtonRef.current?.focus?.();
      return;
    }

    closeProductModal();

    if (previouslyFocusedRef.current?.focus) {
      previouslyFocusedRef.current.focus();
    }
  }, [isOpen, closeProductModal]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, handleClose]);

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.price) || 0) * getDisplayQuantity(item, localQuantities), 0),
    [cartItems, localQuantities]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((count, item) => count + getDisplayQuantity(item, localQuantities), 0),
    [cartItems, localQuantities]
  );

  return (
    <div
      ref={overlayRef}
      className={`cart-overlay${isOpen ? ' active' : ''}`}
      onClick={handleClose}
      aria-hidden={!isOpen}
      inert={!isOpen ? '' : undefined}
    >
      <aside
        className="cart-panel storefront-cart-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal={isOpen ? 'true' : 'false'}
        aria-label="Shopping cart"
      >
        <header className="scs-header">
          <div className="scs-header-left">
            <div className="scs-header-icon">
              <ShoppingCart size={15} strokeWidth={2.3} />
            </div>
            <h3 className="scs-title">Your Toolbox</h3>
            {itemCount > 0 && (
              <span className="scs-count">{itemCount}</span>
            )}
          </div>
          <button ref={closeButtonRef} type="button" onClick={handleClose} aria-label="Close cart" className="scs-close">
            <X size={17} strokeWidth={2.5} />
          </button>
        </header>

        <div className="scs-body">
          {cartItems.length === 0 ? (
            <div className="scs-empty">
              <div className="scs-empty-icon">
                <Package size={30} strokeWidth={1.3} />
              </div>
              <strong className="scs-empty-title">Your cart is empty</strong>
              <p className="scs-empty-body">Add products to get started.</p>
              <Link to="/products" onClick={handleNavAndClose} className="scs-browse-btn">
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="scs-item-list" role="list">
              {cartItems.map((item) => {
                const key = getCartItemKey(item);
                const quantity = getDisplayQuantity(item, localQuantities);
                const isSyncing = syncingKeys.has(key);
                const isRemoving = removingKey === key;
                const isPreviewLoading = productModalLoadingKey === key;
                const skuText = getCartItemSku(item);
                const lineTotal = ((Number(item.price) || 0) * quantity).toFixed(2);

                return (
                  <li
                    key={key}
                    className={`scs-item${isSyncing ? ' scs-item--syncing' : ''}${isRemoving ? ' scs-item--removing' : ''}${isPreviewLoading ? ' scs-item--preview-loading' : ''}`}
                    role="listitem"
                    aria-busy={isSyncing || isRemoving || isPreviewLoading ? 'true' : 'false'}
                  >
                    <button
                      type="button"
                      className="scs-item-img scs-item-open-target"
                      onClick={() => handleOpenProduct(item)}
                      aria-label={`View ${item.name} details`}
                      disabled={isRemoving || isPreviewLoading}
                    >
                      {item.image
                        ? <img src={item.image} alt="" loading="lazy" decoding="async" />
                        : <Package size={22} strokeWidth={1.4} className="scs-item-img-placeholder" />}
                    </button>

                    <div className="scs-item-body">
                      <div className="scs-item-top">
                        <button
                          type="button"
                          className="scs-item-name scs-item-name-button"
                          onClick={() => handleOpenProduct(item)}
                          disabled={isRemoving || isPreviewLoading}
                          aria-label={`View ${item.name} details`}
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(key)}
                          aria-label={`Remove ${item.name}`}
                          className="scs-item-remove"
                          disabled={isRemoving}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      {skuText ? <span className="scs-item-sku">SKU: {skuText}</span> : null}

                      <div className="scs-item-bottom">
                        <div className="scs-item-qty-row" role="group" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            className="scs-qty-btn"
                            onClick={() => handleQtyChange(key, -1, quantity)}
                            aria-label={quantity === 1 ? `Remove ${item.name}` : 'Decrease quantity'}
                            disabled={isRemoving}
                          >
                            {quantity === 1
                              ? <Trash2 size={11} strokeWidth={2.2} />
                              : <Minus size={11} strokeWidth={2.5} />}
                          </button>
                          <span className="scs-qty-display" aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            className="scs-qty-btn"
                            onClick={() => handleQtyChange(key, 1, quantity)}
                            aria-label="Increase quantity"
                            disabled={isRemoving || quantity >= MAX_CART_QUANTITY}
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        <span className="scs-item-line-total">
                          {isSyncing || isPreviewLoading ? <span className="scs-sync-dot" aria-hidden="true" /> : null}
                          ${lineTotal}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="scs-footer">
            <div className="scs-subtotal-row">
              <div className="scs-subtotal-info">
                <span className="scs-subtotal-label">Subtotal</span>
                <span className="scs-subtotal-hint">Shipping &amp; taxes at checkout</span>
              </div>
              <strong className="scs-subtotal-amount">
                ${subtotal.toFixed(2)}
              </strong>
            </div>
            <Link
              to="/checkout"
              onClick={handleNavAndClose}
              className="scs-checkout-btn"
            >
              <span>Checkout</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
            <Link
              to="/cart"
              onClick={handleNavAndClose}
              className="scs-view-cart-btn"
            >
              View full cart
            </Link>
          </footer>
        )}
      </aside>

      <ProductModal
        isOpen={Boolean(productModalState?.product)}
        product={productModalState?.product || null}
        onClose={closeProductModal}
      >
        {productModalState?.product ? (
          <ProductDetail
            key={`${productModalState.product?.id || productModalState.key}:${productModalState.initialResolvedVariation?.id || 'parent'}`}
            product={productModalState.product}
            onAddToCart={handleProductModalAddToCart}
            onClose={closeProductModal}
            initialVariations={productModalState.initialVariations || []}
            initialResolvedVariation={productModalState.initialResolvedVariation || null}
            initialSelectedAttrs={productModalState.initialSelectedAttrs || {}}
          />
        ) : null}
      </ProductModal>

      <style>{`
        .storefront-cart-sheet {
          display: flex;
          flex-direction: column;
          background: #fff;
          overflow: hidden;
        }

        .scs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 14px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .scs-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .scs-header-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          flex-shrink: 0;
        }

        .scs-title {
          margin: 0;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #0f172a;
        }

        .scs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: #2563eb;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          line-height: 1;
        }

        .scs-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          cursor: pointer;
          padding: 0;
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          flex-shrink: 0;
        }

        .scs-close:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .scs-body {
          flex: 1 1 auto;
          overflow-y: auto;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.28) transparent;
        }

        .scs-body::-webkit-scrollbar { width: 4px; }
        .scs-body::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.28);
          border-radius: 999px;
        }
        .scs-body::-webkit-scrollbar-track { background: transparent; }

        .scs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 52px 24px;
          gap: 10px;
        }

        .scs-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .scs-empty-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          display: block;
        }

        .scs-empty-body {
          font-size: 0.83rem;
          color: #94a3b8;
          margin: 0;
          line-height: 1.45;
        }

        .scs-browse-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          padding: 11px 26px;
          border-radius: 999px;
          background: #0f172a;
          color: #fff;
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 150ms ease, transform 120ms ease;
        }

        .scs-browse-btn:hover  { background: #1e293b; }
        .scs-browse-btn:active { transform: scale(0.97); }

        .scs-item-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .scs-item {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px 16px;
          border-bottom: 1px solid #f8fafc;
          transition: background 140ms ease, opacity 160ms ease, transform 160ms ease;
        }

        .scs-item:hover {
          background: #fbfdff;
        }

        .scs-item--syncing,
        .scs-item--preview-loading {
          background: linear-gradient(90deg, rgba(37,99,235,0.045), transparent 72%);
        }

        .scs-item--removing {
          opacity: 0.48;
          transform: translateX(3px);
          pointer-events: none;
        }

        .scs-item-img {
          width: 62px;
          height: 62px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scs-item-img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 5px;
        }

        .scs-item-img-placeholder { color: #cbd5e1; }

        .scs-item-open-target,
        .scs-item-name-button {
          appearance: none;
          -webkit-appearance: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
        }

        .scs-item-open-target {
          transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
        }

        .scs-item-open-target:hover,
        .scs-item-open-target:focus-visible {
          border-color: rgba(37, 99, 235, 0.38);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .scs-item-open-target:active {
          transform: scale(0.98);
        }

        .scs-item-open-target:disabled,
        .scs-item-name-button:disabled {
          cursor: wait;
        }

        .scs-item-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .scs-item-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 6px;
        }

        .scs-item-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .scs-item-name-button {
          flex: 1 1 auto;
          min-width: 0;
          border: 0;
          background: transparent;
          transition: color 120ms ease;
        }

        .scs-item-name-button:hover,
        .scs-item-name-button:focus-visible {
          color: #2563eb;
          outline: none;
        }

        .scs-item-name-button:focus-visible {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .scs-item-sku {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: #64748b;
          line-height: 1.25;
          letter-spacing: 0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scs-item-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: none;
          background: none;
          color: #cbd5e1;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          margin-top: 1px;
          transition: color 120ms ease, background 120ms ease;
        }

        .scs-item-remove:hover { color: #ef4444; background: #fef2f2; }
        .scs-item-remove:disabled { opacity: 0.4; cursor: not-allowed; }

        .scs-item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          gap: 8px;
        }

        .scs-item-qty-row {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
        }

        .scs-item--syncing .scs-item-qty-row {
          border-color: rgba(37, 99, 235, 0.28);
          background: #eef4ff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .scs-qty-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: background 100ms ease, color 100ms ease, transform 90ms ease;
          touch-action: manipulation;
        }

        .scs-qty-btn:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
        .scs-qty-btn:active:not(:disabled) { background: #cbd5e1; transform: scale(0.94); }
        .scs-qty-btn:disabled { color: #cbd5e1; cursor: not-allowed; }

        .scs-qty-display {
          min-width: 26px;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          padding: 0 2px;
          user-select: none;
          transition: color 140ms ease, transform 140ms ease;
        }

        .scs-item--syncing .scs-qty-display {
          color: #2563eb;
          transform: scale(1.04);
        }

        .scs-item-line-total {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          transition: color 140ms ease, transform 140ms ease;
        }

        .scs-item--syncing .scs-item-line-total,
        .scs-item--preview-loading .scs-item-line-total {
          color: #2563eb;
        }

        .scs-sync-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .scs-footer {
          padding: 14px 16px calc(env(safe-area-inset-bottom, 0px) + 14px);
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .scs-subtotal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0 6px;
          gap: 8px;
        }

        .scs-subtotal-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .scs-subtotal-label {
          font-size: 0.88rem;
          color: #0f172a;
          font-weight: 700;
        }

        .scs-subtotal-hint {
          font-size: 0.71rem;
          color: #94a3b8;
          font-weight: 400;
        }

        .scs-subtotal-amount {
          font-size: 1.12rem;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .scs-checkout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, #17365d 0%, #2563eb 100%);
          color: #fff;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: opacity 150ms ease, transform 120ms ease, box-shadow 150ms ease;
          text-align: center;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
        }

        .scs-checkout-btn:hover { opacity: 0.93; box-shadow: 0 12px 28px rgba(37, 99, 235, 0.36); }
        .scs-checkout-btn:active { transform: scale(0.98); }

        .scs-view-cart-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: transparent;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
          text-align: center;
        }

        .scs-view-cart-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
