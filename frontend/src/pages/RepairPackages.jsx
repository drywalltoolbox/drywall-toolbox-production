import { Link } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';
import { getRepairPackageGroups, REPAIR_TOOL_FAMILIES } from '../data/repairPackages.js';

function PackageCard({ pkg }) {
  const familyLabel = REPAIR_TOOL_FAMILIES[pkg.toolFamily]?.label || 'Repair Service';

  return (
    <article style={{
      border: '1px solid var(--machined-border)',
      borderRadius: '8px',
      background: 'white',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <p style={{
            margin: '0 0 5px',
            color: 'rgba(15,23,42,0.42)',
            fontSize: '0.68rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {familyLabel}
          </p>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 900 }}>
            {pkg.name}
          </h3>
        </div>
        <span style={{
          color: pkg.routeType === 'standard_package' ? 'var(--primary-600)' : '#b45309',
          fontSize: '0.78rem',
          fontWeight: 900,
          whiteSpace: 'nowrap',
        }}>
          {pkg.priceLabel}
        </span>
      </div>

      <p style={{ margin: '0 0 12px', color: 'rgba(15,23,42,0.62)', fontSize: '0.84rem', lineHeight: 1.55 }}>
        Best for {pkg.recommendedFor.join(', ')}.
      </p>

      <ul style={{ margin: '0 0 14px', paddingLeft: '18px', color: 'rgba(15,23,42,0.66)', fontSize: '0.8rem', lineHeight: 1.55 }}>
        {pkg.includes.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: 'auto 0 16px' }}>
        <span style={badgeStyle}>{pkg.estimatedTurnaroundDays.standard} day standard</span>
        {pkg.estimatedTurnaroundDays.expedited && <span style={badgeStyle}>{pkg.estimatedTurnaroundDays.expedited} day expedited</span>}
        <span style={badgeStyle}>{pkg.warrantyDays ? `${pkg.warrantyDays} day warranty` : 'quote gated'}</span>
      </div>

      <Link to={`/repairs/start?package=${encodeURIComponent(pkg.id)}`} className="alloy-button" style={{ textDecoration: 'none', justifyContent: 'center' }}>
        Start with this package
      </Link>
    </article>
  );
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 8px',
  borderRadius: '999px',
  background: 'rgba(15,23,42,0.05)',
  color: 'rgba(15,23,42,0.56)',
  fontSize: '0.68rem',
  fontWeight: 800,
};

export default function RepairPackages() {
  const groups = getRepairPackageGroups();

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--alloy-base)' }}>
      <SEOHead
        title="Repair Service Packages"
        description="Compare DTB standard repair packages, diagnostic quote-first paths, turnaround estimates, and warranty coverage."
        canonical="https://drywalltoolbox.com/repairs/packages"
      />

      <section style={{ padding: 'clamp(48px, 8vw, 82px) clamp(1.5rem, 5vw, 3rem) 28px', background: 'white', borderBottom: '1px solid var(--machined-border)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <Link to="/repairs" style={{ color: 'var(--primary-600)', fontSize: '0.8rem', fontWeight: 900, textDecoration: 'none' }}>
            Repair services
          </Link>
          <h1 style={{ margin: '14px 0 12px', color: '#0f172a', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '0' }}>
            Standard repair packages
          </h1>
          <p style={{ margin: 0, color: 'rgba(15,23,42,0.62)', fontSize: '1rem', lineHeight: 1.65, maxWidth: '760px' }}>
            Pick a known package for common tool service or start quote-first when damage, parts, or warranty eligibility are uncertain.
          </p>
        </div>
      </section>

      <main style={{ padding: 'clamp(28px, 5vw, 48px) clamp(1.5rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '34px' }}>
          {groups.map((group) => (
            <section key={group.id}>
              <h2 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '1.28rem', fontWeight: 950 }}>
                {group.label}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '16px',
              }}>
                {group.packages.map((pkg) => (
                  <PackageCard key={`${group.id}-${pkg.id}`} pkg={pkg} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
