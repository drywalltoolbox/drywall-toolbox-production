import ProductDetail from './ProductDetail.jsx';
import { useCatalogProductDetail } from '../../hooks/useCatalogProductDetail.js';
import {
  toLegacyProductCardDTO,
  toLegacyVariationDTO,
} from '../../utils/catalogDtoAdapters.js';

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
  } = useCatalogProductDetail(slug);

  const fallbackProduct = product ? toLegacyProductCardDTO(product) : null;
  const resolvedProduct = detailProduct || fallbackProduct;

  const resolvedVariations =
    Array.isArray(variations) && variations.length > 0
      ? variations
      : (Array.isArray(initialVariations)
        ? initialVariations.map((variation) => toLegacyVariationDTO(variation, product || null))
        : []);

  const resolvedDefaultVariation =
    initialResolvedVariation ? toLegacyVariationDTO(initialResolvedVariation, product || null) : null;

  return (
    <ProductDetail
      product={resolvedProduct}
      onAddToCart={onAddToCart}
      onClose={onClose}
      initialVariations={resolvedVariations}
      initialResolvedVariation={resolvedDefaultVariation}
      initialSelectedAttrs={initialSelectedAttrs}
      initialComputedData={computed}
      disableLegacyDetailFetch={status === 'ready'}
      autoSelectDefaultVariation={false}
    />
  );
}
