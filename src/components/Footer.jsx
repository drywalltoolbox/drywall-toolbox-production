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
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main footer content */}
      <div style={{
        padding: '80px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', order: 3 }}>
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
              className="footer-logo"
            />
          </Link>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
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

        <div className="footer-col footer-center-on-mobile" style={{ order: 1 }}>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden flex items-center justify-center bg-none border-none cursor-pointer text-center relative mb-6"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              marginBottom: '24px',
              width: '100%'
            }}
          >
            <h5 style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              margin: 0,
              fontWeight: 800,
              color: 'var(--primary-600)',
              flex: 'none'
            }}>
              Menu
            </h5>
            <ChevronDown 
              size={16} 
              style={{
                position: 'absolute',
                right: 0,
                transform: navOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                flex: 'none'
              }}
            />
          </button>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            textAlign: 'center'
          }} className={navOpen ? 'block md:block' : 'hidden md:block'}>
            <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
              <Link to="/products" style={{ textDecoration: 'none', color: 'black' }}>
                Shop
              </Link>
            </li>
            <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
              <Link to="/parts" style={{ textDecoration: 'none', color: 'black' }}>
                Parts
              </Link>
            </li>
            <li style={{ marginBottom: '12px', fontSize: '0.85rem', opacity: 0.6, color: 'black' }}>
              <Link to="/about" style={{ textDecoration: 'none', color: 'black' }}>
                About Us
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-col footer-center-on-mobile" style={{ order: 2 }}>
          <button
            onClick={() => setSupportOpen(!supportOpen)}
            className="md:hidden flex items-center justify-center bg-none border-none cursor-pointer text-center relative mb-6"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              marginBottom: '24px',
              width: '100%'
            }}
          >
            <h5 style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              margin: 0,
              fontWeight: 800,
              color: 'var(--primary-600)',
              flex: 'none'
            }}>
              Support
            </h5>
            <ChevronDown 
              size={16} 
              style={{
                position: 'absolute',
                right: 0,
                transform: supportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                flex: 'none'
              }}
            />
          </button>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            textAlign: 'center'
          }} className={supportOpen ? 'block md:block' : 'hidden md:block'}>
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
      </div>

      {/* Copyright Footer */}
      <div style={{
        borderTop: '1px solid var(--machined-border)',
        padding: '24px 40px',
        textAlign: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <p style={{
          fontSize: '0.8rem',
          color: 'rgba(15, 23, 42, 0.7)',
          margin: 0,
          fontWeight: 500
        }}>
          Copyright © 2026 Drywall Toolbox.
        </p>
      </div>
    </footer>
  );
}
