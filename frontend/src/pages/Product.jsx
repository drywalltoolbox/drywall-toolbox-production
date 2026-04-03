import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../services/catalog';
import { useCart } from '../context/CartContext';
import ProductDetail from '../components/ProductDetail';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Product() {
  const { partNumber, id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'cart') => {
    setToast({ message, type });
  };

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
    showToast(`${product.name} added to cart!`, 'cart');
  };

  useEffect(() => {
    let mounted = true;
    // Support both /product/:partNumber (legacy) and /products/:id (WooCommerce)
    const key = id || partNumber;

    const load = async () => {
      // catalog service handles API-first → CSV-fallback transparently
      return getProductById(key);
    };

    load()
      .then(found => { if (mounted) setProduct(found || null); })
      .catch(() => { if (mounted) setProduct(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [partNumber, id]);

  if (loading) {
    return <LoadingSpinner fullPage size="lg" label="Loading product" />;
  }

  if (!product) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">Go Back</button>
            <Link to="/products" className="px-4 py-2 bg-primary-600 text-white rounded">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-wrapper">
      <div className="container mx-auto px-4 py-12">
        <ProductDetail 
          product={product} 
          onAddToCart={handleAddToCart}
          onClose={() => navigate(-1)}
        />
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

