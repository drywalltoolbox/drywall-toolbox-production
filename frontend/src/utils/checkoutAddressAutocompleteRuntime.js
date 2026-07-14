/**
 * frontend/src/utils/checkoutAddressAutocompleteRuntime.js
 *
 * Progressive checkout address autocomplete. Uses a domain-restricted browser
 * Google Places key when configured; otherwise it safely falls back to native
 * browser autofill/autocomplete attributes. No server credentials are used.
 */

const GOOGLE_PLACES_KEY = String(process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY || '').trim();
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/js';

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

function installNativeFallback(addressInput) {
  addressInput.setAttribute('autocomplete', 'shipping street-address');
  addressInput.setAttribute('inputmode', 'text');
  addressInput.setAttribute('enterkeyhint', 'next');
  document.querySelector('[name="city"]')?.setAttribute('autocomplete', 'shipping address-level2');
  document.querySelector('[name="state"]')?.setAttribute('autocomplete', 'shipping address-level1');
  document.querySelector('[name="zip"]')?.setAttribute('autocomplete', 'shipping postal-code');
}

async function enhanceAddressInput(addressInput) {
  if (!addressInput || addressInput.dataset.dtbAddressEnhanced === 'true') return;
  addressInput.dataset.dtbAddressEnhanced = 'true';
  installNativeFallback(addressInput);

  const places = await loadGooglePlaces();
  if (!places?.Autocomplete) {
    addressInput.dataset.dtbAddressProvider = 'browser-autofill';
    return;
  }

  const autocomplete = new places.Autocomplete(addressInput, {
    componentRestrictions: { country: ['us'] },
    fields: ['address_components', 'formatted_address'],
    types: ['address'],
  });
  addressInput.dataset.dtbAddressProvider = 'google-places';
  autocomplete.addListener('place_changed', () => applyPlace(autocomplete.getPlace()));
}

export function installCheckoutAddressAutocompleteRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const boot = () => {
    if (!isCheckoutPage()) return;
    const addressInput = document.getElementById('field-address') || document.querySelector('[name="address"]');
    void enhanceAddressInput(addressInput);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  const observer = new MutationObserver(() => boot());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
