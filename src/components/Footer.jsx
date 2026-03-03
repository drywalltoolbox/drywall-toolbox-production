import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Logo from '/logo2.svg';

export default function Footer() {
  const [navOpen, setNavOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <footer className="site-footer" style={{
      background: 'white',
      borderTop: '1px solid var(--machined-border)',
      padding: '80px 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginBottom: '-8px' }}>
          <img 
            src={Logo} 
            alt="Drywall Toolbox Logo" 
            style={{
              width: '280px',
              height: 'auto',
              maxHeight: '146px',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              padding: 0,
              margin: 0
            }}
          />
        </Link>
        <div style={{ display: 'flex', gap: '16px', marginTop: '0px' }}>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'var(--alloy-deep)', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Instagram size={20} />
          </a>
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'var(--alloy-deep)', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Facebook size={20} />
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'var(--alloy-deep)', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Twitter size={20} />
          </a>
        </div>
      </div>

  <div className="footer-col footer-center-on-mobile">
        <button
          onClick={() => setNavOpen(!navOpen)}
          className="md:pointer-events-none"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <h5 style={{
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            marginBottom: '24px',
            fontWeight: 800,
            color: 'var(--primary-600)'
          }}>
            Menu
          </h5>
          <ChevronDown 
            size={16} 
            className="md:hidden"
            style={{
              transform: navOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              marginBottom: '24px',
              position: 'absolute',
              right: 0
            }}
          />
        </button>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          display: navOpen ? 'block' : 'none'
        }} className="md:block">
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            <Link to="/products" style={{ textDecoration: 'none', color: 'black' }}>
              Catalog
            </Link>
          </li>
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            <Link to="/parts" style={{ textDecoration: 'none', color: 'black' }}>
              Parts Schematics
            </Link>
          </li>
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            <Link to="/about" style={{ textDecoration: 'none', color: 'black' }}>
              About Us
            </Link>
          </li>
        </ul>
      </div>

  <div className="footer-col footer-center-on-mobile">
        <button
          onClick={() => setSupportOpen(!supportOpen)}
          className="md:pointer-events-none"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <h5 style={{
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            marginBottom: '24px',
            fontWeight: 800,
            color: 'var(--primary-600)'
          }}>
            Support
          </h5>
          <ChevronDown 
            size={16} 
            className="md:hidden"
            style={{
              transform: supportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              marginBottom: '24px',
              position: 'absolute',
              right: 0
            }}
          />
        </button>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          display: supportOpen ? 'block' : 'none'
        }} className="md:block">
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            Shipping Policy
          </li>
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            Return Portal
          </li>
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            Safety Guides
          </li>
          <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
            <Link to="/contact" style={{ textDecoration: 'none', color: 'black' }}>
              Contact
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h5 style={{
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          marginBottom: '24px',
          fontWeight: 800,
          textAlign: 'center'
        }}>
          Industrial Access
        </h5>
        <p style={{ fontSize: '0.8rem', marginBottom: '16px', color: 'black', fontWeight: 'normal' }}>
          Sign up for trade-only discounts and technical updates.
        </p>
        <input 
          type="email" 
          placeholder="Email Address" 
          className="machined-input"
          style={{ padding: '10px', fontSize: '0.8rem' }}
        />
      </div>
    </footer>
  );
}
