import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Reviews from './Reviews';
import TechnicalSpecifications from './TechnicalSpecifications';
import { useCart } from '../../context/CartContext';
import { Heart, Plus, Minus, X, ShoppingCart, CheckCircle2, PackageCheck } from 'lucide-react';
import ProductImageGallery from './ProductImageGallery';
import { getProductSpecifications } from '../../utils/productSpecifications';
import { getProductVariations } from '../../services/api';
import { findMatchingVariation, getVariationSelectionMap } from '../../utils/variationSelection';
import { setCachedVariations } from '../../utils/variationCache';
import { apiClient } from '../../api/client.js';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';
import level5Logo from '/brands/Level5/Level5.svg';
import { getSchematicIdForProduct, buildSchematicsUrl } from '../../data/schematicMappings';

const BRAND_LOGOS = {
  'Columbia Taping Tools': columbiaLogo,
  'TapeTech': tapeTechLogo,
  'SurPro': surproLogo,
  'Asgard': asgardLogo,
  'Graco': gracoLogo,
  'Level 5': level5Logo,
};

function buildSeedVariations(initialVariations = [], initialResolvedVariation = null) {
  const seeded = [];
  const seen = new Set();

  const pushVariation = (variation) => {
    if (!variation?.id || seen.has(variation.id)) return;
    seen.add(variation.id);
    seeded.push(variation);
  };

  pushVariation(initialResolvedVariation);
  (Array.isArray(initialVariations) ? initialVariations : []).forEach(pushVariation);

  return seeded;
}

function money(value) {
  const parsed = typeof value === 'number' ? value : parseFloat(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function attributeLabel(attr) {
  return (attr?.name || '').replace(/^pa_/i, '').replace(/[_-]+/g, ' ').trim();
}

function getVariantStatus(variation) {
  if (!variation) return 'unavailable';
  return variation.stock_status === 'outofstock' ? 'sold-out' : 'available';
}

function buildInitialVariationSelection({ autoSelectDefaultVariation, initialSelectedAttrs, seededVariations }) {
  if (Object.keys(initialSelectedAttrs || {}).length > 0) return initialSelectedAttrs;
  if (!autoSelectDefaultVariation) return {};
  return getVariationSelectionMap(seededVariations.find((v) => v.stock_status !== 'outofstock') || seededVariations[0] || {});
}

function getSelectedVariationLabel(selectedVariation, selectedAttrs, variationAttributes) {
  const selectedValues = variationAttributes
    .map((attr) => selectedAttrs?.[attr.name])
    .filter((value) => value != null && `${value}`.trim() !== '')
    .map((value) => `${value}`.trim());

  if (selectedValues.length > 0) return selectedValues.join(' / ');

  const attrValues = getVariationSelectionMap(selectedVariation);
  const variationValues = Object.values(attrValues)
    .filter((value) => value != null && `${value}`.trim() !== '')
    .map((value) => `${value}`.trim());

  if (variationValues.length > 0) return variationValues.join(' / ');

  return '';
}

function normalizeNameToken(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\b(inches|inch|in)\b/g, '')
    .replace(/["']/g, '')
    .replace(/-/g, '.')
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/\.0+$/g, '')
    .trim();
}

function shouldComposeVariationName(parentProduct, selectedVariation, selectedLabel) {
  if (!selectedVariation || !parentProduct?.name || !selectedLabel) return false;

  const rawName = `${selectedVariation.name || ''}`.trim();
  if (!rawName) return true;

  const normalizedRaw = normalizeNameToken(rawName);
  const normalizedLabel = normalizeNameToken(selectedLabel);
  const normalizedParent = normalizeNameToken(parentProduct.name);

  if (normalizedRaw === normalizedLabel) return true;
  if (/^\d+(?:\.\d+)?$/.test(normalizedRaw)) return true;
  if (normalizedParent && !normalizedRaw.includes(normalizedParent)) return true;

  return false;
}

function composeEffectiveVariationProduct(parentProduct, selectedVariation, selectedLabel) {
  if (!selectedVariation) return parentProduct;

  const name = shouldComposeVariationName(parentProduct, selectedVariation, selectedLabel)
    ? `${parentProduct.name} - ${selectedLabel}`
    : (selectedVariation.name || parentProduct.name);

  return {
    ...selectedVariation,
    brand: selectedVariation.brand || parentProduct.brand,
    description: selectedVariation.description || parentProduct.description,
    description_full: selectedVariation.description_full || parentProduct.description_full,
    short_description: selectedVariation.short_description || parentProduct.short_description,
    images: Array.isArray(selectedVariation.images) && selectedVariation.images.length > 0
      ? selectedVariation.images
      : parentProduct.images,
    image: selectedVariation.image || parentProduct.image,
    name,
  };
}

export default function ProductDetail({
  product,
  onAddToCart,
  onClose,
  initialSelectedAttrs = {},
  initialVariations = [],
  initialResolvedVariation = null,
  disableLegacyDetailFetch = false,
  initialComputedData = null,
  autoSelectDefaultVariation = true,
}) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const seededVariations = buildSeedVariations(initialVariations, initialResolvedVariation);
  const initialVariationSelection = buildInitialVariationSelection({
    autoSelectDefaultVariation,
    initialSelectedAttrs,
    seededVariations,
  });

  const [variations, setVariations]             = useState(seededVariations);
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [selectedAttrs, setSelectedAttrs]       = useState(initialVariationSelection);
  const [computedData, setComputedData]         = useState(initialComputedData);

  const hasInitialVariations = Array.isArray(initialVariations) && initialVariations.length > 0;

  useEffect(() => {
    if (!product?.is_variable || !product.id) return;

    let mounted = true;
    const currentSeeded = seededVariations;
    const currentInitialAttrs = initialSelectedAttrs;

    Promise.resolve().then(() => {
      if (!mounted) return;
      setComputedData(initialComputedData);
      setVariations(currentSeeded);
      setSelectedAttrs(buildInitialVariationSelection({
        autoSelectDefaultVariation,
        initialSelectedAttrs: currentInitialAttrs,
        seededVariations: currentSeeded,
      }));
      setVariationsLoading(!hasInitialVariations && !disableLegacyDetailFetch);
    });

    if (disableLegacyDetailFetch && hasInitialVariations) {
      return () => { mounted = false; };
    }

    const applyVariations = (vars) => {
      if (!mounted || !Array.isArray(vars) || vars.length === 0) return false;
      setVariations(vars);
      if (Object.keys(currentInitialAttrs || {}).length > 0) {
        setSelectedAttrs(currentInitialAttrs);
      } else if (autoSelectDefaultVariation) {
        const firstInStock = vars.find((v) => v.stock_status !== 'outofstock') || vars[0];
        setSelectedAttrs(getVariationSelectionMap(firstInStock));
      } else {
        setSelectedAttrs({});
      }
      return true;
    };

    Promise.resolve()
      .then(async () => {
        if (!mounted) return;

        if (product.slug) {
          try {
            const data = await apiClient(
              `/wp-json/dtb/v1/catalog/products/${encodeURIComponent(product.slug)}/detail`
            );
            if (!mounted) return;
            if (data?.computed) setComputedData(data.computed);
            const detailVars = Array.isArray(data?.variations) && data.variations.length > 0
              ? data.variations
              : null;
            if (detailVars) {
              setCachedVariations(product.id, detailVars);
              applyVariations(detailVars);
              return;
            }
          } catch {
            if (!mounted) return;
          }
        }

        if (product.slug && !disableLegacyDetailFetch) {
          try {
            const data = await apiClient(
              `/wp-json/drywall/v1/products/slug/${encodeURIComponent(product.slug)}/detail`
            );
            if (!mounted) return;
            if (data?.computed) setComputedData(data.computed);
            const detailVars = Array.isArray(data?.variations) && data.variations.length > 0
              ? data.variations
              : null;
            if (detailVars) {
              setCachedVariations(product.id, detailVars);
              applyVariations(detailVars);
              return;
            }
          } catch {
            if (!mounted) return;
          }
        }

        try {
          const vars = await getProductVariations(product.id);
          if (!mounted || !Array.isArray(vars) || vars.length === 0) return;
          setCachedVariations(product.id, vars);
          applyVariations(vars);
        } catch {
          /* variations not critical — fail silently */
        }
      })
      .finally(() => { if (mounted) setVariationsLoading(false); });

    return () => { mounted = false; };
  }, [product?.id, product?.slug, product?.is_variable, hasInitialVariations]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedVariation = useMemo(
    () => product?.is_variable ? findMatchingVariation(variations, selectedAttrs) : null,
    [product?.is_variable, variations, selectedAttrs]
  );

  const variationAttributes = useMemo(
    () => Array.isArray(product?.variation_attributes)
      ? product.variation_attributes.filter((attr) =>
          attr?.name && attr.name.toLowerCase() !== 'brand' && Array.isArray(attr.options) && attr.options.length > 0
        )
      : [],
    [product]
  );

  const variantOptionMeta = useMemo(() => {
    const meta = {};
    const matrix = computedData?.available_option_matrix ?? {};

    variationAttributes.forEach((attr) => {
      const name = attr.name;
      const options = Array.isArray(attr.options) ? attr.options : [];
      const attrMatrix = matrix[name] ?? {};
      const lowerMatrix = Object.entries(attrMatrix).reduce((acc, [key, value]) => {
        acc[String(key).toLowerCase()] = value;
        return acc;
      }, {});

      meta[name] = options.map((option) => {
        const matrixEntry = attrMatrix[option] ?? lowerMatrix[String(option).toLowerCase()];

        if (matrixEntry) {
          const matchedVariation = variations.find((v) => v.id === matrixEntry.variation_id) || null;
          const status = !matrixEntry.purchasable
            ? 'unavailable'
            : matrixEntry.stock_status === 'outofstock' ? 'sold-out' : 'available';
          return {
            value: option,
            variation: matchedVariation,
            status,
            price: matchedVariation?.price ?? null,
          };
        }

        const candidateSelection = { ...selectedAttrs, [name]: option };
        const exact = findMatchingVariation(variations, candidateSelection);
        const fallback = exact || variations.find((variation) => {
          const map = getVariationSelectionMap(variation);
          return Object.entries(map).some(([attrName, attrValue]) =>
            attrName.toLowerCase() === name.toLowerCase() && `${attrValue}` === `${option}`
          );
        });
        return {
          value: option,
          variation: fallback || null,
          status: getVariantStatus(fallback),
          price: fallback?.price ?? null,
        };
      });
    });
    return meta;
  }, [variationAttributes, variations, selectedAttrs, computedData]);

  useEffect(() => {
    if (!product || !onClose) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [product, onClose]);

  if (!product) return null;

  const stripSpecsFromHtml = (html) => {
    if (!html || typeof html !== 'string') return html;

    return html
      .replace(/<p[^>]*>\s*<(?:strong|b)[^>]*>Specifications?:?<\/\s*(?:strong|b)>\s*<\/p>\s*/gi, '')
      .replace(/<p[^>]*>(?:\s*\|[^<]*)+<\/p>/gi, '')
      .replace(/<table[^>]*>([\s\S]*?)(?:Specification|Detail|DETAIL|SPECIFICATION)([\s\S]*?)<\/table>/gi, '');
  };

  const schematicId = getSchematicIdForProduct(product);
  const partsUrl = schematicId ? buildSchematicsUrl(schematicId) : null;
  const selectedVariationLabel = getSelectedVariationLabel(selectedVariation, selectedAttrs, variationAttributes);

  const effectiveProduct = selectedVariation
    ? composeEffectiveVariationProduct(product, selectedVariation, selectedVariationLabel)
    : product;
  const effectiveSku   = effectiveProduct.sku || product.sku || '';
  const effectiveStock = effectiveProduct.stock_status || product.stock_status || 'instock';
  const isOutOfStock   = effectiveStock === 'outofstock';
  const needsVariation = product.is_variable && variationAttributes.length > 0;
  const hasCompleteSelection = !needsVariation || variationAttributes.every((attr) => selectedAttrs?.[attr.name]);
  const canAddToCart = !isOutOfStock && (!needsVariation || Boolean(selectedVariation && hasCompleteSelection));

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    const productToAdd = selectedVariation ? effectiveProduct : product;
    if (onAddToCart) {
      onAddToCart(productToAdd, quantity);
    } else {
      addToCart(productToAdd, quantity);
    }
    try {
      if (typeof onClose === 'function') {
        setTimeout(() => onClose(), 220);
      }
    } catch {
      // ignore
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const rawPrice = selectedVariation
    ? (selectedVariation.price || 0)
    : (product.is_variable && product.min_price != null ? product.min_price : (product.price || 0));
  const displayPrice = money(rawPrice);
  const pricePrefix = product.is_variable && !selectedVariation ? 'From $' : '$';
  const compareAt = selectedVariation?.regular_price || product.regular_price;
  const productSpecifications = getProductSpecifications(product);

  const brandLogoClassName = [
    'product-detail-brand-logo',
    product.brand === 'Columbia Taping Tools' ? 'product-detail-brand-logo--columbia' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl mx-auto flex flex-col relative"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close product detail"
          title="Close"
        >
          <X size={20} className="text-gray-600 hover:text-gray-900" />
        </button>
      )}

      <div className="overflow-x-hidden">
        <div className="p-4 sm:p-6 md:p-8 lg:p-12 max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            <ProductImageGallery product={effectiveProduct} />

            <div className="flex flex-col">
              <div className="product-detail-meta-row flex items-center flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 text-white text-xs font-semibold rounded ${
                  isOutOfStock ? 'bg-red-500' : 'bg-black'
                }`}>
                  {isOutOfStock ? <PackageCheck size={13} aria-hidden="true" /> : <CheckCircle2 size={13} aria-hidden="true" />}
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </span>
                {product.brand && BRAND_LOGOS[product.brand] ? (
                  <img
                    src={BRAND_LOGOS[product.brand]}
                    alt={product.brand}
                    className={brandLogoClassName}
                  />
                ) : product.brand ? (
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500">{product.brand}</span>
                ) : null}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 leading-tight pr-10">
                {(effectiveProduct.name || product.name) || product.sku || product.part_number}
              </h2>

              <div className="mb-3 sm:mb-4 space-y-1 text-xs sm:text-sm text-gray-500">
                {effectiveSku && (
                  <div>
                    <span className="font-medium text-gray-400 mr-1">SKU:</span>
                    <span className="font-mono">{effectiveSku}</span>
                  </div>
                )}
                {product.upc && (
                  <div>
                    <span className="font-medium text-gray-400 mr-1">UPC:</span>
                    <span className="font-mono">{product.upc}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-0.5 mb-5 sm:mb-6 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                aria-label="View reviews, 0 out of 5 stars, no reviews yet"
              >
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 group-hover:text-yellow-400 transition-colors" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </button>

              <hr className="border-gray-100 mb-4 sm:mb-5" />

              <div className="mb-4 sm:mb-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {pricePrefix}{displayPrice}
                  </span>
                  {compareAt && parseFloat(compareAt) > parseFloat(rawPrice || 0) && (
                    <span className="text-base sm:text-lg text-gray-400 line-through">
                      ${money(compareAt)}
                    </span>
                  )}
                </div>
              </div>
