import { OFFICIAL_REPAIR_CATALOG } from './repairCatalogOfficial.generated.js';
import { canonicalBrandLabel } from '../utils/catalogUrlState.js';

export const REPAIR_CATEGORY_ALIASES = {
  tapers: 'Automatic Tapers',
  taper: 'Automatic Tapers',
  'auto taper': 'Automatic Tapers',
  'auto tapers': 'Automatic Tapers',
  'automatic taper': 'Automatic Tapers',
  'automatic tapers': 'Automatic Tapers',
  'automatic taping tool': 'Automatic Tapers',
  'automatic taping tools': 'Automatic Tapers',
  'semi automatic taper': 'Automatic Tapers',
  'semi automatic tapers': 'Automatic Tapers',
  'semi automatic taping tool': 'Automatic Tapers',
  'semi automatic taping tools': 'Automatic Tapers',
  'semi-automatic taper': 'Automatic Tapers',
  'semi-automatic tapers': 'Automatic Tapers',
  'semi-automatic taping tool': 'Automatic Tapers',
  'semi-automatic taping tools': 'Automatic Tapers',
  'flat box': 'Flat / Finishing Boxes',
  'flat boxes': 'Flat / Finishing Boxes',
  'finishing box': 'Flat / Finishing Boxes',
  'finishing boxes': 'Flat / Finishing Boxes',
  'flat / finishing boxes': 'Flat / Finishing Boxes',
  'flat & finishing boxes': 'Flat / Finishing Boxes',
  angleheads: 'Corner Finishers',
  'angle heads': 'Corner Finishers',
  'angle head': 'Corner Finishers',
  'corner tools': 'Corner Finishers',
  'corner tool': 'Corner Finishers',
  'corner finishers': 'Corner Finishers',
  'corner finisher': 'Corner Finishers',
  'corner flushers': 'Corner Finishers',
  'corner flusher': 'Corner Finishers',
  flushers: 'Corner Finishers',
  flusher: 'Corner Finishers',
  rollers: 'Corner Rollers',
  'corner rollers': 'Corner Rollers',
  'corner roller': 'Corner Rollers',
  applicators: 'Corner Applicators',
  applicator: 'Corner Applicators',
  'corner applicators': 'Corner Applicators',
  'corner applicator': 'Corner Applicators',
  spotters: 'Nail Spotters',
  spotter: 'Nail Spotters',
  nailspotters: 'Nail Spotters',
  'nail spotters': 'Nail Spotters',
  'nail spotter': 'Nail Spotters',
  handles: 'Handles & Accessories',
  handle: 'Handles & Accessories',
  extensions: 'Handles & Accessories',
  extension: 'Handles & Accessories',
  'handles & extensions': 'Handles & Accessories',
  'handles and extensions': 'Handles & Accessories',
  accessories: 'Handles & Accessories',
  accessory: 'Handles & Accessories',
  'compound tubes': 'Handles & Accessories',
  'compound tube': 'Handles & Accessories',
  tubes: 'Handles & Accessories',
  tube: 'Handles & Accessories',
  adapters: 'Handles & Accessories',
  adapter: 'Handles & Accessories',
  pumps: 'Pumps',
  pump: 'Pumps',
  'mud pans and pumps': 'Pumps',
  'mud pans & pumps': 'Pumps',
  other: 'Accessories',
};

export function normalizeRepairCategory(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  const normalized = raw.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ');
  const directAlias = REPAIR_CATEGORY_ALIASES[raw.toLowerCase()];
  const normalizedAlias = REPAIR_CATEGORY_ALIASES[normalized];
  return directAlias || normalizedAlias || raw;
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

function isExcludedRepairToolModel(model = {}) {
  const text = `${model.label || ''} ${model.name || ''} ${model.value || ''}`.toLowerCase();
  return /\b(parts?|repair kit|wear kit|hardware kit|tool set|sets? of|mud pan|hawk|float|wash station|smoothing blade)\b/.test(text);
}

function repairToolModelMatchesCategory(model = {}, category = '') {
  const text = `${model.label || ''} ${model.name || ''} ${model.value || ''}`.toLowerCase();

  switch (category) {
    case 'Automatic Tapers':
      return /\btaper\b/.test(text);
    case 'Flat / Finishing Boxes':
      return /\b(flat|finishing|angle)\s+box(?:es)?\b/.test(text);
    case 'Pumps':
      return /\bpump\b/.test(text);
    case 'Corner Finishers':
      return /\b(corner|angle)\s+(finisher|flusher|head|edger)|\bflusher\b|\bangle head\b/.test(text);
    case 'Corner Rollers':
      return /\bcorner\s+roller\b|\bcompound\s+roller\b/.test(text);
    case 'Corner Applicators':
      return /\bcorner\s+applicator\b|\bmudrunner\b|\bmud runner\b/.test(text);
    case 'Nail Spotters':
      return /\bnail\s+spotter\b/.test(text);
    case 'Handles & Accessories':
      return /\bhandle\b|\bgooseneck\b|\bcompound tube\b|\bsupport tube\b/.test(text);
    default:
      return true;
  }
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

export function getOfficialRepairBrandsForCategory(category = '') {
  const normalizedCategory = normalizeRepairCategory(category);
  if (!normalizedCategory) return getOfficialRepairBrands();

  return getOfficialRepairBrands()
    .filter((brand) => getOfficialRepairModelsForBrandCategory(brand, normalizedCategory).length > 0)
    .sort((a, b) => a.localeCompare(b));
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
  const models = entries
    .filter(([cat]) => normalizeRepairCategory(cat) === normalizedCategory)
    .flatMap(([, categoryModels]) => Array.isArray(categoryModels) ? categoryModels : []);
  return models
    .filter((model) => !isExcludedRepairToolModel(model))
    .filter((model) => repairToolModelMatchesCategory(model, normalizedCategory))
    .map((m) => {
      const label = String(m?.label || m?.value || m?.name || '').trim();
      if (!label) return null;
      return { value: label, label };
    })
    .filter(Boolean)
    .filter((opt, i, arr) => arr.findIndex((x) => x.value === opt.value) === i)
    .sort((a, b) => a.label.localeCompare(b.label));
}
