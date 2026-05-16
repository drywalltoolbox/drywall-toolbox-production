import { Link } from 'react-router-dom';

export default function StorefrontBrandTile({ name, logo, to }) {
  const logoClassName = [
    'storefront-brand-tile__logo',
    ['Columbia Taping Tools', 'Columbia'].includes(name) ? 'storefront-brand-tile__logo--columbia' : '',
    ['Platinum Drywall Tools', 'Platinum'].includes(name) ? 'storefront-brand-tile__logo--platinum' : '',
  ].filter(Boolean).join(' ');

  return (
    <Link to={to} className="storefront-brand-tile" aria-label={`Shop ${name}`}>
      {logo ? (
        <span className="storefront-brand-tile__logo-wrap">
          <img
            src={logo}
            alt={name}
            className={logoClassName}
            loading="lazy"
          />
        </span>
      ) : null}
      <span className="storefront-brand-tile__name">{name}</span>
    </Link>
  );
}
