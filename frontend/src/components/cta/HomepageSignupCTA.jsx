import { ChevronRight, UserPlus, X } from 'lucide-react';
import './HomepageSignupCTA.css';

export default function HomepageSignupCTA({ isOpen, onClose, onSignup }) {
  if (!isOpen) return null;

  return (
    <div className="homepage-signup-cta" role="dialog" aria-modal="true" aria-labelledby="homepage-signup-cta-title">
      <button
        type="button"
        className="homepage-signup-cta__backdrop"
        onClick={ onClose }
        aria-label="Close sign up prompt"
      />
      <section className="homepage-signup-cta__card-wrap">
        <button
          type="button"
          className="homepage-signup-cta__close"
          onClick={ onClose }
          aria-label="Close sign up prompt"
        >
          <X size={ 20 } strokeWidth={ 2.5 } />
        </button>
        <div className="homepage-signup-cta__card">
          <div className="homepage-signup-cta__glow" aria-hidden="true" />
          <div className="homepage-signup-cta__inner">
            <div className="homepage-signup-cta__eyebrow">
              <UserPlus size={ 14 } strokeWidth={ 2 } />
              <span>Contractor account tools</span>
            </div>
            <h2 id="homepage-signup-cta-title" className="homepage-signup-cta__headline">
              Track orders and save your tools
            </h2>
            <p className="homepage-signup-cta__body">
              Create your account for order tracking, saved products, repair requests, addresses, and contractor account tools.
            </p>
            <button
              type="button"
              className="homepage-signup-cta__button"
              onClick={ onSignup }
            >
              <span className="homepage-signup-cta__button-glow" aria-hidden="true" />
              <span className="homepage-signup-cta__button-content">
                Sign up
                <ChevronRight size={ 20 } strokeWidth={ 2.4 } />
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
