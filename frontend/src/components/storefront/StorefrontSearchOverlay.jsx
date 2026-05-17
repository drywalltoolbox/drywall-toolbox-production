import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { brandToSlug } from '../../utils/catalogUrlState.js';
import { useCart } from '../../context/CartContext.jsx';
import ProductCardImage from '../product/ProductCardImage.jsx';

function formatPrice(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? `$${numeric.toFixed(2)}` : 'View product';
}

function getProductSku(product) {
  return product?.sku || product?.part_number || product?.mpn || product?.source_sku || '';
}

function getProductDescription(product) {
  const raw = product?.short_description || product?.shortDescription || product?.description || '';
  return String(raw).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function canAddProduct(product) {
  if (!product?.id) return false;
  if (product?.type === 'variable') return false;
  return product?.stock_status !== 'outofstock';
}

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
}) {
  const { addToCart } = useCart();
  const [addingProductId, setAddingProductId] = useState(null);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setAddingProductId(null);
  }, [isOpen]);

  const handleAddToCart = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canAddProduct(product) || addingProductId) return;

    setAddingProductId(product.id);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Search result add-to-cart error:', error);
    } finally {
      setAddingProductId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="storefront-search-overlay" data-open={isOpen ? 'true' : 'false'} role="dialog" aria-modal="true" aria-label="Search products">
      <button type="button" className="storefront-mobile-drawer__backdrop" onClick={onClose} aria-label="Close search" />
      <div className="storefront-search-overlay__sheet">
        <div className="storefront-search-overlay__panel">
          {hasQuery ? (
            <div className="storefront-search-overlay__topline">
              <p className="storefront-search-overlay__panel-label">Search results</p>
              <button type="button" className="storefront-search-overlay__view-all-inline" onClick={onViewAll}>
                View all results for "{query.trim()}"
              </button>
            </div>
          ) : null}

          <div className={`storefront-search-overlay__body${hasQuery ? '' : ' is-browsing'}`}>
            {!hasQuery ? (
              <section className="storefront-search-overlay__empty-state">
                {categories.length > 0 ? (
                  <div className="storefront-search-overlay__section">
                    <h3 className="storefront-search-overlay__section-title">Popular categories</h3>
                    <div className="storefront-search-overlay__chip-list">
                      {categories.map((category) => (
                        <Link
                          key={category}
                          to={`/products?display_category=${encodeURIComponent(category.toLowerCase().replace(/[^\w]+/g, '_'))}`}
                          onClick={onClose}
                          className="storefront-search-overlay__chip"
                        >
                          {category}
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
                        <Link
                          key={brand}
                          to={`/products/brands/${brandToSlug(brand)}`}
                          onClick={onClose}
                          className="storefront-search-overlay__chip"
                        >
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
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="storefront-search-overlay__chip"
                          aria-label={`Search for ${item}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {hasQuery ? (
              loading ? (
                <section className="storefront-search-overlay__results">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="storefront-search-overlay__skeleton-row">
                      <div className="storefront-search-overlay__skeleton-thumb storefront-skeleton" />
                      <div className="storefront-search-overlay__skeleton-copy">
                        <div className="storefront-skeleton" style={{ height: 10, width: '42%', borderRadius: 999 }} />
                        <div className="storefront-skeleton" style={{ height: 12, width: '78%', borderRadius: 999 }} />
                        <div className="storefront-skeleton" style={{ height: 11, width: '30%', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </section>
              ) : suggestions.length > 0 ? (
                <section className="storefront-search-overlay__results">
                  {suggestions.map((product) => {
                    const sku = getProductSku(product);
                    const description = getProductDescription(product);
                    const isAdding = addingProductId === product.id;
                    const addable = canAddProduct(product);
                    return (
                      <Link key={product.id} to={`/products/${product.slug || product.id}`} onClick={onClose} className="storefront-search-overlay__result">
                        <div className="storefront-search-overlay__result-thumb">
                          <ProductCardImage
                            product={product}
                            alt={product.name}
                            padding="8px"
                            fit="contain"
                            width={144}
                            height={144}
                            className="storefront-search-overlay__result-thumb-image"
                          />
                        </div>
                        <div className="storefront-search-overlay__result-copy">
                          <span className="storefront-search-overlay__result-brand">{product.brand || 'Product'}</span>
                          <strong className="storefront-search-overlay__result-name">{product.name}</strong>
                          {sku ? <span className="storefront-search-overlay__result-sku">SKU: {sku}</span> : null}
                          {description ? <span className="storefront-search-overlay__result-description">{description}</span> : null}
                          <div className="storefront-search-overlay__result-footer">
                            <span className="storefront-search-overlay__result-price">{formatPrice(product.price)}</span>
                            <button
                              type="button"
                              className="storefront-search-overlay__result-cart"
                              disabled={!addable || isAdding}
                              onClick={(event) => handleAddToCart(event, product)}
                              aria-label={`Add ${product.name} to cart`}
                            >
                              <ShoppingCart size={15} aria-hidden="true" />
                              <span>{isAdding ? 'Adding…' : addable ? 'Add' : 'View'}</span>
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <button type="button" onClick={onViewAll} className="storefront-search-overlay__view-all">
                    View all results
                  </button>
                </section>
              ) : (
                <section className="storefront-search-overlay__results">
                  <div className="storefront-search-overlay__empty-message">
                    No products matched "{query.trim()}". Try a brand, SKU, or broader term.
                  </div>
                  <button type="button" onClick={onViewAll} className="storefront-search-overlay__view-all">
                    Browse all products
                  </button>
                </section>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
