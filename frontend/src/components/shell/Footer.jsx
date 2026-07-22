import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoWhite from '/logo-white.svg';
import '../../styles/storefront-footer-template.css';

const FOOTER_GROUPS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/products' },
      { label: 'Brands', to: '/products/brands' },
      { label: 'Parts', to: '/parts' },
      { label: 'New Arrivals', to: '/products?sort=newest' },
    ],
  },
  {
    title: 'Tools & Services',
    links: [
      { label: 'Repair Services', to: '/repairs' },
      { label: 'Repair Packages', to: '/repairs/packages' },
      { label: 'Schematics', to: '/schematics' },
      { label: 'Calculators', to: '/calculators' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', to: '/contact' },
      { label: 'Frequently Asked Questions', to: '/faq' },
      { label: 'Shipping', to: '/shipping-policy' },
      { label: 'Returns', to: '/returns' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Create Account', to: '/register' },
      { label: 'My Account', to: '/dashboard' },
      { label: 'Store Policies', to: '/policies' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/drywalltoolbox', Icon: Instagram },
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'Twitter / X', href: 'https://twitter.com', Icon: Twitter },
];

function FooterLinkGroup({ title, links }) {
  return (
    <section aria-labelledby={`footer-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
      <h2 id={`footer-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="dtb-footer-template__heading">
        {title}
      </h2>
      <ul className="dtb-footer-template__links">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link className="dtb-footer-template__link" to={to}>{label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer dtb-footer-template">
      <div className="dtb-footer-template__inner">
        <div className="dtb-footer-template__grid">
          <section className="dtb-footer-template__brand" aria-label="Drywall Toolbox">
            <Link to="/" aria-label="Drywall Toolbox home">
              <img className="dtb-footer-template__logo" src={LogoWhite} alt="Drywall Toolbox" />
            </Link>
            <p className="dtb-footer-template__summary">
              The New Standard in Drywall.
            </p>
            <Link className="dtb-footer-template__contact" to="/contact">Contact us</Link>
          </section>

          {FOOTER_GROUPS.map((group) => <FooterLinkGroup key={group.title} {...group} />)}
        </div>

        <div className="dtb-footer-template__bottom">
          <div>
            <p className="dtb-footer-template__copyright">© 2026 Drywall Toolbox. All rights reserved.</p>
            <nav className="dtb-footer-template__legal" aria-label="Legal">
              <Link className="dtb-footer-template__link" to="/policies">Privacy</Link>
              <Link className="dtb-footer-template__link" to="/policies">Terms</Link>
            </nav>
          </div>

          <div className="dtb-footer-template__socials" aria-label="Social media">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                className="dtb-footer-template__social"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
