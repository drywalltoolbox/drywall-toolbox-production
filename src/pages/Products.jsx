import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail';
import Toast from '../components/Toast';
import { X } from 'lucide-react';
import { loadProducts } from '../data/products';
import { useCart } from '../context/CartContext';
import { 
  ShoppingCart, 
  Filter, 
  SlidersHorizontal,
  Heart,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

// products will be loaded from CSV at runtime
// brands list will be derived from loaded products
const categories = [
  { id: 'taping', name: 'Automatic Taping' },
  { id: 'finishing', name: 'Finishing Tools' },
  { id: 'corner', name: 'Corner Tools' },
  { id: 'mudboxes', name: 'Mud Boxes & Pumps' },
  { id: 'sanding', name: 'Sanding Tools' }
];

const MAX_PRICE = 3000;

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // initialize selected brands from ?brand= param (supports comma-separated)
  const params = new URLSearchParams(location.search);
  const brandParam = params.get('brand');
  const initialSelectedBrands = brandParam ? brandParam.split(',').map(b => b.trim()).filter(Boolean) : [];

  const [selectedBrands, setSelectedBrands] = useState(initialSelectedBrands);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'cart') => {
    setToast({ message, type });
  };

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
    showToast(`${product.name} added to cart!`, 'cart');
  };

  const openModal = (product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  // close on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  

  const toggleBrand = (brand) => {
    const newBrands = selectedBrands.includes(brand) 
      ? selectedBrands.filter(b => b !== brand) 
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
  };

  const resetToBrandList = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setPriceRange([0, MAX_PRICE]);
    navigate('/products');
  };

  // load products once
  useEffect(() => {
    let mounted = true;
    loadProducts().then(list => {
      if (!mounted) return;
      setProducts(list);
      const unique = Array.from(new Set(list.map(p => p.brand).filter(Boolean))).sort();
      setBrands(unique);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Watch for URL changes to update selected brands (only on mount and URL changes)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get('brand');
    const brandsFromUrl = brandParam 
      ? brandParam.split(',').map(b => decodeURIComponent(b.trim())).filter(Boolean)
      : [];
    
    // Compare as sorted sets to avoid order issues (create copies to avoid mutation)
    const urlBrandsSet = [...brandsFromUrl].sort().join(',');
    const currentBrandsSet = [...selectedBrands].sort().join(',');
    
    if (urlBrandsSet !== currentBrandsSet) {
      // Defer the state update to avoid synchronous setState inside an effect
      // which can cause cascading renders. Scheduling the update asynchronously
      // ensures the effect completes before the state change occurs.
      const t = setTimeout(() => setSelectedBrands(brandsFromUrl), 0);
      return () => clearTimeout(t);
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedBrands to URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentBrandParam = params.get('brand') || '';
    const expectedBrandParam = selectedBrands.length > 0 
      ? selectedBrands.map(b => encodeURIComponent(b)).join(',')
      : '';
    
    // Only navigate if URL needs to change
    if (currentBrandParam !== expectedBrandParam) {
      if (selectedBrands.length > 0) {
        navigate(`/products?brand=${expectedBrandParam}`, { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    }
  }, [selectedBrands, navigate, location.search]);

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const filteredProducts = (products || []).filter(product => {
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) return false;
    // price may not exist in CSV; ignore if missing
    if (product.price && (product.price < priceRange[0] || product.price > priceRange[1])) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Brands button - shows when brand is selected (moved above header) */}
        {selectedBrands.length > 0 && (
          <div className="mb-6">
            <button
              onClick={resetToBrandList}
              className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Brands
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Browse our extensive collection of professional drywall tools</p>
        </div>

        {selectedBrands.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => {
                  navigate(`/products?brand=${encodeURIComponent(brand)}`);
                  setSelectedBrands([brand]);
                }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-left hover:shadow-md transition"
              >
                <div className="text-lg font-semibold text-gray-900 mb-1">{brand}</div>
                <div className="text-sm text-gray-500">View products</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* Mobile Filter Toggle */}
              

              {/* Filters */}
              <div className={`bg-white rounded-lg shadow-md p-6 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Categories */}
                <div>
                
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <SlidersHorizontal size={18} />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Brands</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={MAX_PRICE}
                      step="50"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedBrands.length > 0 || selectedCategories.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setSelectedCategories([]);
                      setPriceRange([0, MAX_PRICE]);
                      navigate('/products');
                    }}
                    className="w-full text-sm text-gray-900 hover:text-gray-800 font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Results */}
            <div className="flex flex-row justify-between items-center gap-4 mb-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Toggle Filters"
                >
                  <Filter size={16} />
                </button>
                {showFilters && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-lg border border-gray-300 rounded-lg mt-2 p-4 transition-transform transform origin-top scale-y-100">
                    <div className="flex flex-col gap-4">
                      {/* Add filter options here */}
                      <p>Filter options go here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Modal */}
            

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 hover:border-primary-300 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative bg-gray-100 aspect-square overflow-hidden">
                    <button onClick={() => openModal(product)} className="absolute inset-0 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="object-contain w-full h-full"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.jpg'; }}
                        />
                      ) : (
                        <div className="text-gray-400"><ShoppingCart size={48} /></div>
                      )}
                    </button>
                    {product.badge && (
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        product.badge === 'Best Seller' ? 'bg-accent-500' :
                        product.badge === 'Popular' ? 'bg-primary-600' :
                        product.badge === 'New' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}>
                        {product.badge}
                      </div>
                    )}
                    <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <Heart size={18} className="text-gray-600 hover:text-red-500 transition-colors" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      <button onClick={() => openModal(product)} className="block text-left w-full">{product.name || product.part_number}</button>
                    </h3>
                    
                    {/* SKU and UPC */}
                    <div className="flex items-center gap-4 mb-3">
                      {product.sku && (
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      )}
                      {product.upc && (
                        <p className="text-xs text-gray-500">UPC: {product.upc}</p>
                      )}
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                        ${product.price}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, 1);
                        }}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {sortedProducts.length === 0 && (
              <div className="text-center py-16">
                <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No products found</h2>
                <p className="text-gray-600 mb-6">Try adjusting your filters to see more products.</p>
                <button
                  onClick={() => {
                    setSelectedBrands([]);
                    setSelectedCategories([]);
                    setPriceRange([0, MAX_PRICE]);
                    navigate('/products');
                  }}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
      
      {/* Coming Soon Overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeInOverlay 600ms ease-out'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(1rem, 4vw, 2rem)',
          padding: '0 1rem'
        }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              fontFamily: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              animation: 'slideInDown 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              margin: 0
            }}
          >
            Coming Soon
          </h1>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Placeholder for signup logic
              alert('Thank you! We\'ll notify you when we launch.');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'slideInUp 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              width: '100%',
              maxWidth: '320px'
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.95rem',
                fontFamily: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                backdropFilter: 'blur(8px)',
                outline: 'none',
                transition: 'all 200ms ease-out',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 500,
                fontFamily: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Sign Up
            </button>
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              textAlign: 'center',
              fontFamily: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}>
              Be the first to know when we launch
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Product Detail Modal */}
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
    </div>
  );
}
