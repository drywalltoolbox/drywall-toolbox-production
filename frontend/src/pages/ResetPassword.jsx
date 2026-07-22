/**
 * frontend/src/pages/ResetPassword.jsx
 *
 * Password reset form reached from the link emailed by /forgot-password.
 *
 * Reads `key` and `login` from the URL query string via useSearchParams.
 * Displays a form with password + confirm-password fields.
 * On success, shows a confirmation with a link to /login.
 * On failure (invalid/expired key), shows an error with a link to /forgot-password.
 *
 * Auth:
 *   Calls useAuthContext().resetPassword(key, login, password)
 *   → POST /dtb/v1/auth/reset-password
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

import { useAuthContext } from '../auth/AuthContext.js';
import '../styles/password-recovery.css';

// ─── Animation variants ───────────────────────────────────────────────────────

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [ 0.16, 1, 0.3, 1 ] },
  },
};

const fieldVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: ( i ) => ( {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: [ 0.16, 1, 0.3, 1 ], delay: 0.1 + i * 0.08 },
  } ),
};

const bannerVariants = {
  initial: { opacity: 0, y: -8, height: 0 },
  animate: { opacity: 1, y: 0,  height: 'auto', transition: { duration: 0.28, ease: [ 0.16, 1, 0.3, 1 ] } },
  exit:    { opacity: 0, y: -4, height: 0,       transition: { duration: 0.18, ease: 'easeIn' } },
};

function BreathingLoader() {
  return (
    <span className="flex items-center gap-2 justify-center">
      { [ 0, 1, 2 ].map( ( i ) => (
        <Motion.span
          key={ i }
          className="block w-1.5 h-1.5 rounded-full bg-white"
          animate={ { scale: [ 1, 1.5, 1 ], opacity: [ 0.4, 1, 0.4 ] } }
          transition={ { duration: 1.1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' } }
        />
      ) ) }
      <span className="text-xs tracking-widest uppercase ml-1">Resetting…</span>
    </span>
  );
}

// ─── ResetPassword page ───────────────────────────────────────────────────────

export default function ResetPassword() {
  const { resetPassword }          = useAuthContext();
  const [ searchParams ]           = useSearchParams();

  const resetKey   = searchParams.get( 'key' )   || '';
  const resetLogin = searchParams.get( 'login' ) || '';

  const [ password,    setPassword    ] = useState( '' );
  const [ confirm,     setConfirm     ] = useState( '' );
  const [ showPw,      setShowPw      ] = useState( false );
  const [ showConfirm, setShowConfirm ] = useState( false );
  const [ submitting,  setSubmitting  ] = useState( false );
  const [ success,     setSuccess     ] = useState( false );
  const [ submitError, setSubmitError ] = useState( null );

  // If the URL is missing the required params, show a broken-link notice.
  const missingParams = ! resetKey || ! resetLogin;

  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const confirmMatch    = confirm.length > 0 && confirm === password;

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    setSubmitError( null );

    if ( password !== confirm ) {
      setSubmitError( 'Passwords do not match.' );
      return;
    }
    if ( password.length < 8 ) {
      setSubmitError( 'Password must be at least 8 characters.' );
      return;
    }

    setSubmitting( true );
    try {
      await resetPassword( resetKey, resetLogin, password );
      setSuccess( true );
    } catch ( err ) {
      setSubmitError( err.message || 'This link is invalid or has expired.' );
    } finally {
      setSubmitting( false );
    }
  };

  return (
    <div
      className="page-wrapper dtb-password-recovery"
      style={ {
        minHeight:       '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         'clamp(2rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3rem)',
        background:      '#f8fafc',
      } }
    >
      <Motion.div
        className="dtb-password-recovery__card"
        variants={ cardVariants }
        initial="hidden"
        animate="visible"
        style={ {
          background:   'white',
          border:       '1px solid rgba(15,23,42,0.08)',
          borderRadius: '8px',
          padding:      'clamp(2rem, 5vw, 2.75rem)',
          width:        '100%',
          maxWidth:     '420px',
          boxShadow:    '0 8px 32px rgba(15,23,42,0.07)',
        } }
      >
        {/* Header */}
        <div style={ { marginBottom: '28px' } }>
          <div style={ {
            width:           '44px',
            height:          '44px',
            background:      'linear-gradient(135deg, #eff6ff, #dbeafe)',
            borderRadius:    '10px',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            marginBottom:    '16px',
          } }>
            <KeyRound size={ 20 } style={ { color: '#2563eb' } } />
          </div>
          <h2 style={ {
            fontSize:      '1.4rem',
            fontWeight:    800,
            color:         '#0f172a',
            margin:        '0 0 6px',
            letterSpacing: '-0.02em',
          } }>
            Set new password
          </h2>
          <p style={ { fontSize: '0.875rem', color: 'rgba(15,23,42,0.5)', margin: 0 } }>
            Enter your new password below.
          </p>
        </div>

        { missingParams && (
          <div style={ {
            padding:      '16px',
            background:   '#fef2f2',
            border:       '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '20px',
          } }>
            <p style={ { margin: '0 0 12px', fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.55 } }>
              This reset link is incomplete or has expired.
            </p>
            <Link
              to="/forgot-password"
              style={ { fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' } }
            >
              Request a new reset link →
            </Link>
          </div>
        ) }

        { ! missingParams && success && (
          <Motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.35, ease: [ 0.16, 1, 0.3, 1 ] } }
          >
            <div style={ {
              display:      'flex',
              alignItems:   'flex-start',
              gap:          '12px',
              padding:      '16px',
              background:   '#f0fdf4',
              border:       '1px solid #bbf7d0',
              borderRadius: '6px',
              marginBottom: '24px',
            } }>
              <CheckCircle size={ 18 } style={ { color: '#16a34a', flexShrink: 0, marginTop: '1px' } } />
              <div>
                <p style={ { margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: '#15803d' } }>
                  Password updated!
                </p>
                <p style={ { margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: 1.55 } }>
                  Your password has been reset. You can now sign in with your new password.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="alloy-button w-full justify-center"
              style={ { textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' } }
            >
              Sign In
            </Link>
          </Motion.div>
        ) }

        { ! missingParams && ! success && (
          <>
            {/* Error banner */}
            <AnimatePresence>
              { submitError && (
                <Motion.div
                  variants={ bannerVariants }
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={ {
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          '10px',
                    padding:      '12px 14px',
                    background:   '#fef2f2',
                    border:       '1px solid #fecaca',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    overflow:     'hidden',
                  } }
                >
                  <AlertCircle size={ 16 } style={ { color: '#dc2626', flexShrink: 0, marginTop: '1px' } } />
                  <div>
                    <p style={ { margin: '0 0 6px', fontSize: '0.825rem', color: '#991b1b', lineHeight: 1.5 } }>
                      { submitError }
                    </p>
                    <Link
                      to="/forgot-password"
                      style={ { fontSize: '0.775rem', fontWeight: 600, color: '#dc2626', textDecoration: 'underline' } }
                    >
                      Request a new reset link
                    </Link>
                  </div>
                </Motion.div>
              ) }
            </AnimatePresence>

            <form onSubmit={ handleSubmit } noValidate>
              {/* New password */}
              <Motion.div
                className="form-group"
                custom={ 0 }
                variants={ fieldVariants }
                initial="hidden"
                animate="visible"
              >
                <label className="machined-label text-blue-600" htmlFor="rp-password">
                  New Password
                </label>
                <div style={ { position: 'relative' } }>
                  <input
                    id="rp-password"
                    type={ showPw ? 'text' : 'password' }
                    className="machined-input text-black"
                    placeholder="At least 8 characters"
                    value={ password }
                    onChange={ ( e ) => setPassword( e.target.value ) }
                    required
                    autoComplete="new-password"
                    disabled={ submitting }
                    style={ { paddingRight: '48px' } }
                  />
                  <button
                    type="button"
                    onClick={ () => setShowPw( ( v ) => ! v ) }
                    style={ {
                      position:   'absolute', right: '14px', top: '50%',
                      transform:  'translateY(-50%)', background: 'none',
                      border:     'none', cursor: 'pointer',
                      color:      'rgba(15,23,42,0.4)', padding: '4px',
                      display:    'flex', lineHeight: 1,
                    } }
                    aria-label={ showPw ? 'Hide password' : 'Show password' }
                  >
                    { showPw ? <EyeOff size={ 16 } /> : <Eye size={ 16 } /> }
                  </button>
                </div>
              </Motion.div>

              {/* Confirm password */}
              <Motion.div
                className="form-group"
                custom={ 1 }
                variants={ fieldVariants }
                initial="hidden"
                animate="visible"
              >
                <label className="machined-label text-blue-600" htmlFor="rp-confirm">
                  Confirm Password
                </label>
                <div style={ { position: 'relative' } }>
                  <input
                    id="rp-confirm"
                    type={ showConfirm ? 'text' : 'password' }
                    className="machined-input text-black"
                    placeholder="Repeat your new password"
                    value={ confirm }
                    onChange={ ( e ) => setConfirm( e.target.value ) }
                    required
                    autoComplete="new-password"
                    disabled={ submitting }
                    style={ {
                      paddingRight: '48px',
                      borderColor:  confirmMismatch ? '#f87171' : undefined,
                    } }
                  />
                  <button
                    type="button"
                    onClick={ () => setShowConfirm( ( v ) => ! v ) }
                    style={ {
                      position:   'absolute', right: '14px', top: '50%',
                      transform:  'translateY(-50%)', background: 'none',
                      border:     'none', cursor: 'pointer',
                      color:      'rgba(15,23,42,0.4)', padding: '4px',
                      display:    'flex', lineHeight: 1,
                    } }
                    aria-label={ showConfirm ? 'Hide confirm password' : 'Show confirm password' }
                  >
                    { showConfirm ? <EyeOff size={ 16 } /> : <Eye size={ 16 } /> }
                  </button>
                  { confirmMatch && (
                    <CheckCircle
                      size={ 16 }
                      style={ {
                        position: 'absolute', right: '42px', top: '50%',
                        transform: 'translateY(-50%)', color: '#16a34a',
                      } }
                    />
                  ) }
                </div>
                <AnimatePresence>
                  { confirmMismatch && (
                    <Motion.p
                      initial={ { opacity: 0, height: 0 } }
                      animate={ { opacity: 1, height: 'auto' } }
                      exit={ { opacity: 0, height: 0 } }
                      transition={ { duration: 0.2 } }
                      style={ { margin: '6px 0 0', fontSize: '0.75rem', color: '#dc2626', overflow: 'hidden' } }
                    >
                      Passwords don&apos;t match
                    </Motion.p>
                  ) }
                </AnimatePresence>
              </Motion.div>

              <Motion.div
                custom={ 2 }
                variants={ fieldVariants }
                initial="hidden"
                animate="visible"
                style={ { marginTop: '8px' } }
              >
                <button
                  type="submit"
                  className="alloy-button w-full justify-center"
                  disabled={ submitting }
                  style={ { opacity: submitting ? 0.75 : 1, transition: 'opacity 0.2s' } }
                >
                  { submitting ? <BreathingLoader /> : 'Reset Password' }
                </button>
              </Motion.div>
            </form>
          </>
        ) }
      </Motion.div>
    </div>
  );
}
