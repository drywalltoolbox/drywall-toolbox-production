/**
 * frontend/src/pages/ReturnPolicy.jsx
 *
 * Customer-facing return policy page.
 */

import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import '../styles/store-policies.css';

const QUICK_FACTS = [
  { Icon: Clock3, label: '45 days', text: 'Return eligible items within 45 days of invoice date.' },
  { Icon: CheckCircle2, label: 'No restocking fee', text: 'Standard returns are not punished with a restocking fee.' },
  { Icon: PackageCheck, label: 'Like-new condition', text: 'Items must be unused, complete, and in original packaging.' },
];

const RETURN_STEPS = [
  {
    title: 'Start your request',
    text: 'Use the Return Portal or email info@drywalltoolbox.com with your order number.',
  },
  {
    title: 'Wait for your RMA',
    text: 'We send your RMA number and return instructions by email, usually within 1 business day.',
  },
  {
    title: 'Pack and ship',
    text: 'Pack the item securely and write the RMA number clearly on the outside of the box.',
  },
];

const SHIPPING_RULES = [
  { label: 'Damaged, defective, wrong item, or covered warranty claim', value: 'Drywall Toolbox provides a prepaid label.' },
  { label: 'Ordered wrong item, changed mind, or no longer needed', value: 'Customer pays return shipping.' },
];

const NOT_RETURNABLE = [
  'Used tools showing wear, compound residue, damage, or missing parts.',
  'Closeout, final-sale, outlet, discontinued, or specially priced items.',
  'Special-order or direct-ship items marked non-returnable on the product page.',
  'Partially used consumables such as sandpaper, tape, abrasives, or case quantities.',
  'Returns shipped without an approved RMA number.',
];

const RELATED_POLICIES = [
  {
    Icon: ShieldCheck,
    title: 'Warranty support',
    text: 'Manufacturer warranties still apply. Contact us first and we will help route the claim.',
  },
  {
    Icon: AlertCircle,
    title: 'Damaged delivery',
    text: 'Tell us within 72 hours and keep the packaging so we can file a carrier claim.',
  },
  {
    Icon: CreditCard,
    title: 'Refund timing',
    text: 'Approved refunds go back to the original payment method within 3-5 business days.',
  },
];

function PolicyPill({ children }) {
  return <span className="store-policy-pill">{children}</span>;
}

function QuickFactCard({ Icon, label, text }) {
  return (
    <article className="store-policy-fact">
      <span className="store-policy-fact__icon"><Icon size={20} /></span>
      <div>
        <strong>{label}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}

function StepCard({ step, title, text }) {
  return (
    <article className="store-policy-step">
      <span>{step}</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </article>
  );
}

function RelatedPolicyCard({ Icon, title, text }) {
  return (
    <article className="store-policy-related-card">
      <Icon size={20} />
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

export default function ReturnPolicy() {
  return (
    <div className="store-policy-page">
      <SEOHead
        title="Return Policy"
        description="Drywall Toolbox return policy: 45-day returns, no restocking fee on standard returns, RMA instructions, refund timing, and warranty support."
        canonical="https://drywalltoolbox.com/return-policy"
      />

      <section className="store-policy-hero">
        <div className="store-policy-hero__copy">
          <PolicyPill>Returns made straightforward</PolicyPill>
          <h1>Return Policy</h1>
          <p>
            We want the right tools in your hands. If something is wrong, damaged,
            or simply not the right fit, start here and we will help you get it handled.
          </p>
          <div className="store-policy-hero__actions">
            <Link to="/returns" className="store-policy-button store-policy-button--primary">
              Start a return <ArrowRight size={16} />
            </Link>
            <a href="mailto:info@drywalltoolbox.com" className="store-policy-button store-policy-button--secondary">
              <Mail size={16} /> Email returns
            </a>
          </div>
        </div>

        <aside className="store-policy-hero__panel" aria-label="Return policy highlights">
          {QUICK_FACTS.map((fact) => <QuickFactCard key={fact.label} {...fact} />)}
        </aside>
      </section>

      <main className="store-policy-content">
        <section className="store-policy-section store-policy-section--intro">
          <div>
            <PolicyPill>Standard returns</PolicyPill>
            <h2>45-day return window. No standard restocking fee.</h2>
          </div>
          <p>
            Returns are accepted within 45 days of invoice date. Items must be
            unused, in like-new condition, and include original packaging,
            accessories, documentation, warranty cards, and your receipt or order
            confirmation.
          </p>
        </section>

        <section className="store-policy-section">
          <div className="store-policy-section__header">
            <PolicyPill>How it works</PolicyPill>
            <h2>Three steps to start a return</h2>
          </div>
          <div className="store-policy-steps">
            {RETURN_STEPS.map((item, index) => (
              <StepCard key={item.title} step={index + 1} {...item} />
            ))}
          </div>
          <div className="store-policy-alert">
            <AlertCircle size={18} />
            <p>
              Do not ship returns directly to a manufacturer or without an RMA.
              Returns without a valid RMA may be refused or delayed.
            </p>
          </div>
        </section>

        <section className="store-policy-grid">
          <article className="store-policy-card">
            <Truck size={22} />
            <h2>Return shipping</h2>
            <div className="store-policy-rule-list">
              {SHIPPING_RULES.map((rule) => (
                <div key={rule.label} className="store-policy-rule">
                  <span>{rule.label}</span>
                  <strong>{rule.value}</strong>
                </div>
              ))}
            </div>
            <p>
              Use a trackable shipping service for returns over $75. We are not
              responsible for items lost or damaged in transit when return shipping
              is the customer's responsibility.
            </p>
          </article>

          <article className="store-policy-card">
            <CreditCard size={22} />
            <h2>Refunds</h2>
            <p>
              Once your return is received and inspected, we email confirmation
              within 1 business day. Approved refunds are issued to the original
              payment method within 3-5 business days.
            </p>
            <p>
              Original outbound shipping charges are non-refundable. If an order
              shipped under a free-shipping promotion, the actual outbound shipping
              cost may be deducted from the refund.
            </p>
          </article>
        </section>

        <section className="store-policy-section store-policy-section--split">
          <div>
            <PolicyPill>Before you ship</PolicyPill>
            <h2>Items that cannot be returned</h2>
            <p>
              These limits keep return handling fair and keep used or incomplete
              products out of contractor orders.
            </p>
          </div>
          <ul className="store-policy-checklist">
            {NOT_RETURNABLE.map((item) => (
              <li key={item}>
                <AlertCircle size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="store-policy-related">
          <div className="store-policy-section__header">
            <PolicyPill>Good to know</PolicyPill>
            <h2>Related policy details</h2>
          </div>
          <div className="store-policy-related-grid">
            {RELATED_POLICIES.map((item) => <RelatedPolicyCard key={item.title} {...item} />)}
          </div>
        </section>

        <section className="store-policy-footer-cta">
          <RotateCcw size={24} />
          <div>
            <h2>Need help with a return?</h2>
            <p>
              Start online or email our support team. Include your order number,
              photos if the item arrived damaged, and a short description of what
              happened.
            </p>
          </div>
          <Link to="/returns" className="store-policy-button store-policy-button--primary">
            Open Return Portal <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
}
