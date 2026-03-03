import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import SchematicDiagrams from '../components/SchematicDiagrams';

export default function Home() {
  return (
    <>
    <section style={{ 
      padding: '140px 40px 40px', 
      minHeight: '100vh' 
    }} className="section-enter home-hero-section">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
      className="home-hero-grid"
      >
        <div style={{ textAlign: 'center' }}>
          <h1 className="machined-title" style={{ marginBottom: '40px', color: 'var(--primary-600)' }}>
            ENGINEERED<br />FOR PRECISION<br />WALL FINISHES.
          </h1>
          <p style={{ 
            maxWidth: '500px', 
            marginBottom: '40px', 
            fontSize: '1.1rem', 
            opacity: 0.7, 
            color: 'black',
            margin: '0 auto 40px'
          }}>
            Your trusted source for industry-leading drywall tools and equipment. We deliver premium brands trusted by professional contractors nationwide.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/products" className="alloy-button" style={{ textDecoration: 'none' }}>
              Shop
            </Link>
          </div>
        </div>
        
        <div style={{
          background: 'var(--alloy-mid)',
          height: '500px',
          clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="home-hero-icon"
        >
          <Wrench 
            size={200} 
            color="var(--alloy-deep)" 
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        </div>
      </div>
    </section>
    <SchematicDiagrams />
    </>
  );
}
