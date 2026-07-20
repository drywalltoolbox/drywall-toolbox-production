import { useEffect } from 'react';

const ADD_TRIGGER_SELECTOR = '[data-dtb-cart-action="add"]';
const CART_TARGET_SELECTOR = '.header-mobile-cart-toggle.cart-toggle, .cart-area .cart-toggle, .cart-toggle';

function findVisibleCartTarget() {
  return Array.from(document.querySelectorAll(CART_TARGET_SELECTOR)).find((element) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    return rect.width > 0
      && rect.height > 0
      && styles.display !== 'none'
      && styles.visibility !== 'hidden';
  }) || null;
}

function animateCartCommit(trigger) {
  const triggerIcon = trigger.querySelector('svg');
  if (triggerIcon && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    triggerIcon.animate([
      { transform: 'translate3d(0, 0, 0) scale(1)' },
      { transform: 'translate3d(0, -2px, 0) scale(0.84)', offset: 0.38 },
      { transform: 'translate3d(0, 0, 0) scale(1.18)', offset: 0.68 },
      { transform: 'translate3d(0, 0, 0) scale(1)' },
    ], { duration: 620, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
  }

  const target = findVisibleCartTarget();
  if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const from = trigger.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'dtb-cart-flight-dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.style.left = `${from.left + (from.width / 2) - 5}px`;
  dot.style.top = `${from.top + (from.height / 2) - 5}px`;
  document.body.appendChild(dot);

  const x = to.left + (to.width / 2) - (from.left + (from.width / 2));
  const y = to.top + (to.height / 2) - (from.top + (from.height / 2));
  const flight = dot.animate([
    { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
    { transform: `translate3d(${x * 0.45}px, ${Math.min(y * 0.45, -42)}px, 0) scale(0.9)`, opacity: 1, offset: 0.48 },
    { transform: `translate3d(${x}px, ${y}px, 0) scale(0.35)`, opacity: 0.15 },
  ], {
    duration: 620,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    fill: 'forwards',
  });

  flight.finished.catch(() => {}).finally(() => dot.remove());
  target.classList.remove('dtb-cart-target--pulse');
  window.setTimeout(() => target.classList.add('dtb-cart-target--pulse'), 500);
  window.setTimeout(() => target.classList.remove('dtb-cart-target--pulse'), 900);
}

export default function CartInteractionFeedback() {
  useEffect(() => {
    const handleClick = (event) => {
      const trigger = event.target instanceof Element
        ? event.target.closest(ADD_TRIGGER_SELECTOR)
        : null;
      if (!(trigger instanceof HTMLButtonElement) || trigger.disabled) return;
      animateCartCommit(trigger);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
