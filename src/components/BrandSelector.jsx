import '../styles/brand-selector.css';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';

const brandLogos = {
  'TapeTech': tapeTechLogo,
  'Columbia Taping Tools': columbiaLogo,
  'SurPro': surproLogo,
  'Asgard': asgardLogo,
  'Graco': gracoLogo
};

export default function BrandSelector({ brands, onSelectBrand }) {
  return (
    <div className="brand-selector">
      <div className="brand-selector-header">
        <h2>SELECT YOUR BRAND</h2>
        <p className="brand-selector-subtitle">Choose a brand to view tool schematics and parts</p>
      </div>

      <div className="brands-grid">
        {brands.map((brand) => (
          <button
            key={brand}
            className="brand-card"
            onClick={() => onSelectBrand(brand)}
          >
            <div className="brand-card-content">
              <div className="brand-logo-placeholder">
                {brandLogos[brand] ? (
                  <img 
                    src={brandLogos[brand]} 
                    alt={`${brand} logo`}
                    className="brand-logo-image"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }}
                  />
                ) : (
                  <svg
                    className="placeholder-icon"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>
              <h3 className="brand-name">{brand}</h3>
            </div>
            <div className="brand-card-background" />
          </button>
        ))}
      </div>
    </div>
  );
}
