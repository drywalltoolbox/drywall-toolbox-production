import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import SchematicDiagrams from '../components/SchematicDiagrams';

export default function Home() {
  return (
    <>
    <section style={{ 
      padding: 'clamp(80px, 15vw, 140px) 1.5rem 2.5rem', 
      minHeight: '100vh'
    }} className="section-enter home-hero-section">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(1fr, 50%, 1.2fr) clamp(1fr, 50%, 0.8fr)',
        gap: 'clamp(1.5rem, 5vw, 2.5rem)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
      className="home-hero-grid"
      >
        <div style={{ textAlign: 'center' }}>
          <h1 className="machined-title" style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--primary-600)' }}>
            ENGINEERED<br />FOR PRECISION<br />WALL FINISHES.
          </h1>
          <p style={{ 
            maxWidth: '500px', 
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', 
            fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', 
            opacity: 0.7, 
            color: 'black',
            margin: '0 auto clamp(1.5rem, 4vw, 2.5rem)',
            lineHeight: 1.6
          }}>
            Your trusted source for industry-leading drywall tools and equipment. We deliver premium brands trusted by professional contractors nationwide.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/products" className="alloy-button" style={{ textDecoration: 'none' }}>
              Shop Products
            </Link>
          </div>
        </div>
        
        <div style={{
          background: 'var(--alloy-mid)',
          height: 'clamp(280px, 50vw, 500px)',
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
            style={{
              width: 'clamp(120px, 25vw, 200px)',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </section>
    <SchematicDiagrams />
    </>
  );
}
