import { loadCatalog } from '../services/catalog.js';

export function getOrderItemKey(item = {}) {
  return String(
    item.id ||
    item.cartKey ||
    item.key ||
    item.variation_id ||
    item.product_id ||
    item.sku ||
    item.slug ||
    item.name ||
    ''
  );
}

export function resolveOrderItemImage(item = {}) {
  if (typeof item.image === 'string' && item.image.trim()) return item.image.trim();
  if (item.image && typeof item.image === 'object') {
    return item.image.src || item.image.url || item.image.thumbnail || '';
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object') return first.src || first.url || first.thumbnail || '';
  }
  return item.image_url || item.image_thumb || item.thumbnail || item.thumbnail_url || '';
}

export function resolveCatalogProductImage(product = {}) {
  if (typeof product.image === 'string' && product.image.trim()) return product.image.trim();
  if (product.image && typeof product.image === 'object') {
    return product.image.src || product.image.url || product.image.thumbnail || '';
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object') return first.src || first.url || first.thumbnail || '';
  }
  return product.image_url || product.image_thumb || product.thumbnail || product.thumbnail_url || '';
}

export function getOrderPreviewItem(order = {}) {
  const items = Array.isArray(order.line_items)
    ? order.line_items
    : Array.isArray(order.items)
      ? order.items
      : [];
  return items[0] || null;
}

function normalizeLookupValue(value) {
  return String(value || '').trim().toLowerCase();
}

function canonicalLookupValue(value) {
  return normalizeLookupValue(value).replace(/[^a-z0-9]/g, '');
}

function matchesItem(product, item) {
  const itemIds = [
    item.product_id,
    item.variation_id,
    item.parent_id,
  ].map((value) => String(value || '')).filter(Boolean);

  if (itemIds.includes(String(product.id || ''))) return true;

  const itemSku = normalizeLookupValue(item.sku || item.part_number);
  if (itemSku) {
    const productSkus = [
      product.sku,
      product.part_number,
      product.parent_sku,
    ].map(normalizeLookupValue).filter(Boolean);
    if (productSkus.includes(itemSku)) return true;
  }

  const itemSlug = normalizeLookupValue(item.slug);
  if (itemSlug && normalizeLookupValue(product.slug) === itemSlug) return true;

  const itemName = canonicalLookupValue(item.name);
  return Boolean(itemName && canonicalLookupValue(product.name) === itemName);
}

export async function resolveMissingOrderItemImages(items = []) {
  const missingItems = items.filter((item) => getOrderItemKey(item) && !resolveOrderItemImage(item));
  if (missingItems.length === 0) return {};

  const catalog = await loadCatalog();
  if (!Array.isArray(catalog) || catalog.length === 0) return {};

  const resolved = {};
  for (const item of missingItems) {
    const match = catalog.find((product) => matchesItem(product, item));
    const image = match ? resolveCatalogProductImage(match) : '';
    if (image) {
      resolved[getOrderItemKey(item)] = image;
    }
  }

  return resolved;
}
