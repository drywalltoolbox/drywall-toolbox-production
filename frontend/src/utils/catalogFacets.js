import { brandToSlug, canonicalBrandLabel, sortBrandsBy } from './catalogUrlState.js';

export function normalizeDisplayCategorySlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildDisplayCategoryUrl(slug) {
  return `/products?display_category=${encodeURIComponent(slug)}`;
}

export function normalizeCatalogBrandEntry(rawBrand = {}) {
  const label = canonicalBrandLabel(rawBrand.label || rawBrand.name || rawBrand.key || rawBrand.slug || '');
  if (!label) return null;
  const slug = brandToSlug(label);
  if (!slug) return null;
  const productCount = Number(rawBrand.productCount || rawBrand.count || 0);

  return {
    ...rawBrand,
    key: slug,
    label,
    name: label,
    slug,
    productCount,
    count: productCount,
  };
}

export function dedupeCatalogBrandEntries(rawBrands = []) {
  const bySlug = new Map();

  (Array.isArray(rawBrands) ? rawBrands : []).forEach((rawBrand) => {
    const brand = normalizeCatalogBrandEntry(rawBrand);
    if (!brand) return;

    const existing = bySlug.get(brand.slug);
    if (!existing) {
      bySlug.set(brand.slug, brand);
      return;
    }

    // Alias facets frequently describe the same product set. Preserve the
    // canonical entry and use the highest reported count, not a summed count.
    const productCount = Math.max(existing.productCount || 0, brand.productCount || 0);
    bySlug.set(brand.slug, {
      ...existing,
      logo: existing.logo || brand.logo,
      image: existing.image || brand.image,
      imageUrl: existing.imageUrl || brand.imageUrl,
      productCount,
      count: productCount,
    });
  });

  return sortBrandsBy(Array.from(bySlug.values()), 'label');
}

export function toCatalogBrand(rawBrand = {}) {
  const brand = normalizeCatalogBrandEntry(rawBrand);
  if (!brand) return null;
  return { name: brand.name, slug: brand.slug, count: brand.productCount };
}

export function mapCatalogBrands(rawBrands = []) {
  return dedupeCatalogBrandEntries(rawBrands)
    .map((brand) => ({ name: brand.name, slug: brand.slug, count: brand.productCount }));
}

export function mergeCatalogDisplayCategories(displayCategoriesByBrand = {}) {
  const merged = new Map();
  Object.values(displayCategoriesByBrand || {}).forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      const slug = item?.slug || item?.key;
      if (!slug) return;
      const count = Number(item?.productCount || item?.count || 0);
      const existing = merged.get(slug);
      merged.set(slug, {
        slug,
        label: item?.label || item?.name || item?.key || slug,
        count: (existing?.count || 0) + count,
      });
    });
  });
  return Array.from(merged.values())
    .filter((item) => item.count > 0)
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));
}

export function normalizeCatalogCategoryEntry(category) {
  if (typeof category === 'string') {
    return {
      label: category,
      slug: normalizeDisplayCategorySlug(category),
    };
  }
  const label = category?.label || category?.name || '';
  const slug = category?.slug || category?.key || normalizeDisplayCategorySlug(label);
  return { label, slug };
}
