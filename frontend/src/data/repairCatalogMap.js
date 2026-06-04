import { OFFICIAL_REPAIR_CATALOG } from './repairCatalogOfficial.generated.js';
import { canonicalBrandLabel } from '../utils/catalogUrlState.js';

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

function getOfficialBrandEntries() {
  return Object.entries(OFFICIAL_REPAIR_CATALOG?.brands || {});
}

function getOfficialRepairBrandData(brand = '') {
  const requested = canonicalBrandLabel(brand);
  const entries = getOfficialBrandEntries();

  const exact = entries.find(([key]) => key === brand || key === requested);
  if (exact) return exact[1];

  const canonicalMatch = entries.find(([key]) => canonicalBrandLabel(key) === requested);
  return canonicalMatch ? canonicalMatch[1] : null;
}

export function getOfficialRepairBrands() {
  const unique = new Map();

  getOfficialBrandEntries().forEach(([brand]) => {
    const label = canonicalBrandLabel(brand);
    if (label && !unique.has(label)) {
      unique.set(label, label);
    }
  });

  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

export function getOfficialRepairCategoriesForBrand(brand = '') {
  const brandData = getOfficialRepairBrandData(brand);
  if (!brandData || !Array.isArray(brandData.categories)) return [];

  return [...new Set(brandData.categories.map(normalizeRepairCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

export function getOfficialRepairModelsForBrandCategory(brand = '', category = '') {
  const brandData = getOfficialRepairBrandData(brand);
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
