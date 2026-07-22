import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, Ticket, UserRound } from 'lucide-react';

import { useAuthContext } from '../auth/AuthContext.js';
import { dtbDuration, dtbEase } from '../motion/dtbMotion.js';
import '../styles/auth-form-templates.css';

const STRENGTH_META = [
  { label: 'Too short', color: '#dc2626' },
  { label: 'Weak', color: '#ea580c' },
  { label: 'Fair', color: '#ca8a04' },
  { label: 'Strong', color: '#16a34a' },
  { label: 'Very strong', color: '#15803d' },
];

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

function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

function safeReturnTarget(location) {
  const stateReturn = typeof location.state?.returnTo === 'string' ? location.state.returnTo : '';
  const params = new URLSearchParams(location.search || '');
  const queryReturn = params.get('returnTo') || params.get('return_to') || '';
  const candidate = stateReturn || queryReturn || '/dashboard';

  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/dashboard';
  if (candidate.startsWith('/login') || candidate.startsWith('/register')) return '/dashboard';
  return candidate;
}

function SubmitLoader() {
  return (
    <span className="dtb-auth-template__loader" aria-label="Creating account">
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

function FloatingField({ id, label, icon, action, className = '', ...inputProps }) {
  return (
    <div className={`dtb-floating-field${className ? ` ${className}` : ''}`}>
      <span className="dtb-auth-field__icon" aria-hidden="true">{icon}</span>
      <input
        id={id}
        className={`dtb-auth-field__input has-icon${action ? ' has-action' : ''}`}
        placeholder=" "
        {...inputProps}
      />
      <label className="dtb-floating-field__label" htmlFor={id}>{label}</label>
      {action}
    </div>
  );
}

function PasswordStrength({ password }) {
  const score = useMemo(() => scorePassword(password), [password]);
  if (!password) return null;
  const meta = STRENGTH_META[score];

  return (
    <Motion.div
      className="dtb-auth-template__password-meta"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: dtbDuration.fast }}
    >
      <div className="dtb-auth-template__strength-track" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className="dtb-auth-template__strength-segment"
            style={{ backgroundColor: score >= segment ? meta.color : undefined }}
          />
        ))}
      </div>
      <p className="dtb-auth-template__strength-label" style={{ color: meta.color }}>
        Password strength: {meta.label}
      </p>
    </Motion.div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading } = useAuthContext();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordScore = useMemo(() => scorePassword(password), [password]);
  const confirmationMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const returnTarget = useMemo(() => safeReturnTarget(location), [location]);
  const busy = submitting || isLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    if (passwordScore < 2) {
      setSubmitError('Choose a stronger password with at least eight characters and a mix of letters, numbers, or symbols.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
      navigate(returnTarget, { replace: true });
    } catch (error) {
      setSubmitError(error?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordAction = (
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
  );

  const confirmationAction = (
    <button
      className="dtb-auth-field__action"
      type="button"
      onClick={() => setShowConfirmation((visible) => !visible)}
      aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}
      aria-pressed={showConfirmation}
      disabled={busy}
    >
      {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <main className="page-wrapper dtb-auth-template dtb-auth-template--register">
      <Motion.section
        className="dtb-auth-template__card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        aria-labelledby="signup-title"
      >
        <header className="dtb-auth-template__header">
          <h1 id="signup-title" className="dtb-auth-template__title">Create an account</h1>
          <p className="dtb-auth-template__subtitle">Enter your details below to create your account</p>
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
          <div className="dtb-auth-template__name-grid">
            <FloatingField
              id="signup-first-name"
              label="First name"
              icon={<UserRound size={16} />}
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              disabled={busy}
              required
            />
            <FloatingField
              id="signup-last-name"
              label="Last name"
              icon={<UserRound size={16} />}
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              disabled={busy}
              required
            />
          </div>

          <FloatingField
            id="signup-email"
            label="Email"
            icon={<Mail size={16} />}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            disabled={busy}
            required
          />

          <div>
            <FloatingField
              id="signup-password"
              label="Password"
              icon={<LockKeyhole size={16} />}
              action={passwordAction}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={busy}
              required
            />
            <AnimatePresence>{password ? <PasswordStrength password={password} /> : null}</AnimatePresence>
          </div>

          <div>
            <FloatingField
              id="signup-confirm-password"
              label="Confirm password"
              icon={<LockKeyhole size={16} />}
              action={confirmationAction}
              type={showConfirmation ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={confirmationMismatch}
              aria-describedby={confirmationMismatch ? 'signup-confirm-message' : undefined}
              disabled={busy}
              required
            />
            <AnimatePresence initial={false}>
              {confirmationMismatch ? (
                <Motion.p
                  id="signup-confirm-message"
                  className="dtb-auth-template__field-message"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  Passwords don&apos;t match
                </Motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <FloatingField
            id="signup-referral"
            label="Referral code (optional)"
            icon={<Ticket size={16} />}
            type="text"
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={busy}
          />

          <button className="dtb-auth-template__submit" type="submit" disabled={busy}>
            {busy ? <SubmitLoader /> : 'Create Account'}
          </button>
        </form>

        <p className="dtb-auth-template__legal">
          By creating an account you agree to our terms of service and privacy policy.
        </p>

        <footer className="dtb-auth-template__footer">
          <p>
            Already have an account?{' '}
            <Link className="dtb-auth-template__link" to="/login" state={{ returnTo: returnTarget }}>
              Sign in
            </Link>
          </p>
        </footer>
      </Motion.section>
    </main>
  );
}
