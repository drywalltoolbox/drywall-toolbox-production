import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import BackButton from '../shared/BackButton';
import './products-selector.css';

/**
 * Brand+category image overrides.
 * Keyed by brand slug → category key/slug → image URL.
 * Used when the API returns a non-representative image for a category card.
 */
const CATEGORY_IMAGE_OVERRIDES = {
  'columbia-tools': {
    'automatic_tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_ptaper_01.webp',
    'automatic-tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_ptaper_01.webp',
    'corner_tools': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_cr_01.webp',
    'corner-tools': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_cr_01.webp',
    'finishing_boxes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_10ffba_01.webp',
    'finishing-boxes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_10ffba_01.webp',
    'handles': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_c1h_01.webp',
    'handles_extensions': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_c1h_01.webp',
    'handles-extensions': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_c1h_01.webp',
    'nail_spotters': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_3ns_01.webp',
    'nail-spotters': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_3ns_01.webp',
    'parts': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_taper_03.webp',
    'pumps': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_hmp_01.webp',
    'predator_family': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
    'predator-family': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
    'semi_automatic_tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sacs_01.webp',
    'semi-automatic-tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sacs_01.webp',
    'toolsets': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_ts_01.webp',
    'tool-sets-kits': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_ts_01.webp',
  },
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
  const normalizedCatKey = catKey.replace(/_/g, '-');
  const underscoredCatKey = catKey.replace(/-/g, '_');
  const overrides = CATEGORY_IMAGE_OVERRIDES[slug] || {};
  return overrides[catKey] || overrides[normalizedCatKey] || overrides[underscoredCatKey] || category.image || '';
}

function ProductCategoryCard({ brand, category, index, onSelectCategory }) {
  const resolvedImage = resolveCategoryImage(brand, category);
  const [failedImage, setFailedImage] = useState({ key: '', src: '' });
  const imageKey = `${toBrandSlug(brand)}:${category.key || category.slug || category.name}:${resolvedImage}`;
  const cardImage = failedImage.key === imageKey && failedImage.src === resolvedImage ? '' : resolvedImage;

  return (
    <button
      type="button"
      className={`product-category-card${cardImage ? '' : ' product-category-card--no-image'}`}
      style={{ animationDelay: `${(index + 1) * 0.07}s` }}
      onClick={() => onSelectCategory(category)}
    >
      {cardImage && (
        <img
          src={cardImage}
          alt={category.name}
          className="product-category-card__image"
          onError={() => setFailedImage({ key: imageKey, src: resolvedImage })}
        />
      )}
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
        {categories.map((category, index) => (
          <ProductCategoryCard
            key={category.key || category.slug || category.name}
            brand={brand}
            category={category}
            index={index}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </div>
    </div>
  );
}
