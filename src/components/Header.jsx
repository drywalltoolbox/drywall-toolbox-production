import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function Header({ onCartToggle }) {
  const location = useLocation();
  const { getCartCount } = useCart();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      background: 'var(--surface-glass)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--machined-border)',
      zIndex: 1000
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'var(--alloy-deep)',
            clipPath: 'polygon(0% 15%, 15% 0%, 100% 0%, 100% 85%, 85% 100%, 0% 100%)'
          }} />
          <span>Drywall Toolbox</span>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '32px' }}>
        <Link
          to="/products"
          style={{
            textDecoration: 'none',
            color: isActive('/products') ? 'var(--tension-accent)' : 'var(--alloy-deep)',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'opacity 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.6'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Tools
        </Link>
        <Link
          to="/parts"
          style={{
            textDecoration: 'none',
            color: isActive('/parts') ? 'var(--tension-accent)' : 'var(--alloy-deep)',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'opacity 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.6'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Parts
        </Link>
        <Link
          to="/contact"
          style={{
            textDecoration: 'none',
            color: isActive('/contact') ? 'var(--tension-accent)' : 'var(--alloy-deep)',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'opacity 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.6'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Contact
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          onClick={onCartToggle}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}
          aria-label="Toggle cart"
        >
          <ShoppingCart size={24} color="var(--alloy-deep)" />
          {getCartCount() > 0 && (
            <span style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'var(--tension-accent)',
              color: 'white',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}>
              {getCartCount()}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
