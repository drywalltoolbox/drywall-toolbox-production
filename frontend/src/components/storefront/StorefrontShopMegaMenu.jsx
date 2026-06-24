import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  PackageSearch,
  ShieldCheck,
  Tags,
  Wrench,
} from 'lucide-react';
import '../../styles/storefront-shop-mega-menu.css';

const FALLBACK_CATEGORIES = [
  { slug: 'automatic-tapers', to: '/products?category=automatic-tapers', label: 'Automatic Tapers' },
  { slug: 'flat-boxes', to: '/products?category=flat-boxes', label: 'Flat Boxes' },
  { slug: 'corner-finishers', to: '/products?category=corner-finishers', label: 'Corner Finishers' },
  { slug: 'handles', to: '/products?category=handles', label: 'Handles' },
  { slug: 'pumps-and-tubes', to: '/products?category=pumps-and-tubes', label: 'Pumps & Tubes' },
  { slug: 'tool-sets', to: '/products?category=tool-sets', label: 'Tool Sets' },
];

const SYSTEM_LINKS = [
  { to: '/products?category=automatic-tapers', label: 'Automatic Tapers', badge: 'Core' },
  { to: '/products?category=flat-boxes', label: 'Flat Boxes' },
  { to: '/products?category=corner-finishers', label: 'Corner Finishers' },
  { to: '/products?category=compound-tubes', label: 'Compound Tubes' },
  { to: '/products?category=pumps', label: 'Pumps' },
  { to: '/products?category=stilts', label: 'Drywall Stilts' },
];

const SERVICE_LINKS = [
  { to: '/parts', label: 'Replacement Parts', badge: 'Parts' },
  { to: '/schematics', label: 'Schematics Lookup' },
  { to: '/repairs', label: 'Repair Services' },
  { to: '/returns', label: 'Returns Portal' },
  { to: '/contact', label: 'Contact Support' },
];

function MegaColumn({ title, children }) {
  return (
    <section className="storefront-shop-mega__column" aria-label={title}>
      <h3 className="storefront-shop-mega__column-title">{title}</h3>
      {children}
    </section>
  );
}

function MegaTextLink({ to, label, badge, onNavigate }) {
  return (
    <Link to={to} className="storefront-shop-mega__text-link" onClick={onNavigate}>
      <span>{label}</span>
      {badge ? <span className="storefront-shop-mega__badge">{badge}</span> : null}
    </Link>
  );
}

function RailLink({ to, title, subtitle, Icon, onNavigate }) {
  return (
    <Link to={to} className="storefront-shop-mega__rail-link" onClick={onNavigate}>
      <span className="storefront-shop-mega__rail-icon"><Icon size={18} /></span>
      <span className="storefront-shop-mega__rail-copy">
        <span className="storefront-shop-mega__rail-title">{title}</span>
        <span className="storefront-shop-mega__rail-subtitle">{subtitle}</span>
      </span>
      <ChevronRight size={16} className="storefront-shop-mega__rail-chevron" />
    </Link>
  );
}

export default function StorefrontShopMegaMenu({
  isOpen,
  isActive,
  onOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
  categoryLinks,
  brandLinks,
}) {
  const triggerRef = useRef(null);
  const panelId = useId();
  const triggerId = useId();
  const categories = (Array.isArray(categoryLinks) && categoryLinks.length > 0 ? categoryLinks : FALLBACK_CATEGORIES).slice(0, 8);
  const brands = Array.isArray(brandLinks) ? brandLinks.slice(0, 6) : [];

  const closeAndFocusTrigger = () => {
    onClose();
    triggerRef.current?.focus();
  };

  const handlePanelKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeAndFocusTrigger();
  };

  const wrapperClassName = ['header-mega', 'storefront-shop-mega', isOpen ? 'is-open' : ''].filter(Boolean).join(' ');
  const panelClassName = ['storefront-shop-mega__panel', isOpen ? 'is-open' : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        ref={triggerRef}
        id={triggerId}
        className={`nav-link header-nav-trigger storefront-shop-mega__trigger ${isActive ? 'active' : ''}`}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          closeAndFocusTrigger();
        }}
      >
        <span>Shop</span>
        <ChevronDown size={14} className="header-nav-trigger__chevron" />
      </button>

      <div
        id={panelId}
        className={panelClassName}
        role="region"
        aria-labelledby={triggerId}
        onKeyDown={handlePanelKeyDown}
      >
        <div className="storefront-shop-mega__topline" />
        <div className="storefront-shop-mega__shell">
          <aside className="storefront-shop-mega__rail" aria-label="Shop shortcuts">
            <RailLink to="/products" title="All Products" subtitle="Complete professional finishing catalog" Icon={PackageSearch} onNavigate={onNavigate} />
            <RailLink to="/products/brands" title="Shop by Brand" subtitle="TapeTech, Columbia, LEVEL5, SurPro" Icon={Tags} onNavigate={onNavigate} />
            <RailLink to="/parts" title="Parts Library" subtitle="Repair parts, wear items, schematics" Icon={Boxes} onNavigate={onNavigate} />
            <RailLink to="/schematics" title="Schematics" subtitle="Model diagrams and part lookup" Icon={BookOpen} onNavigate={onNavigate} />
            <RailLink to="/repairs" title="Repair Services" subtitle="Send tools in for service or quotes" Icon={Wrench} onNavigate={onNavigate} />
          </aside>

          <div className="storefront-shop-mega__content">
            <MegaColumn title="Categories">
              <div className="storefront-shop-mega__link-list">
                {categories.map(({ slug, to, label }, index) => (
                  <MegaTextLink key={slug || to || label} to={to} label={label} badge={index < 2 ? 'Popular' : ''} onNavigate={onNavigate} />
                ))}
              </div>
            </MegaColumn>

            <MegaColumn title="Brands">
              <div className="storefront-shop-mega__link-list">
                {brands.length > 0 ? brands.map(({ slug, to, name }, index) => (
                  <MegaTextLink key={slug} to={to} label={name} badge={index === 0 ? 'Featured' : ''} onNavigate={onNavigate} />
                )) : (
                  <MegaTextLink to="/products/brands" label="Browse All Brands" onNavigate={onNavigate} />
                )}
              </div>
            </MegaColumn>

            <MegaColumn title="Tool Systems">
              <div className="storefront-shop-mega__link-list">
                {SYSTEM_LINKS.map((item) => (
                  <MegaTextLink key={item.to} {...item} onNavigate={onNavigate} />
                ))}
              </div>
            </MegaColumn>

            <MegaColumn title="Service & Support">
              <div className="storefront-shop-mega__link-list">
                {SERVICE_LINKS.map((item) => (
                  <MegaTextLink key={item.to} {...item} onNavigate={onNavigate} />
                ))}
              </div>
            </MegaColumn>
          </div>
        </div>

        <div className="storefront-shop-mega__footer">
          <div className="storefront-shop-mega__footer-note">
            <ShieldCheck size={16} /> Built for professional drywall finishing tools, parts, schematics, and service workflows.
          </div>
          <div className="storefront-shop-mega__footer-actions">
            <Link to="/products" className="storefront-shop-mega__cta storefront-shop-mega__cta--primary" onClick={onNavigate}>View All Products</Link>
            <Link to="/repairs" className="storefront-shop-mega__cta storefront-shop-mega__cta--secondary" onClick={onNavigate}>Start a Repair</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
