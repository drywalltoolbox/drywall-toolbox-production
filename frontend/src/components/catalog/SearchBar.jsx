import { Loader2, Search, X } from 'lucide-react';
import './product-search-bar.css';

function formatPrice(product) {
  const price = Number(product?.price ?? product?.min_price ?? 0);
  return Number.isFinite(price) && price > 0 ? `$${price.toFixed(2)}` : 'View product';
}

export default function SearchBar({
  placeholder = 'Search products...',
  value = '',
  onChange = () => {},
  suggestions = [],
  loading = false,
  onSelectSuggestion,
  onSubmit,
  onClear,
}) {
  const hasQuery = Boolean(value.trim());
  const showSuggestions = hasQuery && (loading || suggestions.length > 0);

  return (
    <div className="dtb-product-search">
      <div className="dtb-product-search__field">
        <Search size={20} className="dtb-product-search__icon" aria-hidden="true" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit?.(value);
            }
          }}
          className="dtb-product-search__input"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          autoComplete="off"
        />
        {hasQuery && (
          <button type="button" className="dtb-product-search__clear" onClick={onClear} aria-label="Clear product search">
            <X size={16} aria-hidden="true" />
          </button>
        )}
        {showSuggestions && (
          <div className="dtb-product-search__suggestions" role="listbox" aria-label="Product search suggestions">
            {loading ? (
              <div className="dtb-product-search__state"><Loader2 size={16} className="animate-spin" /> Searching products...</div>
            ) : suggestions.map((product) => (
              <button
                key={product.id || product.slug || product.sku}
                type="button"
                className="dtb-product-search__suggestion"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectSuggestion?.(product)}
                role="option"
              >
                <span className="dtb-product-search__thumb">
                  {product.image ? <img src={product.image} alt="" /> : null}
                </span>
                <span className="dtb-product-search__meta">
                  <span className="dtb-product-search__name">{product.name}</span>
                  <span className="dtb-product-search__detail">{[product.brand, product.sku].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="dtb-product-search__price">{formatPrice(product)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
