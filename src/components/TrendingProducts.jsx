import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { loadProducts } from '../data/products';
import { filterProductsWithSchematics } from '../data/schematicMappings';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Toast from './Toast';

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const scrollContainerRef = useRef(null);
  const { addToCart } = useCart();

  const showToast = (message, type = 'cart') => {
    setToast({ message, type });
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
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
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(37, 99, 235, 0.3) transparent'
          }}
          className="trending-scroll-container"
        >
          {products.map((product) => (
            <Link
              key={product.sku}
              to={`/product/${product.sku}`}
              style={{ textDecoration: 'none', minWidth: '280px' }}
            >
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--machined-border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%'
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
                  justifyContent: 'center'
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
                <div style={{ padding: '16px' }}>
                  {/* Brand */}
                  <div style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(15,23,42,0.5)',
                    marginBottom: '6px',
                    fontWeight: 600
                  }}>
                    {product.brand}
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'black',
                    margin: '0 0 8px 0',
                    lineHeight: 1.3,
                    minHeight: '36px'
                  }}>
                    {product.name}
                  </h3>

                  {/* Description */}
                  {product.short_description && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(15,23,42,0.6)',
                      margin: '0 0 12px 0',
                      lineHeight: 1.4,
                      minHeight: '30px'
                    }}>
                      {product.short_description.substring(0, 60)}...
                    </p>
                  )}

                  {/* Footer with Price and Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--primary-600)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      style={{
                        background: 'var(--primary-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-700)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--primary-600)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <ShoppingCart size={14} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </Link>
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
    </section>
  );
}
