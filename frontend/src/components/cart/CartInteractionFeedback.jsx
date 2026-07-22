import { useEffect, useState } from 'react';

const ADD_TRIGGER_SELECTOR = '[data-dtb-cart-action="add"]';
const CONTROLLED_FEEDBACK_SELECTOR = '[data-dtb-cart-feedback-mode="controlled"]';
const CART_TARGET_SELECTOR = '.header-mobile-cart-toggle.cart-toggle, .cart-area .cart-toggle, .cart-toggle';
const feedbackTimers = new WeakMap();
const pendingFeedback = new Set();

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

function clearFeedback(trigger) {
  const timers = feedbackTimers.get(trigger);
  timers?.forEach((timer) => window.clearTimeout(timer));
  feedbackTimers.delete(trigger);
  pendingFeedback.delete(trigger);
  trigger.classList.remove('dtb-cart-action--feedback');
  trigger.removeAttribute('data-dtb-cart-feedback');
  trigger.removeAttribute('aria-busy');
}

function pulseCartTarget() {
  const target = findVisibleCartTarget();
  if (!target) return;
  target.classList.remove('dtb-cart-target--pulse');
  window.requestAnimationFrame(() => target.classList.add('dtb-cart-target--pulse'));
  window.setTimeout(() => target.classList.remove('dtb-cart-target--pulse'), 720);
}

function animateButtonCommit(trigger) {
  clearFeedback(trigger);
  trigger.setAttribute('data-dtb-cart-feedback', 'pending');
  trigger.setAttribute('aria-busy', 'true');

  pendingFeedback.add(trigger);
  const safetyTimer = window.setTimeout(() => clearFeedback(trigger), 12000);
  feedbackTimers.set(trigger, [safetyTimer]);
}

function findPendingTrigger(productId) {
  const normalizedId = String(productId || '');
  const candidates = Array.from(pendingFeedback).filter((trigger) => trigger.isConnected);
  if (!normalizedId) return candidates[0] || null;

  return candidates.find((trigger) => {
    const triggerProductId = trigger.getAttribute('data-dtb-cart-product-id');
    return !triggerProductId || triggerProductId === normalizedId;
  }) || null;
}

function resolveButtonCommit(productId, announce) {
  const trigger = findPendingTrigger(productId);
  if (!trigger) return;

  const timers = feedbackTimers.get(trigger);
  timers?.forEach((timer) => window.clearTimeout(timer));
  pendingFeedback.delete(trigger);
  trigger.classList.add('dtb-cart-action--feedback');
  trigger.setAttribute('data-dtb-cart-feedback', 'added');
  trigger.removeAttribute('aria-busy');
  announce('Added to cart');
  window.setTimeout(pulseCartTarget, 320);

  const resetTimer = window.setTimeout(() => clearFeedback(trigger), 920);
  feedbackTimers.set(trigger, [resetTimer]);
}

export default function CartInteractionFeedback() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const handleClick = (event) => {
      const trigger = event.target instanceof Element
        ? event.target.closest(ADD_TRIGGER_SELECTOR)
        : null;
      if (!(trigger instanceof HTMLButtonElement) || trigger.disabled) return;
      if (trigger.matches(CONTROLLED_FEEDBACK_SELECTOR)) return;
      if (feedbackTimers.has(trigger)) return;
      animateButtonCommit(trigger);
    };

    const handleSuccess = (event) => {
      setAnnouncement('');
      window.requestAnimationFrame(() => resolveButtonCommit(event.detail?.productId, setAnnouncement));
    };
    const handleFailure = (event) => {
      const trigger = findPendingTrigger(event.detail?.productId);
      if (trigger) clearFeedback(trigger);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('dtb:cart-add-success', handleSuccess);
    window.addEventListener('dtb:cart-add-failure', handleFailure);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('dtb:cart-add-success', handleSuccess);
      window.removeEventListener('dtb:cart-add-failure', handleFailure);
    };
  }, []);

  return (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </span>
  );
}
