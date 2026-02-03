import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function Header({ onCartToggle }) {
  const location = useLocation();
  const { getCartCount } = useCart();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
      <div className="header-left">
        <Link to="/" className="brand-icon" aria-label="Home">
          <div className="brand-mark" />
        </Link>

        <nav className="nav-links nav-left" aria-label="Primary">
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>Tools</Link>
          <Link to="/parts" className={`nav-link ${isActive('/parts') ? 'active' : ''}`}>Parts</Link>
        </nav>
  </div>

  <div className="header-center">
        <Link to="/" className="brand-title">Drywall Toolbox</Link>
  </div>

  <div className="header-right">
        <nav className="nav-links nav-right" aria-label="Secondary">
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
        </nav>

        <div className="cart-area">
          <button onClick={onCartToggle} className="cart-toggle" aria-label="Toggle cart">
            <ShoppingCart size={20} />
            {getCartCount() > 0 && (
              <span className="cart-badge">{getCartCount()}</span>
            )}
          </button>
        </div>
      </div>
      </div>
    </header>
  );
}
