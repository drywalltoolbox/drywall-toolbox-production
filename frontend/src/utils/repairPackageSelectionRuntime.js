const REPAIR_PACKAGE_STORAGE_KEY = 'dtb:repair:selected-package';
const MAX_SELECTION_AGE_MS = 10 * 60 * 1000;

function normalizeAppPath(pathname = '') {
  return String(pathname || '').replace(/^\/staging\/\d+(?=\/|$)/, '') || '/';
}

function readPersistedPackageId() {
  try {
    const raw = window.sessionStorage.getItem(REPAIR_PACKAGE_STORAGE_KEY);
    if (!raw) return '';

    const parsed = JSON.parse(raw);
    if (!parsed?.id) return '';
    if (parsed?.selectedAt && Date.now() - Number(parsed.selectedAt) > MAX_SELECTION_AGE_MS) {
      window.sessionStorage.removeItem(REPAIR_PACKAGE_STORAGE_KEY);
      return '';
    }

    return String(parsed.id);
  } catch {
    return '';
  }
}

export function installRepairPackageSelectionRuntime() {
  if (typeof window === 'undefined') return;

  const applyPersistedSelection = () => {
    const url = new URL(window.location.href);
    const appPath = normalizeAppPath(url.pathname);
    if (appPath !== '/repairs/start' || url.searchParams.has('package')) return;

    const packageId = readPersistedPackageId();
    if (!packageId) return;

    url.searchParams.set('package', packageId);
    window.history.replaceState(window.history.state, '', url.toString());
  };

  applyPersistedSelection();
  window.addEventListener('popstate', applyPersistedSelection);
}
