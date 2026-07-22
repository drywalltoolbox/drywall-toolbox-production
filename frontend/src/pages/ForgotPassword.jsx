import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

import { useAuthContext } from '../auth/AuthContext.js';
import { dtbDuration, dtbEase } from '../motion/dtbMotion.js';
import '../styles/auth-form-templates.css';

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
};

const noticeVariants = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: dtbDuration.fast } },
};

function SubmitLoader() {
  return (
    <span className="dtb-auth-template__loader" aria-label="Sending reset link">
      {[0, 1, 2].map((index) => (
        <Motion.span
          key={index}
          className="dtb-auth-template__loader-dot"
          animate={{ scale: [1, 1.45, 1], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.05, repeat: Infinity, delay: index * 0.17, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

export default function ForgotPassword() {
  const { forgotPassword } = useAuthContext();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-wrapper dtb-auth-template dtb-auth-template--recovery">
      <Motion.section
        className="dtb-auth-template__card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="recover-password-title"
      >
        <header className="dtb-auth-template__header">
          <h1 id="recover-password-title" className="dtb-auth-template__title">Recover Password</h1>
          <p className="dtb-auth-template__subtitle">Enter your email to receive a reset link</p>
        </header>

        {sent ? (
          <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="dtb-auth-template__success" role="status">
              <CheckCircle size={18} />
              <div>
                <strong>Check your inbox</strong>
                <p>
                  If <b>{email}</b> is registered, a secure password reset link is on its way.
                </p>
              </div>
            </div>
            <footer className="dtb-auth-template__footer dtb-auth-template__footer--bordered">
              <p>
                Return to{' '}
                <Link className="dtb-auth-template__link" to="/login">sign in</Link>
              </p>
            </footer>
          </Motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {submitError ? (
                <Motion.div
                  className="dtb-auth-template__error"
                  variants={noticeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="alert"
                >
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </Motion.div>
              ) : null}
            </AnimatePresence>

            <form className="dtb-auth-template__form" onSubmit={handleSubmit}>
              <div className="dtb-auth-field">
                <label className="dtb-auth-field__label" htmlFor="recovery-email">Email Address</label>
                <div className="dtb-auth-field__control">
                  <span className="dtb-auth-field__icon" aria-hidden="true"><Mail size={17} /></span>
                  <input
                    id="recovery-email"
                    className="dtb-auth-field__input has-icon"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    inputMode="email"
                    aria-label="Email address for password recovery"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <button className="dtb-auth-template__submit" type="submit" disabled={submitting}>
                {submitting ? <SubmitLoader /> : 'Send Reset Link'}
              </button>
            </form>

            <p className="dtb-auth-template__recovery-note">
              We&apos;ll send you a secure link to reset your password.
            </p>

            <footer className="dtb-auth-template__footer dtb-auth-template__footer--bordered">
              <p>
                Remembered your password?{' '}
                <Link className="dtb-auth-template__link" to="/login">Log in</Link>
              </p>
            </footer>
          </>
        )}
      </Motion.section>
    </main>
  );
}
