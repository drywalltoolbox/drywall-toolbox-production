import { useState } from 'react';
import Reviews from './Reviews';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Heart, Plus, Minus, Star, Package, Truck, Shield } from 'lucide-react';

export default function ProductDetail({ product, onAddToCart, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      // fallback to cart context
      addToCart(product, quantity);
    }
    // close the modal naturally after adding to cart when provided
    try {
      if (typeof onClose === 'function') {
        // small delay to allow UI to show feedback (toast) before closing
        setTimeout(() => onClose(), 220);
      }
    } catch {
      // ignore
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const price = product.price || 0;
  const displayPrice = typeof price === 'number' ? price.toFixed(2) : parseFloat(price || 0).toFixed(2);

  return (
    <div className="bg-linear-to-br from-white via-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 lg:p-8">
        {/* Product Image Section */}
        <div className="lg:col-span-2">
          <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-8 border-2 border-gray-200 shadow-inner">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="object-contain w-full h-full hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.jpg'; }}
              />
            ) : (
              <div className="text-gray-300"><ShoppingCart size={80} strokeWidth={1.5} /></div>
            )}
          </div>
          
          {/* Features Icons */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <Truck className="w-5 h-5 mx-auto mb-1 text-primary-600" />
              <p className="text-xs text-gray-600 font-medium">Fast Shipping</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <Shield className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-gray-600 font-medium">Warranty</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
              <Package className="w-5 h-5 mx-auto mb-1 text-accent-600" />
              <p className="text-xs text-gray-600 font-medium">In Stock</p>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
              {product.brand}
            </span>
                  <div>
                    {/* Clickable reviews trigger - opens verified reviews popup (read-only) */}
                    <button
                      onClick={() => setShowReviewsPopup(true)}
                      className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1"
                      aria-label="Open verified reviews"
                    >
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < 5 ? (i <  Math.round(4) ? 'text-yellow-400' : 'text-gray-300') : 'text-gray-300'} />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">—</span>
                      </div>
                      <div className="text-sm text-gray-500">Verified reviews</div>
                    </button>
                  </div>
          </div>

          {/* Product Name */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            {product.name || product.sku || product.part_number}
          </h1>

          {/* SKU and UPC */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-gray-500">
            {product.sku && (
              <div>
                SKU: <span className="font-mono font-medium text-gray-700">{product.sku}</span>
              </div>
            )}
            {product.upc && (
              <div>
                UPC: <span className="font-mono font-medium text-gray-700">{product.upc}</span>
              </div>
            )}
          </div>

          {/* Full Description */}
          {product.description_full && (
            <p className="text-gray-700 mb-6 leading-relaxed">{product.description_full}</p>
          )}

          {/* Price Section */}
          <div className="bg-linear-to-r from-primary-50 to-accent-50 rounded-xl p-6 mb-6 border border-primary-100">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-gray-900">${displayPrice}</span>
              <span className="text-gray-500 line-through text-xl">${(parseFloat(displayPrice) * 1.2).toFixed(2)}</span>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">-20%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Free shipping on orders over $500</p>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={decrementQuantity}
                className="px-4 py-3 hover:bg-gray-100 transition-colors text-gray-700"
                aria-label="Decrease quantity"
              >
                <Minus size={20} />
              </button>
              <span className="px-6 py-3 font-bold text-lg text-gray-900 border-x-2 border-gray-200 min-w-15 text-center" aria-label="Current quantity">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                className="px-4 py-3 hover:bg-gray-100 transition-colors text-gray-700"
                aria-label="Increase quantity"
              >
                <Plus size={20} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Add to cart"
            >
              <ShoppingCart size={24} />
              Add to Cart
            </button>

            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`px-5 py-4 rounded-xl border-2 transition-all duration-300 ${
                isWishlisted
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={24} className={isWishlisted ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Reviews trigger modal: when clicked opens verified reviews (read-only) */}
          {showReviewsPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewsPopup(false)} />
              <div className="relative z-10 w-full max-w-lg mx-auto max-h-[80vh] overflow-auto no-scrollbar">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => setShowReviewsPopup(false)}
                    className="p-2 bg-white rounded-full shadow hover:shadow-md"
                    aria-label="Close reviews"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-3">Verified customer reviews</h2>
                  <Reviews productId={product.part_number || product.id || product.name} allowSubmit={false} filterVerified={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
