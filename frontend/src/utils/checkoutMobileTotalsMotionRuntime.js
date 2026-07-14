/**
 * Classify and animate mobile checkout totals rows.
 *
 * Presentation-only runtime. It does not calculate totals or mutate checkout
 * payloads; it only tags the already-rendered rows so CSS can keep subtotal,
 * shipping, tax, and final total in a stable receipt order with smooth value
 * changes.
 */

const MOBILE_TOTAL_LINE_SELECTOR = '.dtb-checkout .dtb-co-mobile-cta__total-line'
const VALUE_SELECTOR = '.dtb-co-total-row__value, span:last-child'
const MOTION_CLASS = 'dtb-mobile-total-value-changing'

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function classifyLabel(label) {
  const text = normalizeText(label)

  if (text.includes('subtotal')) return 'subtotal'
  if (text.includes('shipping')) return 'shipping'
  if (text.includes('tax')) return 'tax'
  if (text.includes('total')) return 'final'

  return 'other'
}

function isPendingValue(value) {
  const text = normalizeText(value)
  return text.includes('address') || text.includes('calculating') || text.includes('pending') || text.includes('estimate')
}

function applyMobileTotalsState() {
  if (typeof document === 'undefined') return

  const rows = Array.from(document.querySelectorAll(MOBILE_TOTAL_LINE_SELECTOR))

  rows.forEach((row) => {
    const labelNode = row.querySelector('span:first-child') || row.firstElementChild
    const valueNode = row.querySelector(VALUE_SELECTOR) || row.lastElementChild
    const label = labelNode?.textContent || ''
    const value = valueNode?.textContent || ''
    const type = classifyLabel(label)
    const nextValue = normalizeText(value)
    const previousValue = row.dataset.dtbMobileTotalValue || ''

    row.classList.toggle('dtb-mobile-total-line-subtotal', type === 'subtotal')
    row.classList.toggle('dtb-mobile-total-line-shipping', type === 'shipping')
    row.classList.toggle('dtb-mobile-total-line-tax', type === 'tax')
    row.classList.toggle('dtb-mobile-total-line-final', type === 'final')
    row.classList.toggle('dtb-mobile-total-line-pending', isPendingValue(value))

    if (previousValue && previousValue !== nextValue) {
      row.classList.remove(MOTION_CLASS)
      window.requestAnimationFrame(() => {
        row.classList.add(MOTION_CLASS)
        window.setTimeout(() => row.classList.remove(MOTION_CLASS), 380)
      })
    }

    row.dataset.dtbMobileTotalValue = nextValue
  })
}

export function installCheckoutMobileTotalsMotionRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      applyMobileTotalsState()
    })
  }

  document.addEventListener('DOMContentLoaded', schedule)
  window.addEventListener('load', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'aria-busy', 'disabled'],
  })

  window.setInterval(schedule, 1000)
  schedule()
}
