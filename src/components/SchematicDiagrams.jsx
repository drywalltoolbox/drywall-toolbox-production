import { Link } from 'react-router-dom';
import schematicImg from '/15TT_SCH-1.png?url';

export default function PartsDiagrams() {
  return (
    <section style={{
      padding: '20px 40px 100px',
      maxWidth: '1400px',
      margin: '0 auto'
    }} className="section-enter parts-section">
      <Link to="/parts" style={{ textDecoration: 'none' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: 'var(--alloy-mid)',
          borderRadius: '4px',
          border: '1px solid var(--machined-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s var(--ease-tension)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        className="parts-hero"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }}
        >
          {/* Blueprint background with subtle blur */}
          <img
            src={schematicImg}
            alt="Parts Diagrams Background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'blur(1.5px) opacity(0.6)',
              WebkitFilter: 'blur(1.5px) opacity(0.6)'
            }}
          />
          
          {/* Overlay to enhance text visibility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.2) 100%)',
              pointerEvents: 'none'
            }}
          />
          
          {/* Centered text content */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              color: 'var(--primary-600)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 800,
              textShadow: '0 0 25px rgba(255, 255, 255, 0.25), 0 0 15px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0,0,0,0.3)',
              lineHeight: 1.1,
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2))'
            }}>
              PARTS
            </h2>
            <div style={{
              width: '60px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '2px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>
      </Link>
    </section>
  );
}

