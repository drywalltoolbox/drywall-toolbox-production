/**
 * frontend/src/utils/checkoutOfficialMobileTotalsRuntime.js
 *
 * Progressive mobile checkout enhancement. It does not own totals or checkout
 * policy; it mirrors already-rendered server-derived summary rows into the
 * sticky mobile action sheet and keeps the top mobile summary focused on the
 * cart items/products only.
 */

const INSTALL_KEY = '__dtbOfficialMobileCheckoutTotalsInstalled';
const MOBILE_QUERY = '(max-width: 1023px)';

function q(root, selector) {
  return root?.querySelector?.(selector) || null;
}

function qa(root, selector) {
  return Array.from(root?.querySelectorAll?.(selector) || []);
}

function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function ensureToggleProductSubtotal(checkout) {
  const summary = q(checkout, '.dtb-co-msummary');
  const toggleRight = q(summary, '.dtb-co-msummary__toggle-right');
  const subtotalValue = text(q(summary, '.dtb-co-msummary__total-row:first-child span:last-child'));
  if (!summary || !toggleRight || !subtotalValue) return;

  let valueNode = q(toggleRight, '.dtb-co-msummary__product-total');
  if (!valueNode) {
    valueNode = document.createElement('span');
    valueNode.className = 'dtb-co-msummary__product-total';
    toggleRight.insertBefore(valueNode, toggleRight.firstChild);
  }
  valueNode.textContent = subtotalValue;

  Array.from(toggleRight.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
      child.textContent = '';
    }
  });
}

function buildTotalsPanel(checkout) {
  const source = q(checkout, '.dtb-co-msummary__totals');
  const ctaInner = q(checkout, '.dtb-co-mobile-cta__inner');
  const primaryButton = q(ctaInner, '.dtb-co-btn-primary');
  if (!source || !ctaInner || !primaryButton) return;

  let panel = q(ctaInner, '.dtb-co-mobile-cta__totals');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'dtb-co-mobile-cta__totals';
    panel.setAttribute('aria-label', 'Order total summary');
    ctaInner.insertBefore(panel, primaryButton);
  }

  const rows = qa(source, '.dtb-co-msummary__total-row')
    .map((row) => {
      const cells = qa(row, 'span');
      const label = text(cells[0]);
      const value = text(cells[cells.length - 1]);
      const isFinal = row.classList.contains('dtb-co-msummary__total-row--final') || /total/i.test(label);
      return label && value ? { label, value, isFinal } : null;
    })
    .filter(Boolean);

  if (!rows.length) return;

  const signature = JSON.stringify(rows);
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;

  panel.innerHTML = '';
  const heading = document.createElement('div');
  heading.className = 'dtb-co-mobile-cta__totals-heading';
  heading.innerHTML = '<span>Order totals</span><span>Secure checkout</span>';
  panel.appendChild(heading);

  rows.forEach((row) => {
    const line = document.createElement('div');
    line.className = `dtb-co-mobile-cta__total-line${row.isFinal ? ' dtb-co-mobile-cta__total-line--final' : ''}`;

    const label = document.createElement('span');
    label.textContent = row.label;
    const value = document.createElement('span');
    value.textContent = row.value;

    line.append(label, value);
    panel.appendChild(line);
  });
}

function syncCheckoutMobileTotals() {
  const checkout = document.querySelector('.dtb-checkout');
  if (!checkout) return;
  ensureToggleProductSubtotal(checkout);
  buildTotalsPanel(checkout);
}

export function installOfficialMobileCheckoutTotalsRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  const media = window.matchMedia?.(MOBILE_QUERY);
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (!media || media.matches) syncCheckoutMobileTotals();
    });
  };

  schedule();

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener('resize', schedule, { passive: true });
  media?.addEventListener?.('change', schedule);
}
