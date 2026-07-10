/**
 * frontend/src/api/client.js
 *
 * Base fetch wrapper for the drywall/v1 server-side proxy.
 *
 * Exports:
 *   apiClient(endpoint, options)  — fetch wrapper for drywall/v1 routes
 *   API_BASE_URL                  — resolved base URL constant
 *
 * Backward-compat exports (used by services/api.js and services/catalog.js):
 *   wcClient, wpClient, credentialsReady
 *
 * Security contract:
 *   - Authorization token is read from the in-memory tokenStore only.
 *   - Credentials are NEVER read from localStorage or sessionStorage.
 *   - On 401: window event 'auth:expired' is dispatched and token is cleared.
 */

import axios from 'axios';
import { getToken, clearToken } from '../auth/tokenStore.js';
import { emitGlobalLoadingEnd, emitGlobalLoadingStart } from '../utils/globalLoadingEvents.js';

const inflightGetRequests = new Map();
const getCooldowns = new Map();
let authExpiryCheckPromise = null;

// ─── Base URLs ────────────────────────────────────────────────────────────────

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );

// Keep API calls pinned to the production WP host when running the static
// storefront from GitHub Pages and no explicit API base is injected.
export const API_BASE_URL =
  envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );

const DTB_AUTH_VALIDATE_URL = API_BASE_URL
  ? `${ API_BASE_URL }/wp-json/dtb/v1/auth/validate`
  : '';

async function shouldDispatchAuthExpired() {
  const token = getToken();
  if ( token ) return true;

  // Without an API base we cannot reliably validate session state here.
  // Avoid forcing logout on ambiguous 401s (prevents dashboard flash loops).
  if ( ! DTB_AUTH_VALIDATE_URL ) return false;

  if ( authExpiryCheckPromise ) {
    return authExpiryCheckPromise;
  }

  authExpiryCheckPromise = ( async () => {
    try {
      const res = await fetch( DTB_AUTH_VALIDATE_URL, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      } );

      if ( ! res.ok ) return true;

      const data = await res.json().catch( () => ( {} ) );
      return ! data?.user;
    } catch {
      // Network/transient failures should not hard-logout the UI.
      return false;
    } finally {
      authExpiryCheckPromise = null;
    }
  } )();

  return authExpiryCheckPromise;
}

// WordPress REST API root — e.g. https://drywalltoolbox.com/wp/wp-json
// Built from REACT_APP_WP_BASE_URL (e.g. https://drywalltoolbox.com/wp).
// Falls back to origin/wp-json when the variable is not set (local dev without .env).
const _wpBase = ( process.env.REACT_APP_WP_BASE_URL || '' ).replace( /\/+$/, '' );
const WP_API_BASE = _wpBase
  ? ( _wpBase.endsWith( '/wp-json' ) ? _wpBase : `${ _wpBase }/wp-json` )
  : ( typeof window !== 'undefined' ? `${ window.location.origin }/wp-json` : '' );

// WooCommerce REST API v3 base — e.g. https://drywalltoolbox.com/wp/wp-json/wc/v3
// Built from REACT_APP_WC_BASE_URL; falls back to origin/wp-json/wc/v3.
const WC_API_BASE =
  process.env.REACT_APP_WC_BASE_URL ||
  ( typeof window !== 'undefined' ? `${ window.location.origin }/wp-json/wc/v3` : '' );

let WC_AUTH_USER = process.env.REACT_APP_WC_AUTH_USER || '';
let WC_AUTH_PASS = process.env.REACT_APP_WC_AUTH_PASS || '';

function normalizeBaseUrl( value = '' ) {
  return String( value || '' ).replace( /\/+$/, '' );
}

function uniqueUrls( urls ) {
  return Array.from( new Set( urls.filter( Boolean ) ) );
}

function buildApiRequestUrls( endpoint ) {
  if ( /^https?:\/\//i.test( endpoint ) ) {
    return [ endpoint ];
  }

  const normalizedEndpoint = endpoint.startsWith( '/' ) ? endpoint : `/${ endpoint }`;

  // Staging is served from nested static paths such as /staging/2972, while
  // WordPress lives under /wp. For /wp-json/* calls, try the canonical root
  // alias first and then the direct /wp/wp-json path. This keeps production
  // behavior unchanged while making staging resilient when the root alias is
  // missing or blocked.
  if ( normalizedEndpoint.startsWith( '/wp-json/' ) ) {
    const restPath = normalizedEndpoint.replace( /^\/wp-json/, '' );
    const bases = uniqueUrls( [
      normalizeBaseUrl( API_BASE_URL ),
      runtimeOrigin ? normalizeBaseUrl( runtimeOrigin ) : '',
    ] );

    const urls = [];
    for ( const base of bases ) {
      urls.push( `${ base }${ normalizedEndpoint }` );
      urls.push( `${ base }/wp/wp-json${ restPath }` );
    }

    if ( WP_API_BASE ) {
      urls.push( `${ normalizeBaseUrl( WP_API_BASE ) }${ restPath }` );
    }

    return uniqueUrls( urls );
  }

  return [ `${ API_BASE_URL }${ normalizedEndpoint }` ];
}

function looksLikeJson( text = '' ) {
  const trimmed = String( text || '' ).trim();
  return trimmed.startsWith( '{' ) || trimmed.startsWith( '[' );
}

async function readJsonEnvelope( response ) {
  const text = await response.text();
  if ( ! text ) return null;

  if ( ! looksLikeJson( text ) ) {
    return null;
  }

  try {
    return JSON.parse( text );
  } catch {
    return null;
  }
}

function nonJsonResponseError( response, url, bodyText = '' ) {
  const preview = String( bodyText || '' ).trim().slice( 0, 80 );
  const looksLikeHtml = /^<!doctype\s+html|^<html|^</i.test( preview );

  return {
    code: 'non_json_response',
    message: looksLikeHtml
      ? 'API endpoint returned HTML instead of JSON. The REST route may be missing, redirected, or routed to the site shell.'
      : 'API endpoint returned a non-JSON response.',
    status: response.status,
    url,
  };
}

async function parseSuccessfulJsonResponse( response, url ) {
  const contentType = ( response.headers.get( 'Content-Type' ) || '' ).toLowerCase();
  const text = await response.text();

  if ( ! text ) return null;

  if ( ! contentType.includes( 'json' ) && ! looksLikeJson( text ) ) {
    throw nonJsonResponseError( response, url, text );
  }

  try {
    return JSON.parse( text );
  } catch {
    throw {
      code: 'invalid_json_response',
      message: 'API endpoint returned malformed JSON.',
      status: response.status,
      url,
    };
  }
}

// ─── Runtime credential bootstrap (backward compat) ──────────────────────────
// Only attempt the config fetch when a WP base URL is explicitly configured.
// On GitHub Pages, _wpBase is empty — skip entirely to avoid 404 noise.

let _credentialsReady = ( WC_AUTH_USER && WC_AUTH_PASS )
  ? Promise.resolve()
  : _wpBase
    ? fetch( `${ WP_API_BASE.replace( /\/+$/, '' ) }/dtb/v1/config` )
        .then( ( r ) => r.json() )
        .then( ( data ) => {
          if ( data && data.wc_auth_user && data.wc_auth_pass ) {
            WC_AUTH_USER = data.wc_auth_user;
            WC_AUTH_PASS = data.wc_auth_pass;
            const encoded = btoa( `${ WC_AUTH_USER }:${ WC_AUTH_PASS }` );
            wcClient.defaults.headers.common[ 'Authorization' ] = `Basic ${ encoded }`;
          }
        } )
        .catch( () => {} )
    : Promise.resolve();

export const credentialsReady = () => _credentialsReady;

// ─── Axios clients (backward compat for services/api.js) ─────────────────────

export const wpClient = axios.create( {
  baseURL: WP_API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
} );

wpClient.interceptors.request.use(
  ( config ) => {
    emitGlobalLoadingStart();
    config.__dtbGlobalLoadingTracked = true;

    const token = getToken();
    if ( token ) {
      config.headers[ 'Authorization' ] = `Bearer ${ token }`;
    }
    return config;
  },
  ( error ) => Promise.reject( error ),
);

wpClient.interceptors.response.use(
  ( response ) => {
    if ( response?.config?.__dtbGlobalLoadingTracked ) {
      emitGlobalLoadingEnd();
      response.config.__dtbGlobalLoadingTracked = false;
    }
    return response;
  },
  async ( error ) => {
    if ( error?.config?.__dtbGlobalLoadingTracked ) {
      emitGlobalLoadingEnd();
      error.config.__dtbGlobalLoadingTracked = false;
    }

    if ( error.response && error.response.status === 401 ) {
      clearToken();
      const shouldExpireSession = await shouldDispatchAuthExpired();
      if ( shouldExpireSession && typeof window !== 'undefined' ) {
        window.dispatchEvent( new Event( 'auth:expired' ) );
      }
    }
    return Promise.reject( error );
  },
);

export const wcClient = axios.create( {
  baseURL: WC_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...( WC_AUTH_USER && WC_AUTH_PASS
      ? { Authorization: 'Basic ' + btoa( `${ WC_AUTH_USER }:${ WC_AUTH_PASS }` ) }
      : {} ),
  },
  withCredentials: true,
} );

wcClient.interceptors.response.use(
  ( response ) => {
    if ( response?.config?.__dtbGlobalLoadingTracked ) {
      emitGlobalLoadingEnd();
      response.config.__dtbGlobalLoadingTracked = false;
    }
    return response;
  },
  ( error ) => {
    if ( error?.config?.__dtbGlobalLoadingTracked ) {
      emitGlobalLoadingEnd();
      error.config.__dtbGlobalLoadingTracked = false;
    }

    if ( error.response && error.response.data && error.response.data.message ) {
      return Promise.reject( new Error( error.response.data.message ) );
    }
    return Promise.reject( error );
  },
);

wcClient.interceptors.request.use(
  ( config ) => {
    emitGlobalLoadingStart();
    config.__dtbGlobalLoadingTracked = true;
    return config;
  },
  ( error ) => Promise.reject( error ),
);

// ─── apiClient — fetch wrapper for drywall/v1 proxy routes ───────────────────

/**
 * Fetch wrapper targeting the drywall/v1 server-side proxy.
 *
 * @param {string} endpoint  Path relative to API_BASE_URL (e.g. '/wp-json/drywall/v1/products')
 * @param {Object} [options] fetch options override
 * @returns {Promise<any>}   Parsed JSON body on success
 * @throws {{ code: string, message: string, status: number, retryAfter?: number }}
 */
export async function apiClient( endpoint, options = {} ) {
  const requestUrls = buildApiRequestUrls( endpoint );

  const method = ( options.method || 'GET' ).toUpperCase();
  const headers = { ...( options.headers || {} ) };

  // Auto-attach Content-Type on mutating requests.
  if ( [ 'POST', 'PUT', 'PATCH' ].includes( method ) && ! headers[ 'Content-Type' ] ) {
    headers[ 'Content-Type' ] = 'application/json';
  }

  // Auto-attach Authorization from in-memory token store only.
  const token = getToken();
  if ( token ) {
    headers[ 'Authorization' ] = `Bearer ${ token }`;
  }

  const requestKey = `${ method } ${ requestUrls[0] } ${ headers[ 'Authorization' ] || '' }`;
  const now = Date.now();

  if ( method === 'GET' ) {
    const cooldownUntil = getCooldowns.get( requestKey ) || 0;
    if ( cooldownUntil > now ) {
      throw {
        code: 'rate_limited',
        message: 'Request is cooling down after a 429 response.',
        status: 429,
        retryAfter: cooldownUntil - now,
      };
    }

    if ( inflightGetRequests.has( requestKey ) ) {
      return inflightGetRequests.get( requestKey );
    }
  }

  emitGlobalLoadingStart();

  const execute = async () => {
    let lastError = null;

    for ( const url of requestUrls ) {
      let response;
      try {
        response = await fetch( url, { ...options, method, headers, credentials: 'include' } );
      } catch {
        lastError = { code: 'network_error', message: 'Network request failed.', status: 0 };
        continue;
      }

      if ( response.status === 401 ) {
        clearToken();
        const shouldExpireSession = await shouldDispatchAuthExpired();
        if ( shouldExpireSession && typeof window !== 'undefined' ) {
          window.dispatchEvent( new Event( 'auth:expired' ) );
        }
        const envelope = await readJsonEnvelope( response ) || {};
        throw {
          code:    envelope.code    || 'unauthorized',
          message: envelope.message || 'Authentication required.',
          status:  401,
        };
      }

      if ( response.status === 429 ) {
        const envelope = await readJsonEnvelope( response ) || {};
        const retryAfterSec = parseInt( response.headers.get( 'Retry-After' ) || '60', 10 );
        const retryAfterMs = retryAfterSec * 1000;
        if ( method === 'GET' ) {
          getCooldowns.set( requestKey, Date.now() + retryAfterMs );
        }
        throw {
          code:       envelope.code    || 'rate_limited',
          message:    envelope.message || 'Too many requests.',
          status:     429,
          retryAfter: retryAfterMs,
        };
      }

      if ( ! response.ok ) {
        const envelope = await readJsonEnvelope( response ) || {};
        lastError = {
          code:    envelope.code    || 'api_error',
          message: envelope.message || `Request failed with status ${ response.status }.`,
          status:  response.status,
        };

        // Only fall back for transport/routing style failures. Do not mask real
        // application errors from the canonical endpoint.
        if ( method === 'GET' && [ 404, 405, 500, 502, 503, 504 ].includes( response.status ) ) {
          continue;
        }

        throw lastError;
      }

      if ( response.status === 204 ) return null;

      try {
        return await parseSuccessfulJsonResponse( response, url );
      } catch ( error ) {
        lastError = error;

        // A 200 HTML response is usually the React/WordPress shell caused by a
        // rewrite/route miss. For GET requests, try alternate REST aliases before
        // failing the feature. For mutating requests, fail closed.
        if ( method === 'GET' && [ 'non_json_response', 'invalid_json_response' ].includes( error?.code ) ) {
          continue;
        }

        throw error;
      }
    }

    throw lastError || { code: 'network_error', message: 'Network request failed.', status: 0 };
  };

  if ( method !== 'GET' ) {
    return execute().finally( () => {
      emitGlobalLoadingEnd();
    } );
  }

  const promise = execute().finally( () => {
    inflightGetRequests.delete( requestKey );
    emitGlobalLoadingEnd();
  } );
  inflightGetRequests.set( requestKey, promise );
  return promise;
}
