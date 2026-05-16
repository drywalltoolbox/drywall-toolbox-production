import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';
import platinumLogo from '/brands/Platinum/platinum_logo.svg';
import duraStiltsLogo from '/brands/Dura-Stilts/dura-stilts-logo.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import SearchBar from './SearchBar';
import './products-selector.css';

const PRODUCT_BRAND_LOGOS = {
  TapeTech: tapeTechLogo,
  'Columbia Taping Tools': columbiaLogo,
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

function resolveLogo(brand) {
  return brand.logo || PRODUCT_BRAND_LOGOS[brand.label] || PRODUCT_BRAND_LOGOS[brand.key] || '';
}

export default function ProductsBrandSelector({ brands, searchQuery = '', onSearchChange, onSelectBrand }) {
  return (
    <div>
      <SearchBar
        placeholder="Search products by brand, category, or product name..."
        value={searchQuery}
        onChange={onSearchChange}
      />
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {brands.map((brand) => {
          const label = brand.label || brand.key || '';
          const logo = resolveLogo(brand);
          return (
            <button
              key={brand.slug || brand.key || label}
              onClick={() => onSelectBrand(brand)}
              className="product-brand-selector-card"
            >
              {logo ? (
                <img
                  src={logo}
                  alt={`${label} logo`}
                  className={`product-brand-selector-card__logo ${['Columbia Taping Tools', 'Columbia', 'Graco'].includes(label) ? 'product-brand-selector-card__logo--large' : ''}`}
                />
              ) : (
                <span className="product-brand-selector-card__fallback-label">{label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
