import { OFFICIAL_REPAIR_CATALOG } from './repairCatalogOfficial.generated.js';

export const REPAIR_CATEGORY_ALIASES = {
  tapers: 'Automatic Tapers',
  'automatic taper': 'Automatic Tapers',
  'semi-automatic tapers': 'Semi-Automatic Tapers',
  angleheads: 'Angle Heads',
  'corner finishers': 'Corner Flushers',
  rollers: 'Corner Rollers',
  spotters: 'Nail Spotters',
  nailspotters: 'Nail Spotters',
  adapters: 'Accessories',
  other: 'Accessories',
};

export function normalizeRepairCategory(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  const alias = REPAIR_CATEGORY_ALIASES[raw.toLowerCase()];
  return alias || raw;
}

export function getOfficialRepairBrands() {
  return Object.keys(OFFICIAL_REPAIR_CATALOG?.brands || {}).sort((a, b) => a.localeCompare(b));
}

export function getOfficialRepairCategoriesForBrand(brand = '') {
  const brandData = OFFICIAL_REPAIR_CATALOG?.brands?.[brand];
  if (!brandData || !Array.isArray(brandData.categories)) return [];
  return [...brandData.categories].map(normalizeRepairCategory);
}

export function getOfficialRepairModelsForBrandCategory(brand = '', category = '') {
  const brandData = OFFICIAL_REPAIR_CATALOG?.brands?.[brand];
  if (!brandData) return [];

  const normalizedCategory = normalizeRepairCategory(category);
  const entries = Object.entries(brandData.modelsByCategory || {});
  const match = entries.find(([cat]) => normalizeRepairCategory(cat) === normalizedCategory);
  if (!match) return [];

  const models = Array.isArray(match[1]) ? match[1] : [];
  return models
    .map((m) => {
      const label = String(m?.label || m?.value || m?.name || '').trim();
      if (!label) return null;
      return { value: label, label };
    })
    .filter(Boolean)
    .filter((opt, i, arr) => arr.findIndex((x) => x.value === opt.value) === i)
    .sort((a, b) => a.label.localeCompare(b.label));
}
