import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';
import { loadProducts } from '../data/products';

export default function Parts() {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('TapeTech');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSchematic, setSelectedSchematic] = useState('tapetech-corner-roller');
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const { addToCart } = useCart();

  // Load products on mount
  useEffect(() => {
    loadProducts().then(prods => {
      setProducts(prods);
      // Extract unique brands
      const uniqueBrands = [...new Set(prods.map(p => p.brand).filter(Boolean))].sort();
      setBrands(uniqueBrands);
      
      // Auto-select TapeTech brand and Corner Roller product
      setSelectedBrand('TapeTech');
      const cornerRoller = prods.find(p => p.part_number === 'TTT15TTEWOH');
      if (cornerRoller) {
        setSelectedProduct(cornerRoller);
      }
    });
  }, []);

  // Schematic data for tools
  const schematics = [
    {
      id: 'tapetech-corner-roller',
      title: 'TapeTech Inside Corner Roller',
      description: 'Complete corner roller assembly - Model TTT15TTEWOH',
      brand: 'TapeTech',
      productPartNumber: 'TTT15TTEWOH',
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

  // Get products filtered by selected brand
  const filteredProducts = products.filter(p => p.brand === selectedBrand);
  
  // Filter schematics by selected brand and product
  const filteredSchematics = schematics.filter(schematic => {
    // If brand selected, only show schematics for that brand
    if (selectedBrand && schematic.brand !== selectedBrand) {
      return false;
    }
    // If product selected, only show schematics matching that product
    if (selectedProduct && schematic.productPartNumber !== selectedProduct.part_number) {
      return false;
    }
    return true;
  });

  const currentSchematic = schematics.find(s => s.id === selectedSchematic);

  const handleAddToCart = (part) => {
    // Create a product object compatible with the cart system
    const cartProduct = {
      id: part.sku, // Use SKU as unique ID
      name: part.name,
      brand: currentSchematic?.brand || selectedBrand || 'Parts', // Use actual brand
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
            Select brand → product → explore technical diagrams and component specifications
          </p>
        </div>

        {/* Horizontal Navigation Bar */}
        <div style={{
          marginBottom: '40px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '12px',
          padding: '16px 24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          
          {/* Brand Dropdown */}
          <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '8px'
            }}>
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedProduct(null);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '48px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {brands.map((brand) => (
                <option key={brand} value={brand} style={{ background: '#1e293b', color: 'white' }}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Separator */}
          <div style={{
            width: '1px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.1)',
            display: brands.length > 0 && filteredProducts.length > 0 ? 'block' : 'none'
          }} />

          {/* Product Dropdown */}
          {selectedBrand && filteredProducts.length > 0 && (
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '250px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '8px'
              }}>
                Product <span style={{ opacity: 0.6, fontWeight: '400' }}>({filteredProducts.length})</span>
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = filteredProducts.find(p => p.id === e.target.value);
                  setSelectedProduct(product);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  paddingRight: '48px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>
                  Select a product...
                </option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id} style={{ background: '#1e293b', color: 'white' }}>
                    {product.name} ({product.part_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Separator */}
          <div style={{
            width: '1px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.1)'
          }} />

          {/* Schematic Dropdown */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '8px'
            }}>
              Schematic Diagram
            </label>
            <select
              value={selectedSchematic || ''}
              onChange={(e) => setSelectedSchematic(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: selectedSchematic 
                  ? 'rgba(37, 99, 235, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedSchematic 
                  ? '1px solid rgba(37, 99, 235, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: selectedSchematic ? '600' : '500',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2393c5fd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '48px',
                boxShadow: selectedSchematic 
                  ? '0 0 20px rgba(37, 99, 235, 0.2)' 
                  : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedSchematic 
                  ? 'rgba(37, 99, 235, 0.2)' 
                  : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedSchematic 
                  ? 'rgba(37, 99, 235, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = selectedSchematic 
                  ? 'rgba(37, 99, 235, 0.4)' 
                  : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <option value="" style={{ background: '#1e293b', color: 'white' }}>
                {filteredSchematics.length === 0 ? 'No schematics available' : 'Select schematic...'}
              </option>
              {filteredSchematics.map((schematic) => (
                <option key={schematic.id} value={schematic.id} style={{ background: '#1e293b', color: 'white' }}>
                  {schematic.title}
                </option>
              ))}
            </select>
            {filteredSchematics.length === 0 && selectedProduct && (
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                No diagrams available for this product yet
              </div>
            )}
          </div>
        </div>

        {/* Product/Schematic Info Banner */}
        {selectedProduct && currentSchematic && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'rgba(37, 99, 235, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              📘
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600',
                color: 'var(--alloy-deep)',
                marginBottom: '4px'
              }}>
                Viewing Schematic for: {selectedProduct.name}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(15, 23, 42, 0.7)',
                fontFamily: 'var(--font-mono)'
              }}>
                {selectedBrand} → {selectedProduct.part_number} → {currentSchematic.title}
              </div>
            </div>
          </div>
        )}

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
