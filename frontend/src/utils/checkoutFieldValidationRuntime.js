/**
 * frontend/src/utils/checkoutFieldValidationRuntime.js
 *
 * Progressive checkout field validation for the React checkout. It improves the
 * customer experience with blur/change-time feedback only; server validation in
 * DTB/WooCommerce remains authoritative.
 */

const FIELD_RULES = {
  firstName: {
    message: 'Enter your first name.',
    validate: (value) => value.trim().length > 0,
  },
  lastName: {
    message: 'Enter your last name.',
    validate: (value) => value.trim().length > 0,
  },
  email: {
    message: 'Enter a valid email address.',
    validate: (value) => /^\S+@\S+\.\S+$/.test(value.trim()),
  },
  address: {
    message: 'Enter your street address.',
    validate: (value) => value.trim().length > 0,
  },
  city: {
    message: 'Enter your city.',
    validate: (value) => value.trim().length > 0,
  },
  state: {
    message: 'Select your state.',
    validate: (value) => value.trim().length > 0,
  },
  zip: {
    message: 'Enter a valid ZIP code.',
    validate: (value) => /^\d{5}(?:-\d{4})?$/.test(value.trim()),
  },
};

const PHONE_COMPAT_VALUE = 'Not provided';

function isCheckoutPage() {
  return typeof document !== 'undefined' && Boolean(document.querySelector('.dtb-checkout'));
}

function dispatchReactInput(element, value) {
  if (!element) return;
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function fieldWrapper(element) {
  return element?.closest?.('.dtb-co-field') || element?.parentElement || null;
}

function errorId(name) {
  return `dtb-runtime-err-${name}`;
}

function getExistingReactError(wrapper, name) {
  if (!wrapper) return null;
  return wrapper.querySelector(`#err-${CSS.escape(name)}`) || wrapper.querySelector('.dtb-co-field-error:not(.dtb-co-field-error--runtime)');
}

function ensureRuntimeError(element, name) {
  const wrapper = fieldWrapper(element);
  if (!wrapper) return null;
  let error = wrapper.querySelector(`#${CSS.escape(errorId(name))}`);
  if (!error) {
    error = document.createElement('span');
    error.id = errorId(name);
    error.className = 'dtb-co-field-error dtb-co-field-error--runtime';
    error.setAttribute('role', 'alert');
    wrapper.appendChild(error);
  }
  return error;
}

function setFieldValidity(element, name, message) {
  const runtimeError = ensureRuntimeError(element, name);
  if (!runtimeError) return;

  if (message) {
    runtimeError.textContent = message;
    runtimeError.hidden = false;
    element.classList.add('dtb-co-input--runtime-error');
    element.setAttribute('aria-invalid', 'true');
    const currentDescribedBy = element.getAttribute('aria-describedby') || '';
    const id = errorId(name);
    if (!currentDescribedBy.split(/\s+/).includes(id)) {
      element.setAttribute('aria-describedby', `${currentDescribedBy} ${id}`.trim());
    }
  } else {
    runtimeError.textContent = '';
    runtimeError.hidden = true;
    element.classList.remove('dtb-co-input--runtime-error');
    if (!getExistingReactError(fieldWrapper(element), name)) {
      element.setAttribute('aria-invalid', 'false');
    }
  }
}

function validateField(element) {
  if (!element?.name || !FIELD_RULES[element.name]) return true;
  const rule = FIELD_RULES[element.name];
  const valid = rule.validate(String(element.value || ''));
  setFieldValidity(element, element.name, valid ? '' : rule.message);
  return valid;
}

function updateValidatedState(element) {
  if (!element?.name || !FIELD_RULES[element.name]) return;
  if (String(element.value || '').trim()) {
    validateField(element);
  } else {
    setFieldValidity(element, element.name, '');
  }
}

function normalizeOptionalPhone() {
  const phone = document.querySelector('[name="phone"]');
  if (!phone) return;

  phone.required = false;
  phone.removeAttribute('aria-required');

  const wrapper = fieldWrapper(phone);
  wrapper?.classList.add('dtb-co-field--optional-phone-compat');

  const label = document.querySelector('label[for="field-phone"]');
  if (label) {
    label.innerHTML = 'Phone <span class="dtb-co-label-optional">(optional)</span>';
  }

  if (!String(phone.value || '').trim()) {
    dispatchReactInput(phone, PHONE_COMPAT_VALUE);
  }
}

function installField(element) {
  if (!element?.name || !FIELD_RULES[element.name] || element.dataset.dtbRuntimeValidated === 'true') return;
  element.dataset.dtbRuntimeValidated = 'true';
  element.addEventListener('blur', () => validateField(element));
  element.addEventListener('change', () => updateValidatedState(element));
  element.addEventListener('input', () => updateValidatedState(element));
}

function boot() {
  if (!isCheckoutPage()) return;
  normalizeOptionalPhone();
  Object.keys(FIELD_RULES).forEach((name) => {
    document.querySelectorAll(`[name="${name}"]`).forEach(installField);
  });
}

export function installCheckoutFieldValidationRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  const observer = new MutationObserver(() => boot());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
