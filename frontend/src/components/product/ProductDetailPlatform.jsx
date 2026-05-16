import { motion as Motion, AnimatePresence } from 'framer-motion';
import ProductDetail from './ProductDetail.jsx';
import { useCatalogProductDetail } from '../../hooks/useCatalogProductDetail.js';
import {
  toLegacyProductCardDTO,
  toLegacyVariationDTO,
} from '../../utils/catalogDtoAdapters.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

const optimisticShellTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

function formatPrice(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '$0.00';
  return `$${numeric.toFixed(2)}`;
}

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

function getOptimisticPrice(product) {
  return (
    product?.price ??
    product?.cardProduct?.price ??
    product?.min_price ??
    product?.price?.current ??
    product?.price?.value ??
    0
  );
}

function ProductDetailOptimisticShell({ product }) {
  const image = getOptimisticImage(product);
  const brand = product?.brand || product?.brandLabel || product?.brand?.label || '';
  const sku = product?.sku || product?.cardProduct?.sku || '';
  const price = getOptimisticPrice(product);

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
          <div className="mt-4 flex gap-2">
            <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-100 animate-pulse" />
            <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-100 animate-pulse" />
            <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-100 animate-pulse" />
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
          {brand && (
            <div className="text-xs font-extrabold tracking-[0.2em] text-blue-600 uppercase mb-3">
              {brand}
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {product?.name || 'Loading product'}
          </h2>
          {sku && (
            <p className="mt-3 text-sm sm:text-base text-gray-400 font-mono tracking-widest uppercase">
              SKU: {sku}
            </p>
          )}
          <div className="h-px bg-gray-100 my-6" />
          <div className="text-4xl sm:text-5xl font-extrabold text-gray-950 tracking-tight">
            {formatPrice(price)}
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="mt-8 h-14 rounded-2xl bg-blue-100 animate-pulse" />
        </div>
      </div>
    </Motion.div>
  );
}

function VariationEndpointError({ diagnostics, error, onClose }) {
  const hasDiagnostics = diagnostics && typeof diagnostics === 'object';

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Product variations unavailable</h2>
      <p className="text-sm text-gray-600 mb-4">
        The canonical catalog detail endpoint did not return attached variation rows for this variable product.
        This usually means WooCommerce did not create child variation rows, did not attach them to the parent,
        or did not import <code className="font-mono">_dtb_parent_product_sku</code> on detached children.
      </p>

      {hasDiagnostics && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
          <div className="font-semibold text-gray-900 mb-2">Variation read diagnostics</div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <dt>Source</dt><dd className="font-mono">{diagnostics.source || 'none'}</dd>
            <dt>Parent SKU</dt><dd className="font-mono">{diagnostics.parentSku || '—'}</dd>
            <dt>Direct children</dt><dd className="font-mono">{diagnostics.directChildCount ?? 0}</dd>
            <dt>REST children</dt><dd className="font-mono">{diagnostics.restChildCount ?? 0}</dd>
            <dt>Parent-SKU meta matches</dt><dd className="font-mono">{diagnostics.parentSkuMetaMatchCount ?? 0}</dd>
            <dt>Normalized</dt><dd className="font-mono">{diagnostics.normalizedCount ?? 0}</dd>
          </dl>
        </div>
      )}

      {error && <p className="text-xs text-gray-500 mb-4">{String(error)}</p>}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
      >
        Close
      </button>
    </div>
  );
}

export default function ProductDetailPlatform({
  product,
  onAddToCart,
  onClose,
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
    error,
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

  if (product?.is_variable && resolvedVariations.length === 0) {
    return (
      <VariationEndpointError
        diagnostics={computed?.variationDiagnostics}
        error={error}
        onClose={onClose}
      />
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