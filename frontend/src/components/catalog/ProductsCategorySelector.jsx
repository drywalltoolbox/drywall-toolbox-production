import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import BackButton from '../shared/BackButton';
import './products-selector.css';

const ALL_PRODUCTS_CATEGORY = {
  key: 'all-products',
  slug: 'all-products',
  name: 'All Products',
  isAllProducts: true,
};

/**
 * Brand+category image overrides.
 * Keyed by brand slug → category key/slug → image URL.
 * Used when the API returns a non-representative image for a category card.
 */
const CATEGORY_IMAGE_OVERRIDES = {
  tapetech: {
    'automatic_tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_07tt_04.webp',
    'automatic-tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_07tt_04.webp',
    'compound_tubes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ct42tt_01.webp',
    'compound-tubes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ct42tt_01.webp',
    'corner_tools': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ca08tt_01.webp',
    'corner-tools': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ca08tt_01.webp',
    'finishing_boxes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ez07tt_01.webp',
    'finishing-boxes': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ez07tt_01.webp',
    'handles': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'handles_extensions': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'handles-extensions': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_88tte_03.webp',
    'pumps': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_76ttca_01.webp',
    'nail_spotters': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ns03tt_02.webp',
    'nail-spotters': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/tapetech_ns03tt_02.webp',
  },
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
    'parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
    'replacement_parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
    'replacement-parts': 'https://cdn.shopify.com/s/files/1/0277/6678/4139/products/FA268_bd097418-98a3-491a-a1ab-f39a2cae3ba0.jpg?v=1764182531',
    'pumps': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_hmp_01.webp',
    'predator_family': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
    'predator-family': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_predator_family_01.webp',
    'semi_automatic_tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
    'semi-automatic-tapers': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
    'semi_automatic_taper': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
    'semi-automatic-taper': 'https://drywalltoolbox.com/wp-content/uploads/2026/media/columbia_tools_sat_01.webp',
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

const WORDPRESS_RESIZED_IMAGE_RE = /-\d+x\d+(?=\.(?:avif|jpe?g|png|webp)(?:[?#]|$))/i;
const SELECTOR_IMAGE_SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

function normalizePreviewImageUrl(src = '') {
  if (!src || src.startsWith('data:') || src.endsWith('.svg')) return src;
  return src.replace(WORDPRESS_RESIZED_IMAGE_RE, '');
}

function withUrlParam(src, key, value) {
  try {
    const url = new URL(src);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return src;
  }
}

function resolvePreviewImageMeta(src = '') {
  const normalizedSrc = normalizePreviewImageUrl(src);
  if (!normalizedSrc || normalizedSrc.endsWith('.svg')) {
    return { src: normalizedSrc, srcSet: undefined, sizes: undefined };
  }

  if (/cdn\.shopify\.com/i.test(normalizedSrc)) {
    return {
      src: withUrlParam(normalizedSrc, 'width', '960'),
      srcSet: [480, 720, 960, 1280]
        .map((width) => `${withUrlParam(normalizedSrc, 'width', String(width))} ${width}w`)
        .join(', '),
      sizes: SELECTOR_IMAGE_SIZES,
    };
  }

  return {
    src: normalizedSrc,
    srcSet: `${normalizedSrc} 1x, ${normalizedSrc} 2x`,
    sizes: SELECTOR_IMAGE_SIZES,
  };
}

function ProductCategoryCard({ brand, category, index, onSelectCategory }) {
  const resolvedImage = resolveCategoryImage(brand, category);
  const [failedImage, setFailedImage] = useState({ key: '', src: '' });
  const previewImage = resolvePreviewImageMeta(resolvedImage);
  const imageKey = `${toBrandSlug(brand)}:${category.key || category.slug || category.name}:${previewImage.src}`;
  const cardImage = failedImage.key === imageKey && failedImage.src === previewImage.src ? '' : previewImage.src;
  const isAllProducts = Boolean(category?.isAllProducts);
  const cardClassName = `product-category-card${cardImage ? '' : ' product-category-card--no-image'}${isAllProducts ? ' product-category-card--all-products' : ''}`;
  const imageClassName = `product-category-card__image${isAllProducts ? ' product-category-card__image--logo' : ''}`;

  return (
    <button
      type="button"
      className={cardClassName}
      style={{ animationDelay: `${(index + 1) * 0.07}s` }}
      onClick={() => onSelectCategory(category)}
    >
      {cardImage && (
        <img
          src={cardImage}
          srcSet={previewImage.srcSet}
          sizes={previewImage.sizes}
          alt={isAllProducts ? `${brand} logo` : category.name}
          className={imageClassName}
          width={640}
          height={427}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 4 ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedImage({ key: imageKey, src: previewImage.src })}
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
  const normalizedCategories = Array.isArray(categories) ? categories : [];
  const categoryProductCount = normalizedCategories.reduce((sum, category) => (
    sum + Number(category?.count || category?.productCount || 0)
  ), 0);
  const allProductsCard = {
    ...ALL_PRODUCTS_CATEGORY,
    count: categoryProductCount,
    image: brandLogo || '',
  };
  const displayCategories = [
    allProductsCard,
    ...normalizedCategories.filter((category) => !['all-products', 'all_products'].includes(String(category?.slug || category?.key || '').toLowerCase())),
  ];

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
        {displayCategories.map((category, index) => (
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
