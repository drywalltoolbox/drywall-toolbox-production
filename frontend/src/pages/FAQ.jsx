import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

/* ─────────────────────────────────────────────────────────────────────────────
   Maintenance schedule data (mirrored from Repairs.jsx)
   ───────────────────────────────────────────────────────────────────────── */
const MAINTENANCE_SCHEDULE = [
  { level: 'High-Volume Pro',  usage: '6+ rolls (500 ft) / day',  interval: 'Every 6 months',       badge: 'Heavy'   },
  { level: 'Standard Pro',     usage: '4–10 rolls / week',        interval: 'Annually',              badge: 'Regular' },
  { level: 'Occasional User',  usage: '<4 rolls / week',          interval: 'Every 18–24 months',    badge: 'Light'   },
];

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ data — grouped by category
   ───────────────────────────────────────────────────────────────────────── */
const FAQ_CATEGORIES = [
  {
    id: 'repair-process',
    label: 'Repair Process',
    questions: [
      {
        q: 'How do I submit a repair request?',
        a: 'Head to our Repair Services page and fill out the multi-step repair request form. You\'ll describe your tool, the issue, and upload photos if available. Our service team responds within one business day with a written quote and estimated turnaround.',
      },
      {
        q: 'Is there a diagnostic or bench fee?',
        a: 'Yes — a $50–$75 diagnostic fee covers full inspection and a written itemized quote. That fee is credited in full toward your repair cost if you approve the work. You are never charged for parts or labor until you give the go-ahead.',
      },
      {
        q: 'What happens if I decline the repair after the quote?',
        a: 'You only pay the diagnostic bench fee. Your tool is returned to you at your expense via your preferred shipping method. No additional charges apply.',
      },
      {
        q: 'How long does a typical repair take?',
        a: 'Most standard rebuilds are completed within 5–7 business days after you approve the quote. Premium overhauls and heavy-damage repairs can take 10–14 business days depending on parts availability. Rush service is available — contact us before submitting.',
      },
      {
        q: 'Do you work on all brands?',
        a: 'We service TapeTech, Columbia, Asgard, Graco, Level 5, Platinum, SurPro, and Dura-Stilts tools. If your brand is not listed, contact us — we evaluate requests on a case-by-case basis.',
      },
      {
        q: 'Can I ship my tool in for repair?',
        a: 'Yes. Pack your tool securely and ship it to our service address (provided after you submit your request). We provide pre-paid return shipping labels for approved repairs. You\'re responsible for inbound shipping costs.',
      },
    ],
  },
  {
    id: 'pricing-warranty',
    label: 'Pricing & Warranty',
    questions: [
      {
        q: 'How is repair pricing determined?',
        a: 'Pricing is based on tool category, service tier, and parts required. All labor and parts are itemized on your written quote — no bundled or hidden fees. See our Repair Pricing section for standard tier ranges by tool type.',
      },
      {
        q: 'Are parts prices locked after the quote?',
        a: 'Hard parts are capped at 20% above the quoted amount. If a parts cost changes significantly, we notify you before proceeding. You retain full approval authority at every stage.',
      },
      {
        q: 'Do you offer member discounts on repairs?',
        a: 'Yes. Standard Pro members receive a 10% discount on all repair labor. Premium Pro members receive 15% off labor plus priority queue placement. Discounts apply automatically when you submit a repair request while logged in.',
      },
      {
        q: 'What does the 90-day workmanship warranty cover?',
        a: 'Our Premium Overhaul tier carries a 90-day workmanship warranty on labor and installed parts. If the same issue recurs within 90 days of the repair completion date, we re-service the tool at no additional labor charge. Warranty does not cover new damage, misuse, or normal wear.',
      },
      {
        q: 'Do lower service tiers carry a warranty?',
        a: 'Quick Fix and Standard Rebuild tiers carry a 30-day workmanship warranty. Factory Tune-Up and Diagnostic services do not carry a repair warranty but we stand behind all work performed.',
      },
    ],
  },
  {
    id: 'tool-care',
    label: 'Tool Care & Maintenance',
    questions: [
      {
        q: 'How often should I service my automatic taper?',
        a: 'High-volume pros running 6+ rolls per day should service every 6 months. Standard pros (4–10 rolls/week) annually. Occasional users every 18–24 months. See the full maintenance schedule below.',
      },
      {
        q: 'What does a standard service include?',
        a: 'A standard service covers disassembly, full cleaning, inspection of all wear points, lubrication of cables and moving parts, blade and gate replacement if worn, tension and calibration adjustment, and a functional test before return.',
      },
      {
        q: 'Can I do basic maintenance myself?',
        a: 'Yes. Daily cleaning of the taping head, cable lubrication, and gate wipe-down can be done in the field. We recommend professional service for anything involving disassembly of the drive mechanism, gooseneck, or pressure settings — improper adjustment causes compounding wear.',
      },
      {
        q: 'What are the most common failure points on auto tapers?',
        a: 'Cable wear and kinking, cracked or worn blades, drive wheel slippage, and gooseneck pivot wear are the most common issues we see. Catching these early — before they cause secondary damage — is the biggest factor in keeping rebuild costs low.',
      },
      {
        q: 'How should I store my tools off-season?',
        a: 'Drain all mud, flush with warm water, dry thoroughly, and apply a light coat of tool oil to all moving metal parts. Store in a dry, temperature-stable environment. Never store with mud sitting in the taping head or pump body.',
      },
      {
        q: 'What type of lubrication should I use on my flat boxes and handles?',
        a: 'Use a non-silicone, water-soluble tool lubricant on blade hinges and spring pivots. Avoid WD-40 on internal drive components — it displaces moisture short-term but leaves a residue that attracts dried compound. Ask us for brand-specific recommendations when you book a service.',
      },
    ],
  },
  {
    id: 'shipping-returns',
    label: 'Shipping & Returns',
    questions: [
      {
        q: 'How is my repaired tool shipped back?',
        a: 'We ship via UPS or FedEx Ground by default. Expedited return shipping is available at cost. All outbound shipments include tracking and are packed in double-wall corrugated boxes with foam padding.',
      },
      {
        q: 'What if my tool is damaged in transit?',
        a: 'All outbound shipments are covered by declared-value insurance. If your tool arrives damaged, photograph the packaging and tool immediately and contact us within 48 hours. We will file the claim and arrange re-service or replacement at no charge to you.',
      },
      {
        q: 'Can I pick up my tool locally?',
        a: 'Yes — local pickup is available by appointment. Select "Local Pickup" as your shipping option in the repair request form and we\'ll coordinate a pickup window once the repair is complete.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently we service tools shipped from within the contiguous United States and Canada. International shipping is evaluated on a case-by-case basis — contact us before submitting.',
      },
    ],
  },
  {
    id: 'parts-schematics',
    label: 'Parts & Schematics',
    questions: [
      {
        q: 'Can I order replacement parts without sending in my tool?',
        a: 'Yes. Our Parts & Schematics section has interactive diagrams for all major brands. You can identify the exact part you need by reference number and add it to your cart directly. Most stocked parts ship within 1–2 business days.',
      },
      {
        q: 'What if a part I need is out of stock?',
        a: 'Out-of-stock parts show an estimated restock date where available. You can request a back-order notification from the part detail page. For urgent repair needs, contact us — we often have service-stock parts not listed in the public catalog.',
      },
      {
        q: 'Are your schematics brand-authorized?',
        a: 'Our schematics are sourced from manufacturer service documentation and supplemented with our own field-verified diagrams. They are intended for identification and ordering purposes. Always follow manufacturer service guidelines for assembly procedures.',
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Single accordion item
   ───────────────────────────────────────────────────────────────────────── */
function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--machined-border)',
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 'clamp(0.9rem, 2vw, 1rem)',
          fontWeight: 700,
          color: isOpen ? 'var(--primary-600)' : '#0f172a',
          lineHeight: 1.4,
          transition: 'color 0.18s',
        }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0,
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: isOpen ? 'var(--primary-600)' : 'rgba(15,23,42,0.06)',
          border: isOpen ? 'none' : '1px solid var(--machined-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s, border 0.18s',
        }}>
          <svg
            width="12" height="12"
            viewBox="0 0 24 24" fill="none"
            stroke={isOpen ? 'white' : '#64748b'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.22s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <Motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              margin: '0 0 20px 0',
              fontSize: 'clamp(0.875rem, 2vw, 0.95rem)',
              color: 'rgba(15,23,42,0.65)',
              lineHeight: 1.7,
              paddingRight: '44px',
            }}>
              {answer}
            </p>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main FAQ page
   ───────────────────────────────────────────────────────────────────────── */
export default function FAQ() {
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('repair-process');

  const toggle = (catId, qIdx) => {
    const key = `${catId}-${qIdx}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeData = FAQ_CATEGORIES.find((c) => c.id === activeCategory);

  const badgeColors = {
    Heavy:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
    Regular: { bg: 'var(--primary-100)', border: 'rgba(37,99,235,0.3)', text: 'var(--primary-700)' },
    Light:   { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' },
  };

  return (
    <div style={{ minHeight: '100vh' }} className="page-wrapper">
      <SEOHead
        title="FAQ — Drywall Tool Repair & Maintenance"
        description="Answers to the most common questions about drywall tool repair services, pricing, warranties, maintenance schedules, parts, and shipping."
        canonical="https://drywalltoolbox.com/faq"
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)',
        padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '99px', padding: '5px 16px',
            fontSize: '0.68rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)', marginBottom: '18px',
          }}>
            Help Center
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 900,
            color: 'white',
            margin: '0 0 16px 0',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            Frequently Asked<br />
            <span style={{ color: '#93c5fd' }}>Questions</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            margin: '0 auto',
            lineHeight: 1.6,
            maxWidth: '520px',
          }}>
            Everything you need to know about our repair services, pricing, warranties,
            tool maintenance, and parts ordering.
          </p>
        </div>
      </section>

      {/* ── Category Nav + Accordion ─────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)',
        background: 'white',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'flex-start' }}>

          {/* ── Sticky category sidebar ── */}
          <nav style={{
            flexShrink: 0,
            width: '210px',
            position: 'sticky',
            top: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
            aria-label="FAQ categories"
          >
            <p style={{
              fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(15,23,42,0.4)',
              margin: '0 0 10px 0',
            }}>
              Categories
            </p>
            {FAQ_CATEGORIES.map((cat) => {
              const active = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    background: active ? 'rgba(37,99,235,0.08)' : 'none',
                    border: 'none',
                    borderLeft: active ? '3px solid var(--primary-600)' : '3px solid transparent',
                    borderRadius: '0 6px 6px 0',
                    padding: '9px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--primary-700)' : 'rgba(15,23,42,0.6)',
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* ── Questions panel ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
                fontWeight: 900, color: '#0f172a',
                margin: '0 0 4px 0', letterSpacing: '-0.02em',
              }}>
                {activeData?.label}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.45)', margin: 0 }}>
                {activeData?.questions.length} questions
              </p>
            </div>

            <AnimatePresence mode="wait">
              <Motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div style={{ borderTop: '1px solid var(--machined-border)' }}>
                  {activeData?.questions.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      question={item.q}
                      answer={item.a}
                      isOpen={!!openItems[`${activeCategory}-${idx}`]}
                      onToggle={() => toggle(activeCategory, idx)}
                    />
                  ))}
                </div>
              </Motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Maintenance Schedule ─────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)',
        background: 'var(--alloy-base)',
        borderTop: '1px solid var(--machined-border)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: '99px', padding: '5px 16px',
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--primary-600)', marginBottom: '14px',
            }}>
              Service Intervals
            </div>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 900, color: '#0f172a',
              margin: '0 0 12px 0', letterSpacing: '-0.025em',
            }}>
              Maintenance Schedule
            </h2>
            <p style={{
              color: 'rgba(15,23,42,0.55)',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              margin: '0 auto',
              maxWidth: '520px',
            }}>
              Industry-recommended service intervals based on your usage level
            </p>
          </div>

          <div style={{
            overflowX: 'auto',
            borderRadius: '16px',
            border: '1px solid var(--machined-border)',
            boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
          }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              background: 'white', fontSize: '0.925rem', minWidth: '480px',
            }}>
              <thead>
                <tr style={{ background: 'var(--alloy-deep)' }}>
                  {['Usage Level & Priority', 'Typical Usage', 'Service Interval'].map((heading) => (
                    <th key={heading} style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.92)',
                      whiteSpace: 'nowrap',
                    }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MAINTENANCE_SCHEDULE.map((row, idx) => {
                  const colors = badgeColors[row.badge] || badgeColors.Regular;
                  return (
                    <tr
                      key={row.level}
                      style={{
                        borderTop: idx === 0 ? 'none' : '1px solid var(--machined-border)',
                        background: idx % 2 === 0 ? 'white' : 'var(--alloy-base)',
                      }}
                    >
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '99px', padding: '3px 10px',
                            fontSize: '0.62rem', fontWeight: 800,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: colors.text, whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            {row.badge}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.level}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', color: 'rgba(15,23,42,0.6)', lineHeight: 1.5 }}>{row.usage}</td>
                      <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--primary-700)' }}>{row.interval}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Still have questions CTA ─────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(3rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3rem)',
        background: 'white',
        borderTop: '1px solid var(--machined-border)',
      }}>
        <div style={{
          maxWidth: '640px', margin: '0 auto', textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 900, color: '#0f172a',
            margin: '0 0 12px 0', letterSpacing: '-0.02em',
          }}>
            Still have questions?
          </h2>
          <p style={{
            color: 'rgba(15,23,42,0.55)',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            margin: '0 0 32px 0', lineHeight: 1.6,
          }}>
            Our team is happy to help. Reach out directly or submit a repair request and we'll be in touch within one business day.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/contact"
              style={{
                display: 'inline-block',
                background: 'var(--primary-600)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.875rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '12px 28px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.18s',
              }}
            >
              Contact Us
            </Link>
            <Link
              to="/repairs"
              style={{
                display: 'inline-block',
                background: 'white',
                color: 'var(--primary-700)',
                fontWeight: 800,
                fontSize: '0.875rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '12px 28px',
                borderRadius: '6px',
                border: '1.5px solid rgba(37,99,235,0.3)',
                textDecoration: 'none',
                transition: 'border-color 0.18s',
              }}
            >
              Repair Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
