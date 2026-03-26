import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { loadProducts } from '../data/products';
import { filterProductsWithSchematics } from '../data/schematicMappings';
import { ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Toast from './Toast';
import ProductDetail from './ProductDetail';

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const { addToCart } = useCart();

  const showToast = (message, type = 'cart') => {
    setToast({ message, type });
  };

  const openModal = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
    showToast(`${product.name} added to cart!`, 'cart');
  };

  useEffect(() => {
    let mounted = true;
    loadProducts().then((loadedProducts) => {
      if (!mounted) return;
      // Get Columbia products that have schematics in Parts
      // These are all tools/products we have detailed interactive schematics for
      const trendingWithSchematics = filterProductsWithSchematics(
        loadedProducts,
        'Columbia Taping Tools'
      ).filter(p => p.price);
      
      // Sort by price descending (premium products first) for a more "curated" feel
      trendingWithSchematics.sort((a, b) => (b.price || 0) - (a.price || 0));
      
      // Take top 12 or all if less available
      const trending = trendingWithSchematics.slice(0, 12);
      setProducts(trending);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section style={{
        padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 5vw, 2.5rem)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading products...</div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section style={{
      padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 5vw, 2.5rem)',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          fontWeight: 700,
          color: 'rgba(15,23,42,0.4)',
          margin: '0 0 16px 0'
        }}>
          Trending Now
        </p>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 800,
          color: 'var(--primary-600)',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Top Products
        </h2>
      </div>

      {/* Scrollable Container */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(37, 99, 235, 0.3) transparent',
            alignItems: 'stretch'
          }}
          className="trending-scroll-container"
        >
          {products.map((product) => (
            <div
              key={product.sku}
              onClick={() => openModal(product)}
              style={{ textDecoration: 'none', minWidth: '280px', maxWidth: '280px', display: 'flex', flexShrink: 0, cursor: 'pointer' }}
            >
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--machined-border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '440px',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: '#f8fafc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                </div>

                {/* Product Info */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {/* Brand */}
                  <div style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(15,23,42,0.5)',
                    marginBottom: '3px',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {product.brand}
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'black',
                    margin: '0 0 8px 0',
                    lineHeight: 1.2,
                    height: '36px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    flexShrink: 0
                  }}>
                    {product.name}
                  </h3>

                  {/* SKU & UPC Info */}
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(15,23,42,0.6)',
                    margin: '0',
                    paddingBottom: '6px',
                    lineHeight: 1.4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    {product.sku && (
                      <div style={{ fontFamily: 'monospace', color: 'rgba(15,23,42,0.7)' }}>
                        <span style={{ fontWeight: 600 }}>SKU:</span> {product.sku}
                      </div>
                    )}
                    {product.upc && (
                      <div style={{ fontFamily: 'monospace', color: 'rgba(15,23,42,0.7)' }}>
                        <span style={{ fontWeight: 600 }}>UPC:</span> {product.upc}
                      </div>
                    )}
                  </div>

                  {/* Footer with Price only */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--primary-600)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Controls - Desktop Only */}
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-60px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'white',
            border: '1px solid var(--machined-border)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-600)';
            e.currentTarget.style.borderColor = 'var(--primary-600)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'var(--machined-border)';
            e.currentTarget.style.color = 'black';
          }}
          aria-label="Scroll left"
          className="scroll-button-left"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-60px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'white',
            border: '1px solid var(--machined-border)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-600)';
            e.currentTarget.style.borderColor = 'var(--primary-600)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'var(--machined-border)';
            e.currentTarget.style.color = 'black';
          }}
          aria-label="Scroll right"
          className="scroll-button-right"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <style>{`
        .trending-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .trending-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .trending-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(37, 99, 235, 0.3);
          border-radius: 3px;
        }
        .trending-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.5);
        }

        @media (max-width: 640px) {
          .scroll-button-left,
          .scroll-button-right {
            display: none !important;
          }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Product Detail Modal - Matches Products.jsx exactly */}
      {isModalOpen && modalProduct && (
        <div className="fixed inset-0 z-1100 flex items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          {/* Close Button - Direct child of fixed modal wrapper to avoid stacking context issues */}
          <button
            onClick={closeModal}
            className="fixed top-4 right-4 sm:absolute sm:top-4 sm:right-4 z-1120 p-2.5 sm:p-2 bg-white rounded-full shadow-xl hover:bg-gray-100 transition-colors border border-gray-200"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <div className="relative z-10 w-full h-full sm:h-auto max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto">
            <div onClick={(e) => e.stopPropagation()} className="h-full overflow-x-hidden">
              <ProductDetail product={modalProduct} onAddToCart={handleAddToCart} onClose={closeModal} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
