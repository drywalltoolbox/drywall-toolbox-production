import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

export default function Parts() {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [selectedSchematic, setSelectedSchematic] = useState('corner-roller-assy');
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();

  // Schematic data for tools
  const schematics = [
    {
      id: 'corner-roller-assy',
      title: '15" Corner Roller Assembly',
      description: 'Complete corner roller assembly with swivel coupling and precision rollers',
      image: '/15TT_SCH-1.png',
      imageWidth: 3400,
      imageHeight: 2200,
      parts: [
        {
          id: '01',
          name: 'Handle Assembly',
          sku: '164348',
          material: 'ALUMINUM',
          price: 45.00,
          position: { top: '50.97%', left: '56.22%' },
          quantity: 1
        },
        {
          id: '02',
          name: 'Coupling',
          sku: '150003F',
          material: 'STEEL',
          price: 18.50,
          position: { top: '57.27%', left: '50.55%' },
          quantity: 1
        },
        {
          id: '03',
          name: 'Cotter Pin, 1/16 x 1/2',
          sku: '059143',
          material: 'STAINLESS-STEEL',
          price: 2.50,
          position: { top: '61.99%', left: '45.45%' },
          quantity: 1
        },
        {
          id: '04',
          name: 'Corner Roller Head',
          sku: '156001F',
          material: 'ALLOY-STEEL',
          price: 65.00,
          position: { top: '82.91%', left: '40.43%' },
          quantity: 1
        },
        {
          id: '05',
          name: 'Swivel Coupling Pin',
          sku: '150004F',
          material: 'STEEL',
          price: 12.00,
          position: { top: '87.75%', left: '35.63%' },
          quantity: 1
        },
        {
          id: '06',
          name: 'Thrust Washer',
          sku: '150008',
          material: 'BRASS',
          price: 5.50,
          position: { top: '82.80%', left: '21.58%' },
          quantity: 4
        },
        {
          id: '07',
          name: 'Brass Washer',
          sku: '809006',
          material: 'BRASS',
          price: 3.00,
          position: { top: '91.57%', left: '11.68%' },
          quantity: 4
        },
        {
          id: '08',
          name: 'Roller Axle, 1/4-20 x 1 1/4 Hex.',
          sku: '159006',
          material: 'CHROME-STEEL',
          price: 8.50,
          position: { top: '76.73%', left: '6.15%' },
          quantity: 4
        },
        {
          id: '09',
          name: 'Roller Bushing',
          sku: '150011F',
          material: 'BRONZE',
          price: 6.00,
          position: { top: '73.58%', left: '9.79%' },
          quantity: 4
        },
        {
          id: '10',
          name: 'Roller',
          sku: '150005',
          material: 'POLYURETHANE',
          price: 22.00,
          position: { top: '70.65%', left: '12.55%' },
          quantity: 4
        },
        {
          id: '11',
          name: 'Screw, 8-32 x 3/8 Fil. Hd. Nylock',
          sku: '159010',
          material: 'STAINLESS-STEEL',
          price: 1.50,
          position: { top: '68.18%', left: '15.61%' },
          quantity: 1
        },
        {
          id: '12',
          name: 'Swivel Assy.',
          sku: '154007',
          material: 'STEEL',
          price: 35.00,
          position: { top: '35.90%', left: '31.91%' },
          quantity: 1
        },
        {
          id: '13',
          name: 'Swivel Axle',
          sku: '150009',
          material: 'STEEL',
          price: 15.00,
          position: { top: '31.85%', left: '36.14%' },
          quantity: 1
        },
        {
          id: '14',
          name: 'Handle Grip, Black',
          sku: '151042',
          material: 'RUBBER',
          price: 8.50,
          position: { top: '22.06%', left: '82.35%' },
          quantity: 1
        }
      ]
    },
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
    <section 
      style={{ 
        padding: '120px 40px 80px',
        minHeight: '100vh'
      }} 
      className="section-enter"
      onClick={() => setActiveHotspot(null)}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
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
          <div>
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

            <div className="schematic-container">
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                {currentSchematic.image ? (
                  <img 
                    src={currentSchematic.image} 
                    alt={currentSchematic.title}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                ) : (
                  currentSchematic.svg
                )}
                
                {currentSchematic.parts.map((part) => (
                  <div
                    key={part.id}
                    className={`hotspot ${activeHotspot === part.id ? 'active' : ''}`}
                    style={{
                      position: 'absolute',
                      top: part.position.top,
                      left: part.position.left,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 100
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHotspot(activeHotspot === part.id ? null : part.id);
                    }}
                    title={`${part.name} (${part.sku})`}
                  >
                    <div className="part-modal" onClick={(e) => e.stopPropagation()}>
                    <h4 style={{
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      marginBottom: '8px'
                    }}>
                      {part.name}
                    </h4>
                    <div className="part-meta">
                      SKU: {part.sku} | {part.material}
                      {part.quantity > 1 && ` | Qty: ${part.quantity}`}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800
                      }}>
                        ${part.price.toFixed(2)}
                      </span>
                      <button
                        className="alloy-button"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.6rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(part);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
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
