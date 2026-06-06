import { ChevronRight } from 'lucide-react';
import BackButton from '../shared/BackButton';
import './products-selector.css';

/**
 * Brand+category image overrides.
 * Keyed by brand slug → category key/slug → image URL.
 * Used when the API returns a non-representative image for a category card.
 */
const CATEGORY_IMAGE_OVERRIDES = {
  'platinum-drywall-tools': {
    // Show a flat box handle — not the mini box handle — for this category card
    'handles': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/platinum_pt_bh34_01.webp',
    'handles-extensions': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/platinum_pt_bh34_01.webp',
  },
};

function toBrandSlug(brandLabel = '') {
  return brandLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveCategoryImage(brand, category) {
  const slug = toBrandSlug(brand);
  const catKey = (category.key || category.slug || '').toLowerCase();
  return CATEGORY_IMAGE_OVERRIDES[slug]?.[catKey] || category.image || '';
}

export default function ProductsCategorySelector({
  brand,
  brandLogo,
  categories,
  onSelectCategory,
  onBack,
}) {
  return (
    <div className="product-selector">
      <div className="product-selector-header">
        <BackButton onClick={onBack} label="Brands" className="dtb-product-nav-back" />
        <div className="product-selector-header-content">
          {brandLogo && (
            <img
              src={brandLogo}
              alt={`${brand} logo`}
              className="product-brand-header-logo"
            />
          )}
        </div>
      </div>

      <div className="product-categories-grid">
        {categories.map((category, index) => {
          const cardImage = resolveCategoryImage(brand, category);
          return (
            <button
              key={category.key || category.slug || category.name}
              type="button"
              className={`product-category-card${cardImage ? '' : ' product-category-card--no-image'}`}
              style={{ animationDelay: `${(index + 1) * 0.07}s` }}
              onClick={() => onSelectCategory(category)}
            >
              {cardImage && <img src={cardImage} alt={category.name} className="product-category-card__image" />}
              <div className="product-category-card__scrim" />
              <div className="product-category-card__content">
                <div className="product-category-card__text">
                  <h3 className="product-category-card__name">{category.name}</h3>
                  <span className="product-category-card__count">{category.count} product{category.count !== 1 ? 's' : ''}</span>
                </div>
                <ChevronRight className="product-category-card__chevron" size={18} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
