import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, UserRound } from 'lucide-react';

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

const errorVariants = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: dtbDuration.fast } },
};

function safeReturnTarget(location) {
  const from = location.state?.from;
  const fromPath = from?.pathname ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}` : '';
  const stateReturn = typeof location.state?.returnTo === 'string' ? location.state.returnTo : '';
  const params = new URLSearchParams(location.search || '');
  const queryReturn = params.get('returnTo') || params.get('return_to') || '';
  const candidate = fromPath || stateReturn || queryReturn || '/dashboard';

  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/dashboard';
  if (candidate.startsWith('/login') || candidate.startsWith('/register')) return '/dashboard';
  return candidate;
}

function SubmitLoader() {
  return (
    <span className="dtb-auth-template__loader" aria-label="Signing in">
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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const returnTarget = useMemo(() => safeReturnTarget(location), [location]);
  const busy = submitting || isLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(returnTarget, { replace: true });
    } catch (error) {
      setSubmitError(error?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-wrapper dtb-auth-template dtb-auth-template--login">
      <Motion.section
        className="dtb-auth-template__card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="signin-title"
      >
        <header className="dtb-auth-template__header">
          <span className="dtb-auth-template__icon" aria-hidden="true">
            <UserRound size={20} strokeWidth={1.9} />
          </span>
          <h1 id="signin-title" className="dtb-auth-template__title">Welcome back</h1>
          <p className="dtb-auth-template__subtitle">Enter your credentials to sign in</p>
        </header>

        <AnimatePresence initial={false}>
          {submitError ? (
            <Motion.div
              className="dtb-auth-template__error"
              variants={errorVariants}
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
            <label className="dtb-auth-field__label" htmlFor="signin-email">Email</label>
            <div className="dtb-auth-field__control">
              <input
                id="signin-email"
                className="dtb-auth-field__input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                inputMode="email"
                disabled={busy}
                required
              />
            </div>
          </div>

          <div className="dtb-auth-field">
            <label className="dtb-auth-field__label" htmlFor="signin-password">Password</label>
            <div className="dtb-auth-field__control">
              <input
                id="signin-password"
                className="dtb-auth-field__input has-action"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={busy}
                required
              />
              <button
                className="dtb-auth-field__action"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={busy}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button className="dtb-auth-template__submit" type="submit" disabled={busy}>
            {busy ? <SubmitLoader /> : 'Sign In'}
          </button>
        </form>

        <footer className="dtb-auth-template__footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link className="dtb-auth-template__link" to="/register" state={{ returnTo: returnTarget }}>
              Sign up
            </Link>
          </p>
          <Link className="dtb-auth-template__link" to="/forgot-password">
            Forgot your password?
          </Link>
        </footer>
      </Motion.section>
    </main>
  );
}
