import { X, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, removeFromCart, getCartTotal } = useCart();

  // Always render — visibility is controlled by CSS classes so the
  // slide-in/out transition can play both on open AND close.
  return (
    <div 
      className={`cart-overlay${isOpen ? ' active' : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div 
        className="cart-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header bar */}
        <div className="cart-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} strokeWidth={2} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              fontSize: '0.85rem',
              fontWeight: 800,
              margin: 0,
            }}>
              Your Toolbox
            </h3>
            {cartItems.length > 0 && (
              <span style={{
                background: 'var(--primary-600)',
                color: 'white',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '1px 7px',
                lineHeight: 1.6,
              }}>{cartItems.length}</span>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              color: '#475569',
            }}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div id="cart-items-list" className="cart-panel-items">
          {cartItems.length === 0 ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '48px 24px',
              opacity: 0.45,
              textAlign: 'center',
            }}>
              <ShoppingCart size={36} strokeWidth={1.5} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const itemKey = item.cartKey || item.id;
              const optionText = Array.isArray(item.variation_attribute_values)
                ? item.variation_attribute_values.map((attr) => attr.option).filter(Boolean).join(' / ')
                : '';
              return (
              <div key={itemKey} className="cart-item">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0,
                      marginRight: '12px',
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    lineHeight: 1.3,
                    marginBottom: '3px',
                  }}>
                    {item.name}
                  </div>
                  {optionText && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#475569',
                      fontWeight: 700,
                      marginBottom: '3px',
                    }}>
                      {optionText}
                    </div>
                  )}
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.72rem', 
                    color: 'rgba(15,23,42,0.5)',
                  }}>
                    ${item.price ? item.price.toFixed(2) : '0.00'} × {item.quantity}
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(itemKey)}
                  aria-label={`Remove ${item.name}`}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ef4444', 
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '6px',
                    flexShrink: 0,
                    marginLeft: '4px',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="cart-panel-footer">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0f172a' }}>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 800, fontSize: '1rem' }}>
              ${getCartTotal().toFixed(2)}
            </span>
          </div>
          <Link 
            to="/checkout"
            onClick={onClose}
            className="alloy-button" 
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              textDecoration: 'none',
              display: 'flex',
            }}
          >
            Finalize Order
          </Link>
        </div>
      </div>
    </div>
  );
}
