/**
 * frontend/src/auth/useAuth.js
 *
 * Custom hook encapsulating JWT authentication state.
 *
 * Authentication flow (cookie-based):
 *   Login    → POST /dtb/v1/auth/login          — sets HttpOnly SameSite=Strict cookie,
 *                                                   returns user profile (no raw JWT in body)
 *   Logout   → DELETE /dtb/v1/auth/logout        — clears the auth cookie server-side
 *   Restore  → POST /dtb/v1/auth/validate        — reads the cookie, validates JWT,
 *                                                   returns user profile on success
 *   Register → POST /dtb/v1/auth/register        — creates a new account and sets
 *                                                   the auth cookie on success.
 *
 * The raw JWT is never stored in JS memory, localStorage, or sessionStorage.
 * The browser sends it automatically via the HttpOnly cookie on every request
 * to the same origin when `credentials: 'include'` is set (see api/client.js).
 *
 * Cross-origin (GitHub Pages preview) — the backend issues SameSite=None; Secure
 * cookies when the request comes from an allowlisted cross-origin, so auth works
 * identically from the GitHub Pages SPA as it will from the production domain.
 *
 * Exposes: { user, isAuthenticated, isLoading, login, logout, register, error }
 */

import { useState, useEffect, useCallback } from 'react';

// ─── DTB auth endpoint base ───────────────────────────────────────────────────

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
const _base = envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );
const DTB_AUTH_BASE = `${ _base }/wp-json/dtb/v1/auth`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [ user,      setUser      ] = useState( null );
  const [ isLoading, setIsLoading ] = useState( true );
  const [ error,     setError     ] = useState( null );

  // ── Restore session on mount ─────────────────────────────────────────────────
  // If the browser has a valid dtb_auth HttpOnly cookie, the validate endpoint
  // will confirm it and return the user profile without requiring a re-login.
  useEffect( () => {
    let cancelled = false;

    async function validateSession() {
      setIsLoading( true );
      try {
        const res = await fetch( `${ DTB_AUTH_BASE }/validate`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
        } );

        if ( res.ok ) {
          const data = await res.json();
          if ( ! cancelled && data?.user ) {
            setUser( data.user );
          }
        }
        // Non-OK means no active session — remain logged out silently.
      } catch {
        // Network error — remain logged out.
      } finally {
        if ( ! cancelled ) setIsLoading( false );
      }
    }

    validateSession();
    return () => { cancelled = true; };
  }, [] );

  // ── logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback( async () => {
    setUser( null );
    setError( null );

    // Clear the HttpOnly cookie server-side.
    try {
      await fetch( `${ DTB_AUTH_BASE }/logout`, {
        method:      'DELETE',
        credentials: 'include',
      } );
    } catch { /**/ }
  }, [] );

  const updateUser = useCallback((nextUser) => {
    setUser((current) => ({ ...(current || {}), ...(nextUser || {}) }));
  }, []);

  // ── auth:expired listener ────────────────────────────────────────────────────
  useEffect( () => {
    const handler = () => logout();
    window.addEventListener( 'auth:expired', handler );
    return () => window.removeEventListener( 'auth:expired', handler );
  }, [ logout ] );

  // ── login ────────────────────────────────────────────────────────────────────
  const login = useCallback( async ( email, password ) => {
    setError( null );
    setIsLoading( true );
    try {
      const res = await fetch( `${ DTB_AUTH_BASE }/login`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify( { email, password } ),
      } );

      const data = await res.json();

      if ( ! res.ok ) {
        const msg = data?.message || 'Login failed.';
        setError( msg );
        throw new Error( msg );
      }

      // The JWT is now in the HttpOnly cookie — only store the user profile.
      setUser( data.user || null );
      return data;
    } catch ( err ) {
      setError( err.message || 'Login failed.' );
      throw err;
    } finally {
      setIsLoading( false );
    }
  }, [] );

  // ── register ─────────────────────────────────────────────────────────────────
  const register = useCallback( async ( { firstName, lastName, email, password } ) => {
    setError( null );
    setIsLoading( true );
    try {
      const res = await fetch( `${ DTB_AUTH_BASE }/register`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify( { first_name: firstName, last_name: lastName, email, password } ),
      } );

      const data = await res.json();

      if ( ! res.ok ) {
        const msg = data?.message || 'Registration failed.';
        setError( msg );
        throw new Error( msg );
      }

      setUser( data.user || null );
      return data;
    } catch ( err ) {
      setError( err.message || 'Registration failed.' );
      throw err;
    } finally {
      setIsLoading( false );
    }
  }, [] );

  // ── forgotPassword ────────────────────────────────────────────────────────
  const forgotPassword = useCallback( async ( email ) => {
    setError( null );
    try {
      // Pass the SPA's own base URL so the server can build a reset link that
      // points back to this deployment (e.g. GitHub Pages) rather than the
      // production domain.  The backend validates the origin against its
      // allowlist before using it.
      const spaUrl = process.env.REACT_APP_SITE_URL || '';
      const res = await fetch( `${ DTB_AUTH_BASE }/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify( { email, ...( spaUrl ? { spa_url: spaUrl } : {} ) } ),
      } );
      return await res.json();
    } catch ( err ) {
      setError( err.message || 'Request failed.' );
      throw err;
    }
  }, [] );

  // ── resetPassword ─────────────────────────────────────────────────────────
  const resetPassword = useCallback( async ( key, login, password ) => {
    setError( null );
    try {
      const res = await fetch( `${ DTB_AUTH_BASE }/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify( { key, login, password } ),
      } );
      const data = await res.json();
      if ( ! res.ok ) {
        const msg = data?.message || 'Password reset failed.';
        setError( msg );
        throw new Error( msg );
      }
      return data;
    } catch ( err ) {
      setError( err.message || 'Password reset failed.' );
      throw err;
    }
  }, [] );

  return {
    user,
    isAuthenticated: Boolean( user ),
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateUser,
    error,
  };
}

export default useAuth;
