import { motion as Motion, AnimatePresence } from 'framer-motion';
import ProductDetail from './ProductDetail.jsx';
import { useCatalogProductDetail } from '../../hooks/useCatalogProductDetail.js';
import {
  toLegacyProductCardDTO,
  toLegacyVariationDTO,
} from '../../utils/catalogDtoAdapters.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

const optimisticShellTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

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
      className="bg-white w-full max-w-6xl mx-auto overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={optimisticShellTransition}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={product?.name || 'Product'}
                className="w-full h-full object-contain p-4"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
            )}
          </div>
        </div>
      </div>
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

  if (shouldShowOptimisticShell) {
    return (
      <AnimatePresence mode="wait">
        <ProductDetailOptimisticShell key={`optimistic-${product?.id || slug}`} product={fallbackProduct || product} />
      </AnimatePresence>
    );
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
  );
}
