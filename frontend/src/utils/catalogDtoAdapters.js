function toNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toLegacyMetaData(metaData = []) {
  if (!Array.isArray(metaData)) return [];

  return metaData
    .map((entry) => {
      const key = `${entry?.key || ''}`.trim();
      if (!key) return null;
      return {
        key,
        value: entry?.value ?? '',
      };
    })
    .filter(Boolean);
}

function toLegacyVariationAttributeValues(attributes = []) {
  if (!Array.isArray(attributes)) return [];
  return attributes
    .map((attr) => {
      const name = (attr?.name || '').trim();
      const option = (attr?.option || attr?.value || attr?.label || '').trim();
      if (!name || !option) return null;
      return { name, option };
    })
    .filter(Boolean);
}

function firstVariationAttribute(product = {}) {
  const attrs = Array.isArray(product?.attributes) ? product.attributes : [];
  return attrs.find((attr) => attr?.name && Array.isArray(attr?.options) && attr.options.length > 0) || null;
}

function firstVariationAxis(payloadProduct = {}, variations = [], computed = null) {
  return (
    firstVariationAttribute(payloadProduct)?.name ||
    computed?.variationMatrix?.axis ||
    variations.find((variation) => variation?.variation?.axis)?.variation?.axis ||
    ''
  );
}

function optionKeysForVariation(variation = {}, axis = '') {
  const keys = [];
  const attrs = Array.isArray(variation?.attributes) ? variation.attributes : [];

  attrs.forEach((attr) => {
    if (attr?.option) keys.push(attr.option);
    if (attr?.value) keys.push(attr.value);
    if (attr?.label) keys.push(attr.label);
  });

  const meta = variation?.variation || {};
  if (meta.label) keys.push(meta.label);
  if (meta.value) keys.push(meta.value);

  if (axis && keys.length === 0 && variation?.variation_label) {
    keys.push(variation.variation_label);
  }

  return expandOptionAliases(keys);
}

function normalizeOptionKey(value) {
  return String(value || '').trim().toLowerCase();
}

function expandOptionAliases(values = []) {
  const out = new Set();

  values.filter(Boolean).forEach((raw) => {
    const value = String(raw).trim();
    if (!value) return;
    out.add(value);
    out.add(normalizeOptionKey(value));

    const inchMatch = value.match(/^(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")?$/i);
    if (inchMatch) {
      const n = inchMatch[1];
      out.add(n);
      out.add(`${n} in`);
      out.add(`${n}"`);
      out.add(normalizeOptionKey(n));
      out.add(normalizeOptionKey(`${n} in`));
      out.add(normalizeOptionKey(`${n}"`));
    }

    const normalizedInches = value.replace(/\b(inches|inch|in)\b/gi, 'in').replace(/\s+/g, ' ').trim();
    if (normalizedInches !== value) {
      out.add(normalizedInches);
      out.add(normalizeOptionKey(normalizedInches));
    }
  });

  return Array.from(out);
}

function splitParentOptions(options = []) {
  if (!Array.isArray(options)) return [];
  const split = [];
  options.forEach((option) => {
    String(option || '')
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => split.push(part));
  });
  return split;
}

function normalizeNameToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\b(inches|inch|in)\b/g, '')
    .replace(/["']/g, '')
    .replace(/-/g, '.')
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/\.0+$/g, '')
    .trim();
}

function isRawVariationToken(value) {
  return /^\d+(?:[.-]\d+)?(?:\s*(?:in|inch|inches|"))?$/i.test(String(value || '').trim());
}

function shouldPreserveCatalogVariationName(rawName, parentName) {
  if (!rawName) return false;
  if (!parentName) return true;
  if (isRawVariationToken(rawName)) return false;

  const normalizedRaw = normalizeNameToken(rawName);
  const normalizedParent = normalizeNameToken(parentName);
  return Boolean(normalizedParent && normalizedRaw.includes(normalizedParent));
}

function composeVariationName(rawName, parentName, variationLabel) {
  if (shouldPreserveCatalogVariationName(rawName, parentName)) {
    return rawName;
  }

  if (parentName && variationLabel) {
    return `${parentName} - ${variationLabel}`;
  }

  return rawName || parentName || '';
}

function matrixEntryForVariation(variation = {}) {
  return {
    variation_id: variation?.id ?? variation?.variationId ?? 0,
    variationId: variation?.id ?? variation?.variationId ?? 0,
    sku: variation?.sku || '',
    stock_status: variation?.stock_status || variation?.inventory?.stockStatus || 'instock',
    stockStatus: variation?.stock_status || variation?.inventory?.stockStatus || 'instock',
    purchasable: variation?.purchasable ?? variation?.inventory?.purchasable ?? true,
    price: toNumber(variation?.price?.value ?? variation?.price, 0),
  };
}

function buildAvailableOptionMatrix(product, variations, computed = null) {
  if (computed?.available_option_matrix && typeof computed.available_option_matrix === 'object') {
    return computed.available_option_matrix;
  }

  const axis = firstVariationAxis(product, variations, computed);
  if (!axis) return {};

  const matrix = { [axis]: {} };

  variations.forEach((variation) => {
    const entry = matrixEntryForVariation(variation);
    optionKeysForVariation(variation, axis).forEach((key) => {
      matrix[axis][key] = entry;
      matrix[axis][normalizeOptionKey(key)] = entry;
    });
  });

  const options = computed?.variationMatrix?.options;
  if (Array.isArray(options)) {
    options.forEach((option) => {
      const entry = {
        variation_id: option.variationId || option.variation_id || 0,
        variationId: option.variationId || option.variation_id || 0,
        sku: option.sku || '',
        stock_status: option.stockStatus || option.stock_status || 'instock',
        stockStatus: option.stockStatus || option.stock_status || 'instock',
        purchasable: option.purchasable ?? true,
        price: toNumber(option.price, 0),
      };

      expandOptionAliases([option.value, option.label]).forEach((key) => {
        matrix[axis][key] = entry;
        matrix[axis][normalizeOptionKey(key)] = entry;
      });
    });
  }

  return matrix;
}

function buildVariationAttributes(dto = {}, computed = null) {
  const attrs = Array.isArray(dto?.attributes) ? dto.attributes : [];
  const axis = computed?.variationMatrix?.axis || firstVariationAttribute(dto)?.name || '';
  const matrixOptions = Array.isArray(computed?.variationMatrix?.options) ? computed.variationMatrix.options : [];

  if (axis && matrixOptions.length > 0) {
    return [{
      id: firstVariationAttribute(dto)?.id || 0,
      name: axis.charAt(0).toUpperCase() + axis.slice(1),
      slug: firstVariationAttribute(dto)?.slug || axis,
      visible: true,
      variation: true,
      options: matrixOptions.map((option) => option.label || option.value).filter(Boolean),
    }];
  }

  return attrs.map((attr) => ({
    ...attr,
    options: splitParentOptions(attr?.options),
  }));
}

export function toCatalogProductCardDTO(dto = {}) {
  const card = dto?.cardProduct || null;
  const variationLabel = card?.variationLabel || dto?.variation?.label || '';
  const parentDtoName = dto?.name || '';
  const rawCardName = card?.name || dto?.name || '';
  const displayName = composeVariationName(rawCardName, parentDtoName, variationLabel);

  return {
    id: card?.id ?? dto?.id ?? 0,
    parent_id: card?.parentId ?? dto?.parentId ?? null,
    sku: card?.sku || dto?.sku || '',
    name: displayName,
    price: toNumber(card?.price ?? dto?.price?.value ?? 0, 0),
    image: card?.image || dto?.media?.image || '',
    stock_status: card?.stockStatus || dto?.inventory?.stockStatus || 'instock',
    variation_label: variationLabel,
    addToCartType: card?.addToCartType || (dto?.type === 'variable' ? 'variation' : 'simple'),
    attributes: Array.isArray(card?.attributes) ? card.attributes : [],
    variation_attribute_values: toLegacyVariationAttributeValues(card?.attributes || []),
  };
}

export function toLegacyVariationDTO(variationDto = {}, parentDto = null) {
  const price = typeof variationDto?.price === 'object' ? variationDto.price : { value: variationDto?.price };
  const media = variationDto?.media || {};
  const axis = variationDto?.variation?.axis || firstVariationAttribute(parentDto)?.name || '';
  const sourceAttributes = Array.isArray(variationDto?.attributes) ? variationDto.attributes : [];
  const attributes = sourceAttributes.length > 0
    ? sourceAttributes
    : (() => {
        const label = variationDto?.variation?.label || variationDto?.variation?.value || variationDto?.variation_label || '';
        return axis && label ? [{ name: axis, option: label }] : [];
      })();

  const variationLabel = variationDto?.variation?.label || variationDto?.variation?.value || '';
  const parentName = parentDto?.name || '';
  const rawName = variationDto?.name || '';
  const displayName = composeVariationName(rawName, parentName, variationLabel);

  return {
    id: variationDto?.id ?? 0,
    parent_id: variationDto?.parentId ?? variationDto?.parent_id ?? parentDto?.id ?? null,
    name: displayName,
    slug: variationDto?.slug || '',
    sku: variationDto?.sku || parentDto?.sku || '',
    part_number: variationDto?.sku || parentDto?.sku || '',
    price: toNumber(price?.value, 0),
    regular_price: price?.regular != null ? String(price.regular) : '',
    sale_price: price?.sale != null ? String(price.sale) : '',
    on_sale: Boolean(price?.onSale),
    stock_status: variationDto?.inventory?.stockStatus || variationDto?.stock_status || 'instock',
    purchasable: variationDto?.inventory?.purchasable ?? variationDto?.purchasable ?? true,
    image: media?.image || variationDto?.image || parentDto?.media?.image || parentDto?.image || '',
    images: Array.isArray(media?.images)
      ? media.images
      : (Array.isArray(variationDto?.images)
        ? variationDto.images
        : (Array.isArray(parentDto?.media?.images) ? parentDto.media.images : [])),
    attributes,
    variation: variationDto?.variation || {},
    meta_data: toLegacyMetaData(variationDto?.metaData),
    variation_attribute_values: toLegacyVariationAttributeValues(attributes),
  };
}

export function toLegacyProductCardDTO(dto = {}, computed = null) {
  const categoryKey = dto?.category?.key || '';
  const displayCategoryKey = dto?.displayCategory?.slug || dto?.displayCategory?.key || '';
  const price = dto?.price || {};
  const inventory = dto?.inventory || {};
  const media = dto?.media || {};
  const cardProduct = toCatalogProductCardDTO(dto);
  const variationAttributes = buildVariationAttributes(dto, computed);

  return {
    id: dto?.id ?? 0,
    slug: dto?.slug || '',
    type: dto?.type || 'simple',
    name: dto?.name || '',
    description: dto?.description || '',
    description_full: dto?.description || dto?.description_full || '',
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
    purchasable: inventory?.purchasable ?? true,
    image: media?.image || cardProduct.image || '',
    images: Array.isArray(media?.images) ? media.images : [],
  meta_data: toLegacyMetaData(dto?.metaData),
    attributes: variationAttributes,
    variation_attributes: variationAttributes,
    variation_attribute_values: toLegacyVariationAttributeValues(variationAttributes),
    variation: dto?.variation || {},
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
  const product = payload?.product ? toLegacyProductCardDTO(payload.product, payload?.computed || null) : null;
  const variations = Array.isArray(payload?.variations)
    ? payload.variations.map((variation) => toLegacyVariationDTO(variation, payload?.product || null))
    : [];

  const defaultVariation = payload?.computed?.defaultVariation
    ? toLegacyVariationDTO(payload.computed.defaultVariation, payload?.product || null)
    : null;
  const availableOptionMatrix = buildAvailableOptionMatrix(product, variations, payload?.computed || null);

  return {
    product,
    variations,
    computed: {
      ...(payload?.computed || {}),
      defaultVariation,
      available_option_matrix: availableOptionMatrix,
    },
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
