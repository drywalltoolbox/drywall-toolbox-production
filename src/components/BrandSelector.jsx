import tapeTechLogo from '/brands/TapeTech/tapetech_logo.svg';
import columbiaLogo from '/brands/Columbia/columbia_taping_tools_logo.svg';
import surproLogo from '/brands/SurPro/surpro_logo.svg';
import asgardLogo from '/brands/Asgard/asgard_logo.svg';
import gracoLogo from '/brands/Graco/graco_logo.svg';

const brandLogos = {
  'TapeTech': tapeTechLogo,
  'Columbia Taping Tools': columbiaLogo,
  'SurPro': surproLogo,
  'Asgard': asgardLogo,
  'Graco': gracoLogo
};

export default function BrandSelector({ brands, onSelectBrand }) {
  return (
    <div style={{
      padding: 'clamp(40px, 8vw, 60px) clamp(1rem, 5vw, 2.5rem)',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(40px, 8vw, 60px)'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
          fontWeight: 800,
          color: 'var(--primary-600)',
          lineHeight: 1.1
        }}>
          SELECT YOUR BRAND
        </h2>
        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: 'var(--text-secondary)',
          margin: 0,
          letterSpacing: '-0.01em',
          fontWeight: 500
        }}>
          Choose a brand to view tool schematics and parts
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 'clamp(16px, 4vw, 24px)',
        marginBottom: '40px'
      }}>
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => onSelectBrand(brand)}
            style={{
              background: 'white',
              border: '1px solid var(--machined-border)',
              borderRadius: '12px',
              padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 28px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              aspectRatio: '1'
            }}
            className="brand-card-button"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--tension-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--machined-border)';
            }}
          >
            <img 
              src={brandLogos[brand]} 
              alt={`${brand} logo`}
              style={{
                maxHeight: 'clamp(60px, 12vw, 100px)',
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
