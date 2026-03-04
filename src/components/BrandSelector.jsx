import { useState } from 'react';
import '../styles/brand-selector.css';

export default function BrandSelector({ brands, onSelectBrand }) {
  const [hoveredBrand, setHoveredBrand] = useState(null);

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
            onMouseEnter={() => setHoveredBrand(brand)}
            onMouseLeave={() => setHoveredBrand(null)}
          >
            <div className="brand-card-content">
              <div className="brand-logo-placeholder">
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
