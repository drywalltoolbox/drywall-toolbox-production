import { useState, useEffect, useCallback } from 'react';
import { fetchCatalogProducts } from '../../services/catalogPlatformCache.js';
import { toLegacyProductCardDTO } from '../../utils/catalogDtoAdapters.js';
import { useCart } from '../../context/CartContext';
import ProductDetail from '../product/ProductDetail';
import ProductModal from '../product/ProductModal';
import Toast from '../ui/Toast';
import LoadingCardTransition from '../shared/LoadingCardTransition.jsx';
import StorefrontRail from './StorefrontRail';
import StorefrontProductTile from './StorefrontProductTile';
import StorefrontSkeletons from './StorefrontSkeletons';
import { getVariationSelectionMap } from '../../utils/variationSelection';

/**
 * A horizontal product rail that fetches products from the catalog API.
 *
 * @param {{ category?: string, brand?: string, sort?: string, maxItems?: number, label?: string }} props
 */
export default function StorefrontProductRail({
  category,
  brand,
  sort,
  maxItems = 12,
  label = 'Products',
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalProduct(null);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  useEffect(() => {
    let mounted = true;

    const query = {
      perPage: maxItems,
      sort: sort || 'popular',
      ...(brand ? { brands: [brand] } : {}),
      ...(category ? { displayCategory: category } : {}),
    };

    fetchCatalogProducts(query).then((payload) => {
      if (!mounted) return;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setProducts(items.map(toLegacyProductCardDTO).filter(Boolean).slice(0, maxItems));
      setLoading(false);
    }).catch((err) => {
      console.error('StorefrontProductRail fetch error:', err);
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [category, brand, sort, maxItems]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
    } catch (err) {
      setToast({ message: err?.message || 'Could not add item to cart. Please try again.', type: 'error' });
      throw err;
    }
  };

  const openModal = (product, cardProduct = null) => {
    const initialResolvedVariation = cardProduct?.parent_id ? cardProduct : null;
    setModalProduct({
      product,
      initialResolvedVariation,
      initialSelectedAttrs: initialResolvedVariation
        ? getVariationSelectionMap(initialResolvedVariation)
        : {},
    });
    setIsModalOpen(true);
  };

  if (!loading && products.length === 0) return null;

  return (
    <>
      <LoadingCardTransition
        loading={loading}
        skeleton={<StorefrontSkeletons count={4} variant="rail" />}
        label={`Loading ${label.toLowerCase()}`}
      >
        <StorefrontRail label={label} className="storefront-rail--fixed-tiles">
          {products.map((product, index) => {
            const cardProduct = product.cardProduct || product;

            return (
              <StorefrontProductTile
                key={product.sku || product.id}
                product={product}
                cardProduct={cardProduct}
                variant="grid"
                onOpenModal={() => openModal(product, cardProduct)}
                onAddToCart={() => handleAddToCart(cardProduct)}
                index={index}
              />
            );
          })}
        </StorefrontRail>
      </LoadingCardTransition>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ProductModal isOpen={isModalOpen && !!modalProduct} product={modalProduct?.product || modalProduct} onClose={closeModal}>
        {modalProduct && (
          <ProductDetail
            key={`${modalProduct.product?.id || modalProduct.id}:${modalProduct.initialResolvedVariation?.id || 'parent'}`}
            product={modalProduct.product || modalProduct}
            onAddToCart={handleAddToCart}
            onClose={closeModal}
            initialVariations={[]}
            initialResolvedVariation={modalProduct.initialResolvedVariation}
            initialSelectedAttrs={modalProduct.initialSelectedAttrs}
          />
        )}
      </ProductModal>
    </>
  );
}
