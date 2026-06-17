import { useMemo } from 'react';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';
import platinumLogo from '/brands/Platinum/platinum_logo.svg';
import duraStiltsLogo from '/brands/Dura-Stilts/dura-stilts-logo.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import { sortBrandsBy } from '../../utils/catalogUrlState.js';
import './products-selector.css';

const PRODUCT_BRAND_LOGOS = {
  TapeTech: tapeTechLogo,
  'Columbia Taping Tools': columbiaLogo,
  'Columbia Tools': columbiaLogo,
  Columbia: columbiaLogo,
  SurPro: surproLogo,
  Asgard: asgardLogo,
  Graco: gracoLogo,
  'Platinum Drywall Tools': platinumLogo,
  Platinum: platinumLogo,
  'Dura-Stilts': duraStiltsLogo,
  Level5: level5Logo,
  'Level 5': level5Logo,
};

const LAUNCH_BRAND_FALLBACKS = [
  { key: 'tapetech', label: 'TapeTech', slug: 'tapetech' },
  { key: 'columbia-tools', label: 'Columbia Tools', slug: 'columbia-tools' },
  { key: 'level5', label: 'Level 5', slug: 'level5' },
  { key: 'surpro', label: 'SurPro', slug: 'surpro' },
  { key: 'dura-stilts', label: 'Dura-Stilts', slug: 'dura-stilts' },
  { key: 'platinum-drywall-tools', label: 'Platinum Drywall Tools', slug: 'platinum-drywall-tools' },
  { key: 'asgard', label: 'Asgard', slug: 'asgard' },
  { key: 'graco', label: 'Graco', slug: 'graco' },
];

function resolveLogo(brand) {
  return brand.logo || PRODUCT_BRAND_LOGOS[brand.label] || PRODUCT_BRAND_LOGOS[brand.key] || '';
}

function normalizeBrandList(brands = []) {
  const source = Array.isArray(brands) && brands.length > 0 ? brands : LAUNCH_BRAND_FALLBACKS;
  return source
    .map((brand) => {
      const label = brand.label || brand.name || brand.key || '';
      const slug = brand.slug || brand.key || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        ...brand,
        label,
        slug,
        key: brand.key || slug,
        logo: resolveLogo({ ...brand, label, key: brand.key || slug }),
      };
    })
    .filter((brand) => brand.label && brand.slug);
}

export default function ProductsBrandSelector({ brands, onSelectBrand }) {
  const sortedBrands = useMemo(() => sortBrandsBy(normalizeBrandList(brands), 'label'), [brands]);

  return (
    <div className="products-brand-selector">
      <h1 className="products-brand-selector__title">Brands</h1>
      <div className="products-brand-grid">
        {sortedBrands.map((brand) => {
          const label = brand.label || brand.key || '';
          const logo = resolveLogo(brand);
          return (
            <button
              key={brand.slug || brand.key || label}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="products-brand-card"
            >
              <span className="products-brand-card__logo-frame">
                {logo ? (
                  <img
                    src={logo}
                    alt={`${label} logo`}
                    className="products-brand-card__logo"
                  />
                ) : (
                  <span className="products-brand-card__fallback-label">{label}</span>
                )}
              </span>
              <span className="products-brand-card__name">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
