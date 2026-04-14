/**
 * frontend/src/pages/ForgotPassword.jsx
 *
 * Single-field form: user enters their email to request a password reset.
 *
 * Design:
 *   - Centred card, minimal — no two-column hero (only one field).
 *   - Framer Motion card + field entrance animations.
 *   - After submit (regardless of outcome), shows a confirmation message so
 *     the response is identical whether the email exists or not.
 *   - Link back to /login.
 *
 * Auth:
 *   Calls useAuthContext().forgotPassword() → POST /dtb/v1/auth/forgot-password.
 *   The server always returns 200; the confirmation message is shown either way.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

import { useAuthContext } from '../auth/AuthContext.js';

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
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: [ 0.16, 1, 0.3, 1 ], delay: 0.1 },
  },
};

const errorVariants = {
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
      <span className="text-xs tracking-widest uppercase ml-1">Sending…</span>
    </span>
  );
}

// ─── ForgotPassword page ──────────────────────────────────────────────────────

export default function ForgotPassword() {
  const { forgotPassword } = useAuthContext();

  const [ email,       setEmail       ] = useState( '' );
  const [ submitting,  setSubmitting  ] = useState( false );
  const [ sent,        setSent        ] = useState( false );
  const [ submitError, setSubmitError ] = useState( null );

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    setSubmitError( null );
    setSubmitting( true );
    try {
      await forgotPassword( email );
      setSent( true );
    } catch {
      // Network-level error only — the server always returns 200.
      setSubmitError( 'Something went wrong. Please try again.' );
    } finally {
      setSubmitting( false );
    }
  };

  return (
    <div
      className="page-wrapper"
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
            <Mail size={ 20 } style={ { color: '#2563eb' } } />
          </div>
          <h2 style={ {
            fontSize:      '1.4rem',
            fontWeight:    800,
            color:         '#0f172a',
            margin:        '0 0 6px',
            letterSpacing: '-0.02em',
          } }>
            Reset your password
          </h2>
          <p style={ { fontSize: '0.875rem', color: 'rgba(15,23,42,0.5)', margin: 0 } }>
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        { sent ? (
          /* ── Confirmation state ─────────────────────────────────────────── */
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
                  Check your inbox
                </p>
                <p style={ { margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: 1.55 } }>
                  If <strong>{ email }</strong> is registered, a password reset link is on its way. Check your spam folder if it doesn&apos;t arrive within a few minutes.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              style={ {
                display:         'flex',
                alignItems:      'center',
                gap:             '8px',
                fontSize:        '0.875rem',
                fontWeight:      600,
                color:           '#2563eb',
                textDecoration:  'none',
              } }
            >
              <ArrowLeft size={ 14 } />
              Back to sign in
            </Link>
          </Motion.div>
        ) : (
          /* ── Form state ─────────────────────────────────────────────────── */
          <>
            {/* Error banner */}
            <AnimatePresence>
              { submitError && (
                <Motion.div
                  variants={ errorVariants }
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
                  <p style={ { margin: 0, fontSize: '0.825rem', color: '#991b1b', lineHeight: 1.5 } }>
                    { submitError }
                  </p>
                </Motion.div>
              ) }
            </AnimatePresence>

            <form onSubmit={ handleSubmit } noValidate>
              <Motion.div
                className="form-group"
                variants={ fieldVariants }
                initial="hidden"
                animate="visible"
              >
                <label className="machined-label text-blue-600" htmlFor="fp-email">
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  className="machined-input text-black"
                  placeholder="you@example.com"
                  value={ email }
                  onChange={ ( e ) => setEmail( e.target.value ) }
                  required
                  autoComplete="email"
                  disabled={ submitting }
                />
              </Motion.div>

              <button
                type="submit"
                className="alloy-button w-full justify-center"
                disabled={ submitting }
                style={ { opacity: submitting ? 0.75 : 1, transition: 'opacity 0.2s', marginTop: '8px' } }
              >
                { submitting ? <BreathingLoader /> : 'Send Reset Link' }
              </button>
            </form>

            <div style={ { marginTop: '24px' } }>
              <Link
                to="/login"
                style={ {
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '8px',
                  fontSize:       '0.875rem',
                  fontWeight:     600,
                  color:          '#2563eb',
                  textDecoration: 'none',
                } }
              >
                <ArrowLeft size={ 14 } />
                Back to sign in
              </Link>
            </div>
          </>
        ) }
      </Motion.div>
    </div>
  );
}
