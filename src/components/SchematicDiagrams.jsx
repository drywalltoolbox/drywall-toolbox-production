import { Link } from 'react-router-dom';

export default function SchematicDiagrams() {
  return (
    <section style={{
      padding: '40px 40px 100px',
      maxWidth: '1400px',
      margin: '0 auto'
    }} className="section-enter schematic-section">
      <div style={{
        marginBottom: '60px',
        textAlign: 'center'
      }}>
        <h2 className="machined-title" style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          color: 'var(--primary-600)',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Schematic Diagrams
        </h2>
        <div style={{
          width: '60px',
          height: '3px',
          background: 'var(--primary-600)',
          margin: '20px auto 40px'
        }}></div>
      </div>

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
        className="schematic-hero"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }}
        >
          <img
            src="/15TT_SCH-1.png"
            alt="Schematic Diagrams"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              padding: '40px'
            }}
          />
        </div>
      </Link>
    </section>
  );
}

