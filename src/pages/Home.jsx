import { Link } from 'react-router-dom';
import PartsDiagrams from '../components/SchematicDiagrams';

export default function Home() {
  return (
    <>
    <section style={{ 
      padding: 'clamp(20px, 5vw, 40px) clamp(1rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.5rem)',
      minHeight: '100vh'
    }} className="section-enter home-hero-section">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(1.25rem, 4vw, 2rem)',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '100%'
      }}
      className="home-hero-grid"
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'clamp(1.25rem, 4vw, 2rem)' }}>
          <h1 className="machined-title" style={{ marginBottom: 0, color: 'var(--primary-600)', lineHeight: 1.1 }}>
            THE FINISHER'S<br />HEADQUARTERS.
          </h1>
          <p style={{ 
            maxWidth: '500px', 
            marginBottom: 0,
            fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', 
            opacity: 0.7, 
            color: 'black',
            lineHeight: 1.6
          }}>
            Your one stop shop for everything you need to ensure a flawless finish everytime. Get production-grade tools, unbeatable prices, and lightning-fast shipping from a team that knows the job site.
          </p>
          <Link to="/products" className="alloy-button" style={{ textDecoration: 'none', marginTop: 'clamp(0.5rem, 2vw, 1rem)' }}>
            Shop Products
          </Link>
        </div>
      </div>
    </section>
    <PartsDiagrams />
    </>
  );
}
