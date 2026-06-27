import { updateCartCustomer } from '../api/cart.js';

const INSTALL_KEY = '__dtbCheckoutTaxPreviewRuntimeInstalled';
const ADDRESS_FIELD_IDS = ['field-firstName', 'field-lastName', 'field-email', 'field-phone', 'field-address', 'field-city', 'field-state', 'field-zip'];
const DEBOUNCE_MS = 700;

function getCheckoutRoot() {
  return typeof document === 'undefined' ? null : document.querySelector('.dtb-checkout');
}

function parseStoreApiAmount(value, minorUnit = 2) {
  const rawString = String(value ?? '').trim();
  const raw = typeof value === 'number' ? value : Number(rawString || 0);
  if (!Number.isFinite(raw)) return 0;

  const parsedMinor = Number(minorUnit);
  const hasMinorUnit = Number.isFinite(parsedMinor) && parsedMinor >= 0;
  const hasDecimalPoint = rawString.includes('.');

  if (hasMinorUnit && Number.isInteger(raw) && !hasDecimalPoint) {
    return raw / (10 ** parsedMinor);
  }

  return raw > 999 ? raw / 100 : raw;
}

function parseMoney(value = '') {
  const raw = String(value || '').trim();
  if (/^free$/i.test(raw)) return 0;
  const parsed = Number(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getFieldValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function readAddress() {
  return {
    first_name: getFieldValue('field-firstName'),
    last_name: getFieldValue('field-lastName'),
    address_1: getFieldValue('field-address'),
    address_2: '',
    city: getFieldValue('field-city'),
    state: getFieldValue('field-state'),
    postcode: getFieldValue('field-zip'),
    country: 'US',
    email: getFieldValue('field-email'),
    phone: getFieldValue('field-phone'),
  };
}

function hasCompleteTaxAddress(address) {
  return Boolean(address.address_1 && address.city && address.state && address.postcode && address.country);
}

function findRowsByLabel(root, label) {
  return Array.from(root.querySelectorAll('span'))
    .filter((span) => span.textContent.trim().toLowerCase() === label.toLowerCase())
    .map((span) => span.parentElement)
    .filter(Boolean);
}

function getRowValueElement(row) {
  const children = Array.from(row.children || []);
  return children[children.length - 1] || null;
}

function readSummaryAmount(root, label) {
  const row = findRowsByLabel(root, label)[0];
  const valueEl = row ? getRowValueElement(row) : null;
  return parseMoney(valueEl?.textContent || '0');
}

function setSummaryAmount(root, label, value) {
  findRowsByLabel(root, label).forEach((row) => {
    const valueEl = getRowValueElement(row);
    if (valueEl) valueEl.textContent = formatMoney(value);
  });
}

function setTaxText(root, text, className = '') {
  findRowsByLabel(root, 'Tax').forEach((row) => {
    const valueEl = getRowValueElement(row);
    if (!valueEl) return;
    valueEl.textContent = text;
    valueEl.classList.remove('italic', 'text-slate-400');
    if (className) {
      className.split(' ').filter(Boolean).forEach((token) => valueEl.classList.add(token));
    }
  });
}

function updateCollapsedMobileTotal(root, total) {
  Array.from(root.querySelectorAll('button')).forEach((button) => {
    if (!button.textContent.includes('Order Summary')) return;
    const amount = Array.from(button.querySelectorAll('span'))
      .reverse()
      .find((span) => /^\$\d/.test(span.textContent.trim()));
    if (amount) amount.firstChild.textContent = formatMoney(total);
  });
}

function applyTaxPreview({ tax = 0, status = 'ready' } = {}) {
  const root = getCheckoutRoot();
  if (!root) return;

  if (status === 'idle') {
    setTaxText(root, 'Calculated by address', 'italic text-slate-400');
    return;
  }

  if (status === 'loading') {
    setTaxText(root, 'Calculating…', 'italic text-slate-400');
    return;
  }

  if (status === 'error') {
    setTaxText(root, 'Calculated at payment', 'italic text-slate-400');
    return;
  }

  const subtotal = readSummaryAmount(root, 'Subtotal');
  const shipping = readSummaryAmount(root, 'Shipping');
  const total = subtotal + shipping + tax;

  setTaxText(root, formatMoney(tax));
  setSummaryAmount(root, 'Est. Total', total);
  updateCollapsedMobileTotal(root, total);
}

export function installCheckoutTaxPreviewRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  let timer = null;
  let requestSeq = 0;
  let lastPayloadKey = '';
  let lastTax = null;

  const schedule = () => {
    if (!getCheckoutRoot()) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      const address = readAddress();
      if (!hasCompleteTaxAddress(address)) {
        lastTax = null;
        lastPayloadKey = '';
        applyTaxPreview({ status: 'idle' });
        return;
      }

      const payloadKey = JSON.stringify(address);
      if (payloadKey === lastPayloadKey && lastTax !== null) {
        applyTaxPreview({ status: 'ready', tax: lastTax });
        return;
      }

      const requestId = requestSeq + 1;
      requestSeq = requestId;
      lastPayloadKey = payloadKey;
      applyTaxPreview({ status: 'loading' });

      try {
        const cart = await updateCartCustomer({ billing_address: address, shipping_address: address });
        if (requestId !== requestSeq) return;
        const totals = cart?.totals || {};
        const minorUnit = totals.currency_minor_unit ?? 2;
        const tax = parseStoreApiAmount(totals.total_tax, minorUnit);
        lastTax = tax;
        applyTaxPreview({ status: 'ready', tax });
      } catch {
        if (requestId !== requestSeq) return;
        lastTax = null;
        applyTaxPreview({ status: 'error' });
      }
    }, DEBOUNCE_MS);
  };

  document.addEventListener('input', (event) => {
    if (!ADDRESS_FIELD_IDS.includes(event.target?.id)) return;
    schedule();
  }, true);

  document.addEventListener('change', (event) => {
    if (!ADDRESS_FIELD_IDS.includes(event.target?.id)) return;
    schedule();
  }, true);

  const observer = new MutationObserver(() => {
    if (lastTax !== null) applyTaxPreview({ status: 'ready', tax: lastTax });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  schedule();
}
