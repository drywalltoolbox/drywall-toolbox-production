const SCHEMATIC_PAGE_LABELS = {
  'tapetech-07tt': {
    1: 'Main Body',
    2: 'Head Assembly',
    3: 'Gooser Assembly',
    4: 'Lock Block',
  },
  'tapetech-maxxbox-ehc': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
  },
  'tapetech-easyclean-finishing-box': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
  },
  'tapetech-power-assist-maxxbox': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
  },
  'tapetech-quickbox-qsx': {
    1: '6 in.',
    2: '8 in.',
  },
};

const SCHEMATIC_BRAND_SLUG_ALIASES = {
  asgard: 'asgard',
  columbia: 'columbia-taping-tools',
  'columbia-tools': 'columbia-taping-tools',
  'columbia-taping-tools': 'columbia-taping-tools',
  'columbia-taping': 'columbia-taping-tools',
  'dura-stilt': 'dura-stilts',
  'dura-stilts': 'dura-stilts',
  durastilts: 'dura-stilts',
  durastilt: 'dura-stilts',
  level5: 'level5',
  'level-5': 'level5',
  'level-five': 'level5',
  platinum: 'platinum',
  'platinum-drywall-tools': 'platinum',
  surpro: 'surpro',
  'sur-pro': 'surpro',
  'sur-pro-tools': 'surpro',
  tapetech: 'tapetech',
  'tape-tech': 'tapetech',
  'tape-tech-tools': 'tapetech',
};

function currentSchematicId() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('schematic') || '';
}

function normalizeBrandSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSchematicUrlValue(value) {
  if (typeof window === 'undefined' || value === null || value === undefined || value === '') return value;

  let parsed;
  try {
    parsed = new URL(String(value), window.location.origin);
  } catch {
    return value;
  }

  if (parsed.origin !== window.location.origin || parsed.pathname !== '/schematics') {
    return value;
  }

  const rawBrand = parsed.searchParams.get('brand');
  const normalizedBrand = normalizeBrandSlug(rawBrand);
  const canonicalBrand = SCHEMATIC_BRAND_SLUG_ALIASES[normalizedBrand];
  if (!canonicalBrand || rawBrand === canonicalBrand) {
    return value;
  }

  parsed.searchParams.set('brand', canonicalBrand);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function normalizeCurrentSchematicLocation() {
  if (typeof window === 'undefined') return;
  const normalized = normalizeSchematicUrlValue(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!normalized || normalized === current) return;

  window.history.replaceState(window.history.state, '', normalized);
}

function normalizePageLabelBar() {
  if (typeof document === 'undefined') return;

  const schematicId = currentSchematicId();
  const labels = SCHEMATIC_PAGE_LABELS[schematicId];
  if (!labels) return;

  const pageBar = document.querySelector('.schematic-variant-bar[aria-label="Schematic page selector"]');
  if (!pageBar) return;

  const buttons = Array.from(pageBar.querySelectorAll('.schematic-variant-pill'));
  if (buttons.length === 0) return;

  let activePage = 1;

  buttons.forEach((button, index) => {
    const pageNumber = index + 1;
    const label = labels[pageNumber];
    const labelNode = button.querySelector('.schematic-variant-pill__label');

    if (label && labelNode && labelNode.textContent !== label) {
      labelNode.textContent = label;
    }

    if (button.getAttribute('aria-selected') === 'true') {
      activePage = pageNumber;
    }
  });

  const summaryValue = pageBar.querySelector('.schematic-variant-bar__value');
  const activeLabel = labels[activePage];
  if (summaryValue && activeLabel && summaryValue.textContent !== activeLabel) {
    summaryValue.textContent = activeLabel;
  }
}

function scheduleNormalize() {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(normalizePageLabelBar);
}

function patchHistoryMethod(methodName) {
  const original = window.history?.[methodName];
  if (typeof original !== 'function') return;

  window.history[methodName] = function patchedHistoryMethod(...args) {
    const nextArgs = [...args];
    if (nextArgs.length >= 3) {
      nextArgs[2] = normalizeSchematicUrlValue(nextArgs[2]);
    }
    const result = original.apply(this, nextArgs);
    scheduleNormalize();
    return result;
  };
}

export function installSchematicPageLabelRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DTB_SCHEMATIC_PAGE_LABEL_RUNTIME__) return;
  window.__DTB_SCHEMATIC_PAGE_LABEL_RUNTIME__ = true;

  normalizeCurrentSchematicLocation();
  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', () => {
    normalizeCurrentSchematicLocation();
    scheduleNormalize();
  });

  const observer = new MutationObserver(scheduleNormalize);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-selected'],
  });

  scheduleNormalize();
}