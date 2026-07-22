import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { brandToSlug } from '../../utils/catalogUrlState.js';
import { buildDisplayCategoryUrl, normalizeCatalogCategoryEntry } from '../../utils/catalogFacets.js';
import ProductModal from '../product/ProductModal.jsx';
import ProductDetail from '../product/ProductDetail.jsx';
import LoadingCardTransition from '../shared/LoadingCardTransition.jsx';
import StorefrontProductTile from './StorefrontProductTile.jsx';
import StorefrontSearchLoading from './StorefrontSearchLoading.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function StorefrontSearchOverlay({
  isOpen,
  query,
  setQuery,
  onClose,
  onViewAll,
  loading,
  recent = [],
  brands = [],
  categories = [],
  suggestions = [],
  results = [],
}) {
  const { addToCart } = useCart();
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const resolvedSuggestions = useMemo(() => {
    const primary = Array.isArray(suggestions) ? suggestions : [];
    if (primary.length > 0) return primary;
    return Array.isArray(results) ? results : [];
  }, [suggestions, results]);
  const hasLoadedResults = !loading && resolvedSuggestions.length > 0;
  const normalizedCategories = useMemo(
    () => categories
      .map((category) => normalizeCatalogCategoryEntry(category))
      .filter((category) => category.label && category.slug),
    [categories]
  );

  const closeQuickView = useCallback(() => {
    setIsModalOpen(false);
    setModalProduct(null);
  }, []);

  const closeSearch = useCallback(() => {
    closeQuickView();
    onClose?.();
  }, [closeQuickView, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isModalOpen) closeQuickView();
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, isModalOpen, closeQuickView]);

  const openQuickView = useCallback((product) => {
    if (!product?.id) return;
    setModalProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleAddToCart = useCallback(async (product, quantity = 1) => {
    await addToCart(product, quantity);
  }, [addToCart]);

  const searchSkeleton = (
    <section className="storefront-search-overlay__results" aria-hidden="true">
      <StorefrontSearchLoading />
    </section>
  );

  const searchResults = resolvedSuggestions.length > 0 ? (
    <section className="storefront-search-overlay__results storefront-search-overlay__results--product-cards">
      {resolvedSuggestions.map((product, index) => (
        <div className="storefront-search-overlay__result-entry" style={{ '--search-result-index': index }} key={product.id || product.slug || product.sku || index}>
          <StorefrontProductTile
            product={product}
            cardProduct={product?.cardProduct || null}
            variant="list"
            index={index}
            onOpenModal={() => openQuickView(product)}
            onAddToCart={() => handleAddToCart(product, 1)}
          />
        </div>
      ))}
    </section>
  ) : (
    <section className="storefront-search-overlay__results">
      <div className="storefront-search-overlay__empty-message">
        No products matched &quot;{query.trim()}&quot;. Try a brand, SKU, or broader term.
      </div>
    </section>
  );

  return (
    <>
      <div id="storefront-search-results" className="storefront-search-overlay" data-open={isOpen ? 'true' : 'false'} data-has-query={hasQuery ? 'true' : 'false'} role="dialog" aria-modal={isOpen ? 'true' : undefined} aria-hidden={!isOpen} aria-label="Search products">
        <button
          type="button"
          className="storefront-mobile-drawer__backdrop"
          onClick={(event) => {
            event.currentTarget.blur();
            closeSearch();
          }}
          aria-label="Close search"
        />
        <div className="storefront-search-overlay__sheet">
          <div className="storefront-search-overlay__panel" onClick={(event) => event.stopPropagation()}>
            {hasQuery ? (
              <div className="storefront-search-overlay__topline">
                <p className="storefront-search-overlay__panel-label">Search results</p>
              </div>
            ) : null}

            <div className={`storefront-search-overlay__body${hasQuery ? '' : ' is-browsing'}`}>
              {!hasQuery ? (
                <section className="storefront-search-overlay__empty-state">
                  {normalizedCategories.length > 0 ? (
                    <div className="storefront-search-overlay__section">
                      <h3 className="storefront-search-overlay__section-title">Popular categories</h3>
                      <div className="storefront-search-overlay__chip-list">
                        {normalizedCategories.map((category) => (
                          <Link key={category.slug} to={buildDisplayCategoryUrl(category.slug)} onClick={closeSearch} className="storefront-search-overlay__chip">
                            {category.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {brands.length > 0 ? (
                    <div className="storefront-search-overlay__section">
                      <h3 className="storefront-search-overlay__section-title">Popular brands</h3>
                      <div className="storefront-search-overlay__chip-list">
                        {brands.map((brand) => (
                          <Link key={brand} to={`/products/brands/${brandToSlug(brand)}`} onClick={closeSearch} className="storefront-search-overlay__chip">
                            {brand}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {recent.length > 0 ? (
                    <div className="storefront-search-overlay__section">
                      <h3 className="storefront-search-overlay__section-title">Recent searches</h3>
                      <div className="storefront-search-overlay__chip-list">
                        {recent.map((item) => (
                          <button key={item} type="button" onClick={() => setQuery(item)} className="storefront-search-overlay__chip" aria-label={`Search for ${item}`}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {hasQuery ? (
                <LoadingCardTransition
                  loading={loading}
                  skeleton={searchSkeleton}
                  label="Loading search results"
                  className="storefront-search-overlay__transition"
                >
                  {searchResults}
                </LoadingCardTransition>
              ) : null}
            </div>

            {hasQuery && hasLoadedResults ? (
              <div className="storefront-search-overlay__footer">
                <button type="button" onClick={onViewAll} className="storefront-search-overlay__view-all">
                  View all results for &quot;{query.trim()}&quot;
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ProductModal isOpen={isModalOpen && !!modalProduct} product={modalProduct} onClose={closeQuickView}>
        {modalProduct ? (
          <ProductDetail product={modalProduct} onAddToCart={handleAddToCart} onClose={closeQuickView} initialVariations={[]} />
        ) : null}
      </ProductModal>
    </>
  );
}
