import DOMPurify from 'dompurify';
import { ShoppingCart, Heart } from 'lucide-react';

function cleanDescription(s) {
  if (!s) return '';
  const cleaned = s.replace(/^\s*Product Details Resources\s*[:\-–—]?\s*/i, '').trim();
  return cleaned.replace(/\s{2,}/g, ' ');
}

function renderSpecObject(obj) {
  if (!obj) return null;
  if (obj.full_description) {
    const fd = cleanDescription(String(obj.full_description));
    const looksLikeHtml = /<[^>]+>/.test(fd);
    if (looksLikeHtml) {
      const clean = DOMPurify.sanitize(fd);
      return <div dangerouslySetInnerHTML={{ __html: clean }} />;
    }
    return (
      <div className="space-y-3 text-sm text-gray-700">
        {fd.split(/\r?\n\s*\r?\n/).map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>
    );
  }

  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
      {Object.entries(obj).map(([k, v]) => (
        <li key={k} className="wrap-break-word">
          <strong className="text-gray-900">{k}:</strong>{' '}
          {typeof v === 'object' ? <pre className="inline whitespace-pre-wrap">{JSON.stringify(v)}</pre> : <span>{cleanDescription(String(v))}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function ProductDetail({ product }) {
  if (!product) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-100 rounded overflow-hidden aspect-square flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="object-contain max-h-96" />
          ) : (
            <div className="text-gray-300"><ShoppingCart size={48} /></div>
          )}
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
          {product.part_number && (
            <p className="text-sm text-gray-600 mb-4">Part #: <span className="font-medium">{product.part_number}</span></p>
          )}

          {product.short_description && (
            <p className="text-gray-700 mb-4">{product.short_description}</p>
          )}

          {product.specifications && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Specifications</h3>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {typeof product.specifications === 'string' ? (
                  // try parse JSON string
                  (() => {
                    try {
                      const parsed = JSON.parse(product.specifications);
                      return renderSpecObject(parsed);
                    } catch {
                      const cleaned = cleanDescription(product.specifications);
                      const looksLikeHtml = /<[^>]+>/.test(cleaned);
                      if (looksLikeHtml) {
                        const safe = DOMPurify.sanitize(cleaned);
                        return <div dangerouslySetInnerHTML={{ __html: safe }} />;
                      }
                      return <pre className="whitespace-pre-wrap">{cleaned}</pre>;
                    }
                  })()
                ) : (
                  renderSpecObject(product.specifications)
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded">
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button className="p-2 bg-white border rounded">
              <Heart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
