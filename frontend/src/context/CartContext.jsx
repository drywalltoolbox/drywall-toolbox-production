import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  initCart,
  getCart,
  addToCart as storeAddToCart,
  updateCartItem,
  removeCartItem,
  clearStoreCart,
} from '../api/cart.js';
import { trackAddToCart, trackRemoveFromCart } from '../analytics/ecommerceEvents.js';
import { decodeHtmlEntities } from '../utils/string.js';

const CART_SNAPSHOT_KEY = 'drywall-cart-snapshot';
const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

function parsePriceFromStoreApi(value, minorUnit = null) {
  const rawString = String(value ?? '').trim();
  const raw = typeof value === 'number' ? value : parseFloat(rawString || '0');
  if (!Number.isFinite(raw)) return 0;

  const parsedMinor = Number(minorUnit);
  const hasMinorUnit = Number.isFinite(parsedMinor) && parsedMinor >= 0;
  const hasDecimalPoint = rawString.includes('.');

  // Woo Store API price fields are typically integer minor units with a
  // companion currency_minor_unit. Example: "100" + minor_unit=2 => $1.00.
  if (hasMinorUnit && Number.isInteger(raw) && !hasDecimalPoint) {
    return raw / (10 ** parsedMinor);
  }

  // Fallback for payloads that omit minor-unit metadata.
  return raw > 999 ? raw / 100 : raw;
}

function getStoreItemImage(item) {
  const image = Array.isArray(item?.images) ? item.images[0] : null;
  return image?.thumbnail || image?.src || item?.image || '';
}

function normalizeStoreCartItem(item) {
  const variationValues = Array.isArray(item?.variation)
    ? item.variation.map((attr) => ({
        name: attr?.attribute || attr?.name || '',
        option: attr?.value || attr?.option || '',
      })).filter((attr) => attr.name && attr.option)
    : null;

  return {
    cartKey: item.key,
    id: item.id,
    key: item.key,
    name: decodeHtmlEntities(item.name),
    brand: item.brand || '',
    price: parsePriceFromStoreApi(item?.prices?.price ?? item?.price, item?.prices?.currency_minor_unit),
    image: getStoreItemImage(item),
    part_number: item.sku || String(item.id || ''),
    sku: item.sku || '',
    parent_id: item.variation_id ? item.id : null,
    variation_id: item.variation_id || null,
    variation_attribute_values: variationValues,
    quantity: item.quantity || 1,
    raw: item,
  };
}

function normalizeStoreCart(cart) {
  return Array.isArray(cart?.items) ? cart.items.map(normalizeStoreCartItem) : [];
}

function asCartItems(value) {
  return Array.isArray(value) ? value : [];
}

function buildStoreApiVariation(variationAttributeValues) {
  if (!Array.isArray(variationAttributeValues)) return [];
  return variationAttributeValues
    .filter((attr) => attr?.name && attr?.option)
    .map((attr) => ({
      attribute: attr.slug || attr.name,
      value: attr.option,
    }));
}

function buildStoreApiExtensions(product) {
  const metadata = Array.isArray(product?.metadata) ? product.metadata : [];
  if (!product?.extensions && metadata.length === 0) return {};
  if (product?.extensions && metadata.length === 0) return product.extensions;

  return {
    ...(product?.extensions || {}),
    dtb: {
      ...((product?.extensions && product.extensions.dtb) || {}),
      metadata,
    },
  };
}

function readSnapshot() {
  try {
    const saved = localStorage.getItem(CART_SNAPSHOT_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSnapshot(items) {
  try {
    localStorage.setItem(CART_SNAPSHOT_KEY, JSON.stringify(items));
  } catch {
    // Snapshot persistence is non-critical.
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState(readSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const cartItemsRef = useRef(cartItems);
  const lastMutationIdRef = useRef(0);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const beginMutation = useCallback(() => {
    lastMutationIdRef.current += 1;
    return lastMutationIdRef.current;
  }, []);

  const isLatestMutation = useCallback(
    (mutationId) => mutationId === lastMutationIdRef.current,
    []
  );

  const applyServerCart = useCallback((nextCart, options = {}) => {
    const mutationId = options?.mutationId;
    if (Number.isFinite(mutationId) && mutationId !== lastMutationIdRef.current) {
      return null;
    }
    if (!Array.isArray(nextCart?.items)) {
      return null;
    }
    const normalizedItems = normalizeStoreCart(nextCart);
    setCart(nextCart || null);
    setCartItems(normalizedItems);
    cartItemsRef.current = normalizedItems;
    setLastSyncedAt(Date.now());
    writeSnapshot(normalizedItems);
    return normalizedItems;
  }, []);

  const applyOrRefreshServerCart = useCallback(async (nextCart, mutationId) => {
    const appliedItems = applyServerCart(nextCart, { mutationId });
    if (appliedItems) return appliedItems;

    const refreshedCart = await getCart();
    return applyServerCart(refreshedCart, { mutationId }) || [];
  }, [applyServerCart]);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialized = await initCart();
      applyServerCart(initialized);
      return initialized;
    } catch (err) {
      setError(err?.message || 'Could not load cart.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applyServerCart]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    initCart()
      .then((serverCart) => {
        if (!mounted) return;
        applyServerCart(serverCart);
      })
      .catch(async (err) => {
        if (!mounted) return;
        try {
          const serverCart = await getCart();
          if (!mounted) return;
          applyServerCart(serverCart);
        } catch {
          if (!mounted) return;
          setError(err?.message || 'Could not initialize cart.');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [applyServerCart]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!product?.id) return null;
    const mutationId = beginMutation();
    setIsMutating(true);
    setError(null);
    const previousItems = cartItemsRef.current;
    try {
      const variation = buildStoreApiVariation(product.variation_attribute_values);
      const extensions = buildStoreApiExtensions(product);
      const nextCart = await storeAddToCart(product.id, quantity, variation, extensions);
      const normalizedItems = await applyOrRefreshServerCart(nextCart, mutationId);
      const addedItem = normalizedItems.find((item) => String(item.id) === String(product.id)) || { ...product, quantity };
      trackAddToCart({ ...addedItem, quantity });
      return nextCart;
    } catch (err) {
      if (isLatestMutation(mutationId)) {
        setCartItems(previousItems);
        cartItemsRef.current = previousItems;
        writeSnapshot(previousItems);
        setError(err?.message || 'Could not add item to cart.');
      }
      throw err;
    } finally {
      if (isLatestMutation(mutationId)) setIsMutating(false);
    }
  }, [applyOrRefreshServerCart, beginMutation, isLatestMutation]);

  const removeFromCart = useCallback(async (productIdOrKey) => {
    const key = String(productIdOrKey || '');
    if (!key) return null;
    const target = cartItemsRef.current.find((item) => String(item.cartKey || item.key || item.id) === key || String(item.id) === key);
    if (!target?.cartKey && !target?.key) return null;
    const mutationId = beginMutation();
    setIsMutating(true);
    setError(null);
    const previousItems = cartItemsRef.current;
    const optimisticItems = previousItems.filter(
      (item) => String(item.cartKey || item.key || item.id) !== key && String(item.id) !== key
    );
    setCartItems(optimisticItems);
    cartItemsRef.current = optimisticItems;
    writeSnapshot(optimisticItems);
    try {
      const nextCart = await removeCartItem(target.cartKey || target.key);
      await applyOrRefreshServerCart(nextCart, mutationId);
      trackRemoveFromCart(target);
      return nextCart;
    } catch (err) {
      if (isLatestMutation(mutationId)) {
        setCartItems(previousItems);
        cartItemsRef.current = previousItems;
        writeSnapshot(previousItems);
        setError(err?.message || 'Could not remove item from cart.');
      }
      throw err;
    } finally {
      if (isLatestMutation(mutationId)) setIsMutating(false);
    }
  }, [applyOrRefreshServerCart, beginMutation, isLatestMutation]);

  const updateQuantity = useCallback(async (productIdOrKey, newQuantity) => {
    const normalizedQuantity = Number(newQuantity);
    if (!Number.isFinite(normalizedQuantity)) return null;
    if (normalizedQuantity < 1) {
      return removeFromCart(productIdOrKey);
    }

    const key = String(productIdOrKey || '');
    const target = cartItemsRef.current.find((item) => String(item.cartKey || item.key || item.id) === key || String(item.id) === key);
    if (!target?.cartKey && !target?.key) return null;

    const mutationId = beginMutation();
    setIsMutating(true);
    setError(null);
    const previousItems = cartItemsRef.current;
    const optimisticItems = previousItems.map((item) => {
      const itemKey = String(item.cartKey || item.key || item.id);
      return itemKey === key || String(item.id) === key
        ? { ...item, quantity: normalizedQuantity }
        : item;
    });
    setCartItems(optimisticItems);
    cartItemsRef.current = optimisticItems;
    writeSnapshot(optimisticItems);
    try {
      const nextCart = await updateCartItem(target.cartKey || target.key, normalizedQuantity);
      const normalizedItems = await applyOrRefreshServerCart(nextCart, mutationId);
      if (previousItems.length > 0 && normalizedItems.length === 0) {
        throw new Error('Cart sync returned an empty cart unexpectedly.');
      }
      return nextCart;
    } catch (err) {
      if (isLatestMutation(mutationId)) {
        setCartItems(previousItems);
        cartItemsRef.current = previousItems;
        writeSnapshot(previousItems);
        setError(err?.message || 'Could not update cart quantity.');
      }
      throw err;
    } finally {
      if (isLatestMutation(mutationId)) setIsMutating(false);
    }
  }, [applyOrRefreshServerCart, beginMutation, isLatestMutation, removeFromCart]);

  const clearCart = useCallback(async () => {
    const mutationId = beginMutation();
    setIsMutating(true);
    setError(null);
    const previousItems = cartItemsRef.current;
    setCartItems([]);
    cartItemsRef.current = [];
    writeSnapshot([]);
    try {
      const nextCart = await clearStoreCart();
      await applyOrRefreshServerCart(nextCart, mutationId);
      return nextCart;
    } catch (err) {
      if (isLatestMutation(mutationId)) {
        setCartItems(previousItems);
        cartItemsRef.current = previousItems;
        writeSnapshot(previousItems);
        setError(err?.message || 'Could not clear cart.');
      }
      throw err;
    } finally {
      if (isLatestMutation(mutationId)) setIsMutating(false);
    }
  }, [applyOrRefreshServerCart, beginMutation, isLatestMutation]);

  const getCartTotal = useCallback(() => {
    const safeItems = asCartItems(cartItems);
    const totalPrice = cart?.totals?.total_price;
    if (totalPrice != null) return parsePriceFromStoreApi(totalPrice, cart?.totals?.currency_minor_unit);
    return safeItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart, cartItems]);

  const getCartCount = useCallback(
    () => asCartItems(cartItems).reduce((count, item) => count + item.quantity, 0),
    [cartItems]
  );

  const value = useMemo(() => ({
    cart,
    cartItems,
    isLoading,
    isMutating,
    error,
    lastSyncedAt,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    getCartTotal,
    getCartCount,
  }), [
    cart,
    cartItems,
    isLoading,
    isMutating,
    error,
    lastSyncedAt,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    getCartTotal,
    getCartCount,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
