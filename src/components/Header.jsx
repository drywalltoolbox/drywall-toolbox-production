import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Menu, X } from 'lucide-react';
import Logo from '/logo.svg';

export default function Header({ onCartToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.matchMedia('(min-width: 641px) and (max-width: 1024px)').matches;
    } catch {
      return false;
    }
  });

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    // Match tablet-sized screens (between 641px and 1024px)
    const mq = window.matchMedia('(min-width: 641px) and (max-width: 1024px)');
    const handler = (e) => setIsTablet(e.matches);
    // Listen for changes
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      // Safari fallback
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  const handleToolsClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    // Navigate to /products without query params to show brand list
    navigate('/products');
  };

  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
  {/* Mobile Layout */}
  <div className="flex md:hidden items-center justify-between w-full header-mobile-layout" style={{ display: isTablet ? 'flex' : undefined }}>
          {/* Cart Icon - Far Left */}
          <button 
            onClick={onCartToggle} 
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors header-icon" 
            aria-label="Toggle cart"
          >
            <ShoppingCart size={22} />
            {getCartCount() > 0 && (
              <span className="cart-badge">{getCartCount()}</span>
            )}
          </button>

          {/* Centered Logo */}
          <Link to="/" className="flex items-center justify-center" onClick={closeMobileMenu}>
            <img src={Logo} alt="Drywall Toolbox Logo" className="logo-image-mobile" />
          </Link>

          {/* Menu Icon - Far Right */}
          <button 
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors header-icon"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

  {/* Desktop Layout */}
  <div className="hidden md:contents header-desktop-layout" style={{ display: isTablet ? 'none' : undefined }}>
          <div className="header-left">
            <nav className="nav-links" aria-label="Primary">
              <Link to="/products" onClick={handleToolsClick} className={`nav-link ${isActive('/products') ? 'active' : ''}`} style={{ color: isActive('/products') ? 'var(--color-primary-600)' : 'black' }}>Tools</Link>
              <Link to="/parts" className={`nav-link ${isActive('/parts') ? 'active' : ''}`} style={{ color: isActive('/parts') ? 'var(--color-primary-600)' : 'black' }}>Parts</Link>
            </nav>
          </div>

          <div className="header-center">
            <Link to="/" className="flex items-center justify-center">
              <img src={Logo} alt="Drywall Toolbox Logo" className="logo-image" />
            </Link>
          </div>

          <div className="header-right">
            <nav className="nav-links" aria-label="Secondary">
              <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} style={{ color: isActive('/about') ? 'var(--color-primary-600)' : 'black' }}>About</Link>
              <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} style={{ color: isActive('/contact') ? 'var(--color-primary-600)' : 'black' }}>Contact</Link>
            </nav>

            <div className="cart-area">
              <button onClick={onCartToggle} className="cart-toggle header-icon" aria-label="Toggle cart">
                <ShoppingCart size={20} />
                {getCartCount() > 0 && (
                  <span className="cart-badge">{getCartCount()}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg header-mobile-menu" style={{ display: isTablet ? 'block' : undefined }}>
          <nav className="flex flex-col p-4 space-y-2">
            <Link 
              to="/products" 
              className={`nav-link-mobile ${isActive('/products') ? 'active' : ''}`}
              onClick={handleToolsClick}
            >
              Shop
            </Link>
            <Link 
              to="/parts" 
              className={`nav-link-mobile ${isActive('/parts') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Schematics
            </Link>
            <Link 
              to="/about" 
              className={`nav-link-mobile ${isActive('/about') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`nav-link-mobile ${isActive('/contact') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
