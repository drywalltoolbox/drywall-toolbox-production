import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadProducts } from '../data/products';
import ProductDetail from '../components/ProductDetail';

export default function Product() {
  const { partNumber } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadProducts().then(list => {
      if (!mounted) return;
      const found = list.find(p => (p.part_number || p.id) === partNumber);
      setProduct(found || null);
    }).catch(() => {
      if (!mounted) return;
      setProduct(null);
    }).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [partNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 text-gray-400">Loading product…</div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <ProductDetail product={product} />
      </div>
    </div>
  );
}

