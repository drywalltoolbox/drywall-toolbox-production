import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';

function normalizeRepairId(value) {
  return String(value || '').trim().replace(/^DTB-/i, '');
}

export default function RepairTrack() {
  const navigate = useNavigate();
  const [repairId, setRepairId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const id = normalizeRepairId(repairId);
    const publicToken = token.trim();

    if (!id) {
      setError('Enter your repair number.');
      return;
    }

    if (!publicToken) {
      setError('Enter the tracking token from your repair confirmation email.');
      return;
    }

    navigate(`/repairs/status/${encodeURIComponent(id)}?token=${encodeURIComponent(publicToken)}`);
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--alloy-base)' }}>
      <SEOHead
        title="Track Repair"
        description="Track a DTB drywall tool repair request by repair number and token."
        canonical="https://elliottm4.sg-host.com/repairs/track"
      />

      <section style={{ padding: 'clamp(56px, 9vw, 92px) clamp(1.5rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            border: '1px solid var(--machined-border)',
            borderRadius: '8px',
            padding: 'clamp(24px, 5vw, 40px)',
          }}>
            <h1 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 950 }}>
              Track a repair
            </h1>
            <p style={{ margin: '0 0 26px', color: 'rgba(15,23,42,0.62)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Use the repair number and tracking token from your confirmation email to view status, quote actions, shipping, and messages.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gap: '16px' }}>
                <label>
                  <span className="machined-label" style={{ color: 'var(--primary-600)', marginBottom: 6, display: 'block' }}>
                    Repair Number
                  </span>
                  <input
                    className="machined-input text-black"
                    value={repairId}
                    onChange={(e) => { setRepairId(e.target.value); setError(''); }}
                    placeholder="DTB-1234"
                    autoComplete="off"
                  />
                </label>

                <label>
                  <span className="machined-label" style={{ color: 'var(--primary-600)', marginBottom: 6, display: 'block' }}>
                    Tracking Token
                  </span>
                  <input
                    className="machined-input text-black"
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(''); }}
                    placeholder="Token from confirmation email"
                    autoComplete="off"
                  />
                </label>
              </div>

              {error && (
                <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '12px 0 0' }} role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="alloy-button" style={{ marginTop: '22px', cursor: 'pointer' }}>
                View repair status
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
