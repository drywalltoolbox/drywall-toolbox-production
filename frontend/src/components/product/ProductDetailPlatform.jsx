import ProductDetail from './ProductDetail.jsx';
import { useCatalogProductDetail } from '../../hooks/useCatalogProductDetail.js';
import {
  toLegacyProductCardDTO,
  toLegacyVariationDTO,
} from '../../utils/catalogDtoAdapters.js';
import { getVariationSelectionMap } from '../../utils/variationSelection.js';

function VariationEndpointError({ error, onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Product variations unavailable</h2>
      <p className="text-sm text-gray-600 mb-4">
        The canonical catalog detail endpoint did not return attached variation rows for this variable product.
        This usually means the WooCommerce import did not attach child variations to the parent SKU.
      </p>
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

  if (status === 'loading' && resolvedVariations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (product?.is_variable && resolvedVariations.length === 0) {
    return <VariationEndpointError error={error} onClose={onClose} />;
  }

  return (
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
  );
}
