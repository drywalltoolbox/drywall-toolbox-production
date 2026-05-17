import { motion as Motion, AnimatePresence } from 'framer-motion';
import ProductDetail from './ProductDetail.jsx';
import { useCatalogProductDetail } from '../../hooks/useCatalogProductDetail.js';
import {
  toLegacyProductCardDTO,
  toLegacyVariationDTO,
} from '../../utils/catalogDtoAdapters.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

const optimisticShellTransition = { duration: 0.24, ease: [0.16, 1, 0.3, 1] };

function getOptimisticImage(product) {
  return (
    product?.image ||
    product?.cardProduct?.image ||
    product?.media?.image ||
    product?.images?.[0]?.src ||
    product?.images?.[0] ||
    ''
  );
}

function ProductDetailOptimisticShell({ product }) {
  const image = getOptimisticImage(product);

  return (
    <Motion.div
      className="dtb-product-detail-loading-shell bg-white w-full max-w-6xl mx-auto overflow-hidden"
      initial={{ opacity: 0.96 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={optimisticShellTransition}
    >
      <div className="dtb-product-detail-loading-shell__media">
        {image ? (
          <img
            src={image}
            alt={product?.name || 'Product'}
            className="dtb-product-detail-loading-shell__image"
            loading="eager"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="dtb-product-detail-loading-shell__body" aria-hidden="true">
        <div className="dtb-product-detail-loading-shell__line dtb-product-detail-loading-shell__line--title" />
        <div className="dtb-product-detail-loading-shell__line dtb-product-detail-loading-shell__line--meta" />
        <div className="dtb-product-detail-loading-shell__line dtb-product-detail-loading-shell__line--price" />
        <div className="dtb-product-detail-loading-shell__cta" />
      </div>
      <style>{`
        .dtb-product-detail-loading-shell {
          min-height: min(82dvh, 760px);
          border-radius: 26px 26px 0 0;
        }
        .dtb-product-detail-loading-shell__media {
          margin: 28px 28px 0;
          aspect-ratio: 1 / 1;
          max-height: 42dvh;
          border-radius: 22px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid rgba(226, 232, 240, 0.86);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .dtb-product-detail-loading-shell__image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 16px;
        }
        .dtb-product-detail-loading-shell__body {
          display: grid;
          gap: 14px;
          padding: 26px 28px 36px;
        }
        .dtb-product-detail-loading-shell__line,
        .dtb-product-detail-loading-shell__cta {
          border-radius: 999px;
          background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f8fafc);
          background-size: 180% 100%;
          animation: dtbProductDetailShellPulse 1.1s ease-in-out infinite;
        }
        .dtb-product-detail-loading-shell__line--title { width: 82%; height: 26px; }
        .dtb-product-detail-loading-shell__line--meta { width: 56%; height: 16px; }
        .dtb-product-detail-loading-shell__line--price { width: 34%; height: 34px; margin-top: 4px; }
        .dtb-product-detail-loading-shell__cta { width: 100%; height: 54px; border-radius: 16px; margin-top: 8px; }
        @keyframes dtbProductDetailShellPulse {
          0%, 100% { background-position: 0% 50%; opacity: 0.72; }
          50% { background-position: 100% 50%; opacity: 1; }
        }
        @media (min-width: 769px) {
          .dtb-product-detail-loading-shell {
            min-height: 620px;
            border-radius: 26px;
          }
        }
      `}</style>
    </Motion.div>
  );
}

export default function ProductDetailPlatform({
  product,
  onAddToCart,
  onClose,
  onNavigateToProduct,
  initialSelectedAttrs = {},
  initialVariations = [],
  initialResolvedVariation = null,
}) {
  const slug = product?.slug || '';
  const {
    product: detailProduct,
    variations,
    computed,
    status,
  } = useCatalogProductDetail(slug);

  const fallbackProduct = product ? toLegacyProductCardDTO(product) : null;
  const resolvedProduct = detailProduct || fallbackProduct;

  const resolvedVariations =
    Array.isArray(variations) && variations.length > 0
      ? variations
      : (Array.isArray(initialVariations)
        ? initialVariations.map((variation) => toLegacyVariationDTO(variation, product || null))
        : []);

  const endpointDefaultVariation = computed?.defaultVariation || null;
  const initialDefaultVariation = initialResolvedVariation
    ? toLegacyVariationDTO(initialResolvedVariation, product || null)
    : null;
  const resolvedDefaultVariation = endpointDefaultVariation || initialDefaultVariation || null;

  const resolvedSelectedAttrs = Object.keys(initialSelectedAttrs || {}).length > 0
    ? initialSelectedAttrs
    : (resolvedDefaultVariation ? getVariationSelectionMap(resolvedDefaultVariation) : {});

  const shouldShowOptimisticShell = status === 'loading' && resolvedVariations.length === 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {shouldShowOptimisticShell ? (
        <ProductDetailOptimisticShell key={`optimistic-${product?.id || slug}`} product={fallbackProduct || product} />
      ) : (
        <Motion.div
          key={`detail-${resolvedProduct?.id || slug}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={optimisticShellTransition}
        >
          <ProductDetail
            product={resolvedProduct}
            onAddToCart={onAddToCart}
            onClose={onClose}
            onNavigateToProduct={onNavigateToProduct}
            initialVariations={resolvedVariations}
            initialResolvedVariation={resolvedDefaultVariation}
            initialSelectedAttrs={resolvedSelectedAttrs}
            initialComputedData={computed}
            disableLegacyDetailFetch
            autoSelectDefaultVariation
          />
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
