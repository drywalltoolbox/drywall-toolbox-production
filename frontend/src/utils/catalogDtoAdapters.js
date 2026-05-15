function toNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toLegacyVariationAttributeValues(attributes = []) {
  if (!Array.isArray(attributes)) return [];
  return attributes
    .map((attr) => {
      const name = (attr?.name || '').trim();
      const option = (attr?.option || '').trim();
      if (!name || !option) return null;
      return { name, option };
    })
    .filter(Boolean);
}

export function toCatalogProductCardDTO(dto = {}) {
  const card = dto?.cardProduct || null;
  return {
    id: card?.id ?? dto?.id ?? 0,
    parent_id: card?.parentId ?? dto?.parentId ?? null,
    sku: card?.sku || dto?.sku || '',
    name: card?.name || dto?.name || '',
    price: toNumber(card?.price ?? dto?.price?.value ?? 0, 0),
    image: card?.image || dto?.media?.image || '',
    stock_status: card?.stockStatus || dto?.inventory?.stockStatus || 'instock',
    variation_label: card?.variationLabel || dto?.variation?.label || '',
    addToCartType: card?.addToCartType || (dto?.type === 'variable' ? 'variation' : 'simple'),
  };
}

export function toLegacyVariationDTO(variationDto = {}, parentDto = null) {
  const price = variationDto?.price || {};
  const media = variationDto?.media || {};

  return {
    id: variationDto?.id ?? 0,
    parent_id: variationDto?.parentId ?? parentDto?.id ?? null,
    name: variationDto?.name || parentDto?.name || '',
    slug: variationDto?.slug || '',
    sku: variationDto?.sku || parentDto?.sku || '',
    part_number: variationDto?.sku || parentDto?.sku || '',
    price: toNumber(price?.value, 0),
    regular_price: price?.regular != null ? String(price.regular) : '',
    sale_price: price?.sale != null ? String(price.sale) : '',
    on_sale: Boolean(price?.onSale),
    stock_status: variationDto?.inventory?.stockStatus || 'instock',
    image: media?.image || parentDto?.media?.image || '',
    images: Array.isArray(media?.images) ? media.images : (Array.isArray(parentDto?.media?.images) ? parentDto.media.images : []),
    attributes: Array.isArray(variationDto?.attributes) ? variationDto.attributes : [],
    variation_attribute_values: toLegacyVariationAttributeValues(variationDto?.attributes),
  };
}

export function toLegacyProductCardDTO(dto = {}) {
  const categoryKey = dto?.category?.key || '';
  const displayCategoryKey = dto?.displayCategory?.slug || dto?.displayCategory?.key || '';
  const price = dto?.price || {};
  const inventory = dto?.inventory || {};
  const media = dto?.media || {};
  const cardProduct = toCatalogProductCardDTO(dto);

  return {
    id: dto?.id ?? 0,
    slug: dto?.slug || '',
    type: dto?.type || 'simple',
    name: dto?.name || '',
    description: dto?.description || '',
    short_description: dto?.shortDescription || '',
    sku: dto?.sku || '',
    part_number: dto?.sku || '',
    brand: dto?.brand?.label || '',
    category: categoryKey,
    display_category: displayCategoryKey,
    display_category_label: dto?.displayCategory?.label || displayCategoryKey,
    product_kind: dto?.productKind || '',
    is_variable: dto?.type === 'variable',
    is_parts: Boolean(dto?.isParts),
    price: toNumber(price?.value, 0),
    regular_price: price?.regular != null ? String(price.regular) : '',
    sale_price: price?.sale != null ? String(price.sale) : '',
    on_sale: Boolean(price?.onSale),
    min_price: price?.min != null ? toNumber(price.min, 0) : null,
    stock_status: inventory?.stockStatus || 'instock',
    stock_quantity: inventory?.stockQuantity ?? null,
    image: media?.image || cardProduct.image || '',
    images: Array.isArray(media?.images) ? media.images : [],
    attributes: Array.isArray(dto?.attributes) ? dto.attributes : [],
    variation_attributes: Array.isArray(dto?.attributes) ? dto.attributes : [],
    variation_attribute_values: toLegacyVariationAttributeValues(dto?.attributes),
    cardProduct: {
      ...cardProduct,
      brand: dto?.brand?.label || '',
      parent_id: cardProduct.parent_id,
      stock_status: cardProduct.stock_status,
      add_to_cart_type: cardProduct.addToCartType,
    },
  };
}

export function toProductDetailDTO(payload = {}) {
  const product = payload?.product ? toLegacyProductCardDTO(payload.product) : null;
  const variations = Array.isArray(payload?.variations)
    ? payload.variations.map((variation) => toLegacyVariationDTO(variation, payload?.product || null))
    : [];

  const defaultVariation = payload?.computed?.defaultVariation
    ? toLegacyVariationDTO(payload.computed.defaultVariation, payload?.product || null)
    : null;

  return {
    product,
    variations,
    computed: payload?.computed
      ? {
          ...payload.computed,
          defaultVariation,
        }
      : null,
  };
}

export function toCartLineDTO(productOrCard = {}, quantity = 1) {
  const card = productOrCard?.cardProduct || productOrCard;
  const id = card?.id ?? productOrCard?.id ?? 0;

  return {
    id,
    quantity,
    variation_attribute_values: toLegacyVariationAttributeValues(card?.attributes || productOrCard?.attributes),
    metadata: Array.isArray(card?.metadata) ? card.metadata : (Array.isArray(productOrCard?.metadata) ? productOrCard.metadata : []),
    extensions: card?.extensions || productOrCard?.extensions || {},
  };
}
