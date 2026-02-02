import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

export default function Parts() {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [selectedSchematic, setSelectedSchematic] = useState('auto-taper');
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();

  // Schematic data for 5 different tools
  const schematics = [
    {
      id: 'auto-taper',
      title: 'Automatic Taper G2',
      description: 'Professional automatic taping tool with precision components',
      parts: [
        {
          id: 1,
          name: 'High-Tension Pressure Plate',
          sku: 'DT-9920',
          material: 'ALLOY-T6',
          price: 42.00,
          position: { top: '25%', left: '45%' }
        },
        {
          id: 2,
          name: 'Main Drive Bearing',
          sku: 'DT-1104',
          material: 'CHROME-STEEL',
          price: 18.50,
          position: { top: '50%', left: '25%' }
        },
        {
          id: 3,
          name: 'Flow Control Nozzle',
          sku: 'DT-4402',
          material: 'PRECISION-ABS',
          price: 29.99,
          position: { top: '50%', left: '75%' }
        }
      ],
      svg: (
        <svg className="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <rect x="200" y="150" width="400" height="100" rx="10" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <circle cx="200" cy="200" r="40" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <line x1="600" y1="200" x2="700" y2="200" stroke="var(--alloy-edge)" strokeWidth="2"/>
          <rect x="250" y="100" width="300" height="50" rx="5" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'corner-finisher',
      title: 'Corner Finisher 3.5"',
      description: 'Precision corner finishing tool for perfect angles',
      parts: [
        {
          id: 4,
          name: 'Corner Guide Rail',
          sku: 'CF-2201',
          material: 'STAINLESS-STEEL',
          price: 35.00,
          position: { top: '30%', left: '35%' }
        },
        {
          id: 5,
          name: 'Wheel Assembly',
          sku: 'CF-2202',
          material: 'RUBBER-COMPOSITE',
          price: 24.50,
          position: { top: '60%', left: '60%' }
        }
      ],
      svg: (
        <svg className="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M 200 100 L 400 100 L 400 300 L 200 300 Z" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <circle cx="300" cy="150" r="30" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <circle cx="300" cy="250" r="30" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <line x1="400" y1="200" x2="550" y2="200" stroke="var(--alloy-edge)" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'flat-box',
      title: '12" Mega Flat Box',
      description: 'High-capacity flat box for smooth wall finishing',
      parts: [
        {
          id: 6,
          name: 'Blade Insert',
          sku: 'FB-5501',
          material: 'CARBON-STEEL',
          price: 52.00,
          position: { top: '40%', left: '50%' }
        },
        {
          id: 7,
          name: 'Handle Grip',
          sku: 'FB-5502',
          material: 'ERGONOMIC-POLYMER',
          price: 15.99,
          position: { top: '25%', left: '70%' }
        },
        {
          id: 8,
          name: 'Wheel Set',
          sku: 'FB-5503',
          material: 'POLYURETHANE',
          price: 28.00,
          position: { top: '65%', left: '45%' }
        }
      ],
      svg: (
        <svg className="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <rect x="150" y="150" width="500" height="100" rx="15" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <circle cx="200" cy="250" r="20" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <circle cx="600" cy="250" r="20" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <line x1="350" y1="150" x2="450" y2="150" stroke="var(--alloy-edge)" strokeWidth="3"/>
        </svg>
      )
    },
    {
      id: 'mud-pump',
      title: 'Mud Pump Pro',
      description: 'Heavy-duty compound pump with variable flow control',
      parts: [
        {
          id: 9,
          name: 'Pump Cylinder',
          sku: 'MP-8801',
          material: 'STAINLESS-STEEL',
          price: 125.00,
          position: { top: '35%', left: '40%' }
        },
        {
          id: 10,
          name: 'Valve Assembly',
          sku: 'MP-8802',
          material: 'BRASS',
          price: 68.50,
          position: { top: '60%', left: '55%' }
        }
      ],
      svg: (
        <svg className="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="200" r="80" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <rect x="300" y="180" width="200" height="40" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <line x1="400" y1="120" x2="400" y2="80" stroke="var(--alloy-edge)" strokeWidth="3"/>
          <circle cx="400" cy="60" r="15" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'extendable-handle',
      title: 'Extendable Handle System',
      description: 'Telescopic handle with quick-lock mechanism',
      parts: [
        {
          id: 11,
          name: 'Quick-Lock Mechanism',
          sku: 'EH-3301',
          material: 'ZINC-ALLOY',
          price: 45.00,
          position: { top: '35%', left: '50%' }
        },
        {
          id: 12,
          name: 'Extension Tube',
          sku: 'EH-3302',
          material: 'ALUMINUM',
          price: 32.50,
          position: { top: '55%', left: '50%' }
        }
      ],
      svg: (
        <svg className="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <line x1="400" y1="100" x2="400" y2="300" stroke="var(--alloy-edge)" strokeWidth="8"/>
          <rect x="375" y="150" width="50" height="30" stroke="var(--alloy-edge)" fill="var(--alloy-deep)" strokeWidth="2"/>
          <circle cx="400" cy="100" r="20" stroke="var(--alloy-edge)" fill="none" strokeWidth="2"/>
          <line x1="350" y1="165" x2="450" y2="165" stroke="var(--tension-accent)" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  const currentSchematic = schematics.find(s => s.id === selectedSchematic);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('part-modal-overlay')) {
      setActiveHotspot(null);
    }
  };

  const handleAddToCart = (part) => {
    // Create a product object compatible with the cart system
    const cartProduct = {
      id: part.sku, // Use SKU as unique ID
      name: part.name,
      brand: currentSchematic.title, // Use schematic title as brand
      price: part.price,
      part_number: part.sku,
      image: '/placeholder-part.png', // Can be updated later with actual images
    };
    
    addToCart(cartProduct, 1);
    setToast({
      message: `${part.name} added to cart!`,
      type: 'cart'
    });
    setActiveHotspot(null); // Close modal after adding
  };

  return (
    <section style={{ 
      padding: '120px 40px 80px', 
      minHeight: '100vh'
    }} className="section-enter">
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '60px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '3rem', 
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            INTERACTIVE SCHEMATIC VIEWER
          </h2>
          <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>
            Select a tool below to explore its technical diagram and component specifications
          </p>
        </div>

        {/* Selection HUD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '60px',
          padding: '24px',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--alloy-edge)',
          borderRadius: '8px'
        }}>
          {schematics.map((schematic) => (
            <button
              key={schematic.id}
              onClick={() => setSelectedSchematic(schematic.id)}
              style={{
                padding: '20px',
                background: selectedSchematic === schematic.id 
                  ? 'var(--tension-accent)' 
                  : 'var(--alloy-mid)',
                color: selectedSchematic === schematic.id 
                  ? 'white' 
                  : 'var(--alloy-text)',
                border: selectedSchematic === schematic.id 
                  ? '2px solid var(--tension-accent)' 
                  : '1px solid var(--alloy-edge)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: selectedSchematic === schematic.id ? '600' : '400',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (selectedSchematic !== schematic.id) {
                  e.currentTarget.style.background = 'var(--alloy-light)';
                  e.currentTarget.style.borderColor = 'var(--tension-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSchematic !== schematic.id) {
                  e.currentTarget.style.background = 'var(--alloy-mid)';
                  e.currentTarget.style.borderColor = 'var(--alloy-edge)';
                }
              }}
            >
              {schematic.title}
            </button>
          ))}
        </div>

        {/* Interactive Viewer */}
        {currentSchematic && (
          <div className="schematic-container">
            <div style={{
              marginBottom: '32px',
              padding: '24px',
              background: 'var(--surface-glass)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--alloy-edge)',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontSize: '2rem', 
                marginBottom: '8px',
                color: 'var(--tension-accent)'
              }}>
                {currentSchematic.title}
              </h3>
              <p style={{ 
                opacity: 0.8,
                fontSize: '1.05rem'
              }}>
                {currentSchematic.description}
              </p>
            </div>

            <div className="schematic-diagram" style={{ position: 'relative' }}>
              {currentSchematic.svg}
              
              {currentSchematic.parts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => setActiveHotspot(part.id)}
                  className="hotspot"
                  style={{
                    position: 'absolute',
                    top: part.position.top,
                    left: part.position.left,
                    transform: 'translate(-50%, -50%)'
                  }}
                  aria-label={`View details for ${part.name}`}
                />
              ))}
            </div>

            {/* Part Modal */}
            {activeHotspot && (
              <div className="part-modal-overlay" onClick={handleOverlayClick}>
                {(() => {
                  const part = currentSchematic.parts.find(p => p.id === activeHotspot);
                  return part ? (
                    <div className="part-modal">
                      <button 
                        onClick={() => setActiveHotspot(null)}
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: 'transparent',
                          border: 'none',
                          fontSize: '1.5rem',
                          color: 'var(--alloy-text)',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        
                      </button>
                      <h4 style={{ 
                        fontSize: '1.5rem',
                        marginBottom: '24px',
                        color: 'var(--tension-accent)'
                      }}>
                        {part.name}
                      </h4>
                      <div className="part-specs">
                        <div className="spec-row">
                          <span className="spec-label">SKU</span>
                          <span className="spec-value">{part.sku}</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Material</span>
                          <span className="spec-value">{part.material}</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Price</span>
                          <span className="spec-value">${part.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button 
                        className="alloy-button" 
                        onClick={() => handleAddToCart(part)}
                        style={{ 
                          width: '100%',
                          marginTop: '24px',
                          justifyContent: 'center'
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
