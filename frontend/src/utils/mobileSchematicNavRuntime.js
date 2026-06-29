const SCHEMATIC_BRAND_BY_LABEL = {
  'asgard': 'asgard',
  'columbia tools': 'columbia-taping-tools',
  'columbia taping tools': 'columbia-taping-tools',
  'dura-stilts': 'dura-stilts',
  'dura stilts': 'dura-stilts',
  'dura stilt': 'dura-stilts',
  'dura-stilt': 'dura-stilts',
  'level 5': 'level5',
  'level5': 'level5',
  'platinum drywall tools': 'platinum',
  'platinum': 'platinum',
  'surpro': 'surpro',
  'sur pro': 'surpro',
  'sur-pro': 'surpro',
  'tapetech': 'tapetech',
  'tape tech': 'tapetech',
  'tape-tech': 'tapetech',
};

const ROUTE_ROOTS = [
  'products',
  'parts',
  'schematics',
  'calculators',
  'repairs',
  'faq',
  'contact',
  'checkout',
  'account',
  'login',
  'register',
  'product',
];

function normalizeLabel(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[_\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 -]/g, '')
    .trim();
}

function normalizePath(pathname = '/') {
  return `/${String(pathname || '/')
    .split('/')
    .filter(Boolean)
    .join('/')}`;
}

function getStagingMountPath(segments) {
  const stagingIndex = segments.findIndex((segment) => segment === 'staging');
  if (stagingIndex < 0 || !segments[stagingIndex + 1]) return '';

  return `/${segments.slice(0, stagingIndex + 2).join('/')}`;
}

function getAppBasePath() {
  const pathname = normalizePath(window.location.pathname || '/');
  const segments = pathname.split('/').filter(Boolean);
  const routeIndex = segments.findIndex((segment) => ROUTE_ROOTS.includes(segment));

  if (routeIndex > 0) {
    return `/${segments.slice(0, routeIndex).join('/')}`;
  }

  const stagingMountPath = getStagingMountPath(segments);
  if (stagingMountPath) return stagingMountPath;

  return '';
}

function isSchematicsDrawerBrandButton(button) {
  if (!button?.classList?.contains('storefront-mobile-drawer__brand-link')) return false;

  const section = button.closest('.storefront-mobile-drawer__row-wrap');
  const sectionLabel = section?.querySelector('.storefront-mobile-drawer__row-label')?.textContent;
  return normalizeLabel(sectionLabel) === 'schematics';
}

function navigateToSchematicBrand(slug) {
  const basePath = getAppBasePath();
  const target = `${basePath}/schematics?brand=${encodeURIComponent(slug)}`;
  const current = `${normalizePath(window.location.pathname)}${window.location.search}`;

  if (current === target) {
    return;
  }

  window.location.assign(target);
}

export function installMobileSchematicNavRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DTB_MOBILE_SCHEMATIC_NAV_RUNTIME__) return;
  window.__DTB_MOBILE_SCHEMATIC_NAV_RUNTIME__ = true;

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!isSchematicsDrawerBrandButton(button)) return;

    const brandSlug = SCHEMATIC_BRAND_BY_LABEL[normalizeLabel(button.textContent || '')];
    if (!brandSlug) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    navigateToSchematicBrand(brandSlug);
  }, true);
}
