import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../../services/catalog';

export default function MobileSearch({ onClose = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    if (!query) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const filtered = (await searchProducts(query)).slice(0, 5);
        if (searchRequestIdRef.current === requestId) {
          setResults(filtered);
        }
      } catch (error) {
        if (searchRequestIdRef.current === requestId) {
          console.error('Search error:', error);
        }
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleProductClick = (product) => {
    const target = product?.slug ? `/products/${product.slug}` : `/product/${product.id}`;
    navigate(target);
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    onClose(); // Close the mobile menu
  };

  const handleViewAllResults = () => {
    // Navigate to all-products page with search query
    navigate(`/all-products?search=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    onClose(); // Close the mobile menu;
  };

  return (
    <div className="mobile-search-container">
      <div className="mobile-search-wrapper">
        <div className="mobile-search-pill">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) handleViewAllResults(); }}
            className="mobile-search-input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setResults([]); }}
              className="mobile-search-clear"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="mobile-search-dropdown">
            {isLoading ? (
              <div className="mobile-search-loading">Loading...</div>
            ) : results.length > 0 ? (
              <>
                <div className="mobile-search-results">
                  {results.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="mobile-search-result-item"
                    >
                      <div className="mobile-search-result-image">
                        {product.image && (
                          <img src={product.image} alt={product.name} />
                        )}
                      </div>
                      <div className="mobile-search-result-info">
                        <div className="mobile-search-result-name">{product.name}</div>
                        <div className="mobile-search-result-price">{product.price ? `$${product.price.toFixed(2)}` : 'N/A'}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {searchQuery.trim() && (
                  <button
                    onClick={handleViewAllResults}
                    className="mobile-search-view-all"
                  >
                    View All Results
                  </button>
                )}
              </>
            ) : searchQuery.trim() ? (
              <div className="mobile-search-no-results">No products found</div>
            ) : null}
          </div>
        )}
      </div>

      <style>{`
        .mobile-search-container {
          width: 100%;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .mobile-search-wrapper {
          position: relative;
          width: 100%;
        }

        /* ── Pill row ── */
        .mobile-search-pill {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        /* Leading icon */
        .mobile-search-icon-wrap {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          pointer-events: none;
          color: #9ca3af;
        }

        .mobile-search-input {
          flex: 1;
          width: 100%;
          padding: 0 44px 0 16px; /* right room for clear button */
          height: 44px;
          border-radius: 16px;
          border: 1.5px solid #e4e7eb;
          background: #ffffff;
          font-size: 16px !important; /* prevent iOS zoom */
          font-family: inherit;
          color: #1f2937;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .mobile-search-input::placeholder {
          color: #a1a9b4;
        }

        .mobile-search-input:focus {
          border-color: #71717a;
          box-shadow: 0 0 0 3px rgba(113,113,122,0.10), 0 1px 3px rgba(0,0,0,0.06);
        }

        /* Clear X button */
        .mobile-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #e5e7eb;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          min-width: unset;
          min-height: unset;
          transition: background 150ms ease;
        }

        .mobile-search-clear:active {
          background: #d1d5db;
          color: #1f2937;
        }

        /* Dropdown */
        .mobile-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
          max-height: 400px;
          overflow-y: auto;
          z-index: 50;
        }

        .mobile-search-results {
          padding: 8px 0;
        }

        .mobile-search-result-item {
          width: 100%;
          padding: 10px 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        }

        .mobile-search-result-item:active {
          background-color: #f5f7ff;
        }

        .mobile-search-result-image {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .mobile-search-result-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .mobile-search-result-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mobile-search-result-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
          line-height: 1.35;
        }

        .mobile-search-result-price {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.01em;
        }

        .mobile-search-view-all {
          width: 100%;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #4f46e5;
          background: #fafafa;
          border: none;
          border-top: 1px solid #f1f5f9;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          transition: background-color 0.15s ease;
        }

        .mobile-search-view-all:active {
          background-color: #f1f5f9;
        }

        .mobile-search-no-results,
        .mobile-search-loading {
          padding: 18px 16px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          letter-spacing: 0.01em;
        }

        .mobile-search-loading {
          color: #64748b;
          font-weight: 600;
        }

        .mobile-search-dropdown::-webkit-scrollbar {
          width: 4px;
        }

        .mobile-search-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .mobile-search-dropdown::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
