/**
 * frontend/src/api/client.js
 *
 * Axios base clients for the headless WordPress + WooCommerce architecture.
 *
 * Exports:
 *   wpClient  – WordPress REST API (JWT-authenticated)
 *   wcClient  – WooCommerce REST API (Application Password authenticated)
 *
 * Credentials are read from VITE_* build-time env vars when available.
 * If they are absent (e.g. older deploy), the app fetches them at runtime
 * from GET /wp-json/dtb/v1/config — stored securely in wp-config.php on
 * the server, never in version control.
 */

import axios from 'axios';

// ─── Base URLs ────────────────────────────────────────────────────────────────

const WP_API_BASE  = import.meta.env.VITE_WP_API_BASE  || (typeof window !== 'undefined' ? `${window.location.origin}/wp-json/` : '');
const WC_API_BASE  = import.meta.env.VITE_WC_API_BASE  || (typeof window !== 'undefined' ? `${window.location.origin}/wp-json/wc/v3` : '');
let   WC_AUTH_USER = import.meta.env.VITE_WC_AUTH_USER || '';
let   WC_AUTH_PASS = import.meta.env.VITE_WC_AUTH_PASS || '';

// ─── Runtime credential bootstrap ────────────────────────────────────────────
// If build-time env vars were not injected, fetch from the server config
// endpoint once and patch the Authorization header on wcClient.

let _credentialsReady = (WC_AUTH_USER && WC_AUTH_PASS)
  ? Promise.resolve()
  : fetch(`${WP_API_BASE.replace(/\/?$/, '/')}dtb/v1/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.wc_auth_user && data.wc_auth_pass) {
          WC_AUTH_USER = data.wc_auth_user;
          WC_AUTH_PASS = data.wc_auth_pass;
          const encoded = btoa(`${WC_AUTH_USER}:${WC_AUTH_PASS}`);
          wcClient.defaults.headers.common['Authorization'] = `Basic ${encoded}`;
        }
      })
      .catch(() => { /* silently continue without auth — public endpoints still work */ });

export const credentialsReady = () => _credentialsReady;

// ─── WordPress REST API client (JWT) ─────────────────────────────────────────

export const wpClient = axios.create({
  baseURL: WP_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach JWT from localStorage if present
wpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dtb_jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: clear token and redirect on 401
wpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('dtb_jwt_token');
      localStorage.removeItem('dtb_jwt_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── WooCommerce REST API client (Application Password) ──────────────────────

export const wcClient = axios.create({
  baseURL: WC_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    // Auth header set immediately if build-time creds are available;
    // otherwise patched after _credentialsReady resolves (see above).
    ...(WC_AUTH_USER && WC_AUTH_PASS
      ? { Authorization: 'Basic ' + btoa(`${WC_AUTH_USER}:${WC_AUTH_PASS}`) }
      : {}),
  },
  withCredentials: true,
});

// Response interceptor: normalise WooCommerce errors
wcClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  },
);
