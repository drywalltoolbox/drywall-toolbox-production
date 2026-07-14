/**
 * frontend/src/utils/checkoutAddressAutocompleteRuntime.js
 *
 * Progressive checkout address autocomplete. Uses a domain-restricted browser
 * Google Places key when configured; otherwise it safely falls back to native
 * browser autofill/autocomplete attributes. No server credentials are used.
 */

const GOOGLE_PLACES_KEY = String(process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY || '').trim();
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/js';
const OPTIONAL_PHONE_FALLBACK = 'Not provided';

let scriptPromise = null;

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

function setField(name, value) {
  const element = document.querySelector(`[name="${name}"]`);
  if (!element || value == null || String(value).trim() === '') return;
  dispatchReactInput(element, String(value).trim());
}

function normalizeOptionalPhone() {
  const phone = document.querySelector('[name="phone"]');
  if (!phone) return;
  phone.required = false;
  phone.removeAttribute('aria-required');
  phone.closest?.('.dtb-co-field')?.classList.add('dtb-co-field--optional-phone-compat');
  if (!String(phone.value || '').trim()) {
    dispatchReactInput(phone, OPTIONAL_PHONE_FALLBACK);
  }
}

function addressInput() {
  return document.getElementById('field-address') || document.querySelector('[name="address"]');
}

function ensureAddressAssist(input) {
  if (!input) return null;
  const wrapper = input.closest?.('.dtb-co-field') || input.parentElement;
  if (!wrapper) return null;
  let assist = wrapper.querySelector('.dtb-address-assist');
  if (!assist) {
    assist = document.createElement('p');
    assist.className = 'dtb-address-assist dtb-address-assist--ready';
    assist.setAttribute('aria-live', 'polite');
    assist.textContent = 'Start typing your address. Browser autofill is supported.';
    wrapper.appendChild(assist);
  }
  return assist;
}

function setAddressAssist(state, message) {
  const input = addressInput();
  const assist = ensureAddressAssist(input);
  if (!assist) return;
  assist.className = `dtb-address-assist dtb-address-assist--${state}`;
  assist.textContent = message;
}

function component(place, type, length = 'long_name') {
  const part = place?.address_components?.find((item) => Array.isArray(item.types) && item.types.includes(type));
  return part?.[length] || '';
}

function applyPlace(place) {
  const streetNumber = component(place, 'street_number');
  const route = component(place, 'route');
  const address = [streetNumber, route].filter(Boolean).join(' ') || place?.formatted_address || '';
  const city = component(place, 'locality') || component(place, 'postal_town') || component(place, 'administrative_area_level_2');
  const state = component(place, 'administrative_area_level_1', 'short_name');
  const zip = component(place, 'postal_code');
  const country = component(place, 'country', 'short_name') || 'US';

  setField('address', address);
  setField('city', city);
  setField('state', state);
  setField('zip', zip);
  setField('country', country);
  normalizeOptionalPhone();

  setAddressAssist('selected', zip ? 'Address selected. Shipping and tax are updating.' : 'Address selected. Add ZIP code to calculate shipping and tax.');

  window.requestAnimationFrame(() => {
    const next = zip ? document.querySelector('[name="customerNote"]') : document.querySelector('[name="zip"]');
    next?.focus?.({ preventScroll: true });
  });
}

function loadGooglePlaces() {
  if (!GOOGLE_PLACES_KEY) return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps.places);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-dtb-google-places="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.maps?.places || null), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: GOOGLE_PLACES_KEY,
      libraries: 'places',
      v: 'weekly',
      loading: 'async',
    });
    script.src = `${GOOGLE_PLACES_URL}?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.dtbGooglePlaces = 'true';
    script.addEventListener('load', () => resolve(window.google?.maps?.places || null), { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  }).catch(() => null);

  return scriptPromise;
}

function installNativeFallback(input) {
  input.setAttribute('autocomplete', 'shipping street-address');
  input.setAttribute('inputmode', 'text');
  input.setAttribute('enterkeyhint', 'next');
  input.setAttribute('placeholder', input.getAttribute('placeholder') || 'Start typing your address');
  document.querySelector('[name="city"]')?.setAttribute('autocomplete', 'shipping address-level2');
  document.querySelector('[name="state"]')?.setAttribute('autocomplete', 'shipping address-level1');
  document.querySelector('[name="zip"]')?.setAttribute('autocomplete', 'shipping postal-code');
}

function installManualAddressHints(input) {
  if (!input || input.dataset.dtbManualHintInstalled === 'true') return;
  input.dataset.dtbManualHintInstalled = 'true';
  input.addEventListener('input', () => {
    const value = String(input.value || '').trim();
    if (value.length >= 6) {
      setAddressAssist('manual', 'Continue entering city, state, and ZIP if the address is not auto-completed.');
    } else {
      setAddressAssist('ready', GOOGLE_PLACES_KEY ? 'Start typing your address to search.' : 'Start typing your address. Browser autofill is supported.');
    }
  });
}

async function enhanceAddressInput(input) {
  if (!input || input.dataset.dtbAddressEnhanced === 'true') return;
  input.dataset.dtbAddressEnhanced = 'true';
  installNativeFallback(input);
  installManualAddressHints(input);
  setAddressAssist('ready', GOOGLE_PLACES_KEY ? 'Start typing your address to search.' : 'Start typing your address. Browser autofill is supported.');

  const places = await loadGooglePlaces();
  if (!places?.Autocomplete) {
    input.dataset.dtbAddressProvider = 'browser-autofill';
    return;
  }

  const autocomplete = new places.Autocomplete(input, {
    componentRestrictions: { country: ['us'] },
    fields: ['address_components', 'formatted_address'],
    types: ['address'],
  });
  input.dataset.dtbAddressProvider = 'google-places';
  autocomplete.addListener('place_changed', () => applyPlace(autocomplete.getPlace()));
}

export function installCheckoutAddressAutocompleteRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const boot = () => {
    if (!isCheckoutPage()) return;
    normalizeOptionalPhone();
    void enhanceAddressInput(addressInput());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  const observer = new MutationObserver(() => boot());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
