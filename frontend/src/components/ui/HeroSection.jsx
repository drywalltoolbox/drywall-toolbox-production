/**
 * ui/HeroSection.jsx — Glassmorphism two-column hero
 *
 * Props:
 *   title        string | ReactNode
 *   subtitle     string
 *   ctaLinks     [{ to, label, variant? }]
 *   brands       [{ name, src, to }]   (optional logo row)
 *   stats        [{ value, label }]    (optional stat strip — legacy)
 *   children     ReactNode             (optional slot below CTAs)
 *   className    string
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Truck, Wrench } from 'lucide-react';
import Button from './Button.jsx';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 28, scale: 0.96 },
  visible:  { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Glass card data ─────────────────────────────────────────────────────── */
const GLASS_CARDS = [
  {
    icon: Truck,
    iconGradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    title: 'Free Shipping',
    body: 'On all qualifying orders $75+ to the contiguous USA. Same-day dispatch by 12 PM CST.',
  },
  {
    icon: Wrench,
    iconGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    title: 'Expert Repair',
    body: 'Professional tool repair by industry-trained technicians. Fast turnaround, warranty protected.',
  },
];

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function HeroSection({
  title,
  subtitle,
  ctaLinks = [],
  brands = [],
  stats: _stats = [],
  children,
  className = '',
}) {
  return (
    <section
      className={`dtb-ui-hero${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(150deg, #ffffff 0%, #f4f6f9 40%, #eaedf2 75%, #e2e6ed 100%)',
        padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1.5rem, 5vw, 3rem)',
      }}
    >
      {/* ── Mesh gradient blobs ─────────────────────────────────────────── */}
      <Motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.80, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(148,163,184,0.30) 0%, rgba(203,213,225,0.15) 45%, transparent 70%)',
          filter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />
      <Motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.70, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        style={{
          position: 'absolute', bottom: '-100px', left: '-80px',
          width: '440px', height: '440px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(186,199,216,0.28) 0%, rgba(226,232,240,0.12) 50%, transparent 72%)',
          filter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />
      <Motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.30, 0.50, 0.30] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(148,163,184,0.18) 0%, transparent 65%)',
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', gap: 'clamp(2rem, 6vw, 5rem)',
      }}>

        {/* ── LEFT: Text ──────────────────────────────────────────────── */}
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ flex: '1 1 0', minWidth: 0 }}
        >
          {/* Eyebrow pill */}
          <Motion.div variants={itemVariants}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'rgba(29,78,216,0.07)',
              border: '1px solid rgba(29,78,216,0.20)',
              borderRadius: '999px', padding: '5px 16px',
              fontSize: '0.67rem', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#1d4ed8', marginBottom: '24px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#2563eb', flexShrink: 0,
                animation: 'dtb-hero-pulse 2s ease-in-out infinite',
              }} />
              Pro Drywall Tools
            </div>
          </Motion.div>

          {/* Headline */}
          <Motion.h1
            variants={itemVariants}
            style={{
              color: '#1d4ed8',
              fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.07,
              letterSpacing: '-0.035em',
            }}
          >
            {title}
          </Motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <Motion.p
              variants={itemVariants}
              style={{
                color: '#475569',
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                margin: '0 0 36px',
                lineHeight: 1.70,
                maxWidth: '520px',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Motion.p>
          )}

          {/* CTA buttons */}
          {ctaLinks.length > 0 && (
            <Motion.div
              variants={itemVariants}
              style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: brands.length > 0 ? '40px' : '0' }}
            >
              {ctaLinks.map(({ to, label }, i) => (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <Button
                    variant={i === 0 ? 'primary' : 'outline'}
                    size="lg"
                    style={i === 0 ? {
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.22)',
                      color: 'white',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '14px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    } : {
                      color: 'rgba(255,255,255,0.85)',
                      borderColor: 'transparent',
                      background: 'transparent',
                    }}
                  >
                    {label}
                  </Button>
                </Link>
              ))}
            </Motion.div>
          )}

          {children}

          {/* Brand logos */}
          {brands.length > 0 && (
            <Motion.div variants={itemVariants} style={{ marginTop: ctaLinks.length > 0 ? '0' : '4px' }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#94a3b8', marginBottom: '14px',
              }}>
                Trusted Brands
              </p>
              <div style={{ display: 'flex', gap: 'clamp(14px, 3vw, 28px)', alignItems: 'center', flexWrap: 'wrap' }}>
                {brands.map(({ name, src, to }) => (
                  <Link
                    key={name}
                    to={to}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.querySelector('img').style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.querySelector('img').style.opacity = '0.65'; }}
                  >
                    <img
                      src={src} alt={name} loading="lazy"
                      style={{
                        height: 'clamp(20px, 3vw, 28px)', width: 'auto', objectFit: 'contain',
                        filter: 'none',
                        opacity: 0.65, transition: 'opacity 0.2s',
                      }}
                    />
                  </Link>
                ))}
              </div>
            </Motion.div>
          )}
        </Motion.div>

        {/* ── RIGHT: Floating glass cards ─────────────────────────────── */}
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            flex: '0 0 auto',
            width: 'clamp(280px, 36vw, 420px)',
            position: 'relative',
            height: '360px',
            alignSelf: 'center',
          }}
        >
          {/* Card 1 — top-right, prominent */}
          <Motion.div
            variants={cardVariants}
            whileHover={{
              y: -8,
              scale: 1.03,
              boxShadow: '0 20px 56px rgba(5,10,31,0.55), 0 0 0 1px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
              transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
            }}
            style={{
              position: 'absolute', top: '0', right: '0',
              width: '82%',
              padding: '28px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #0a0e27 0%, #0f1535 40%, #0a1130 70%, #050a1f 100%)',
              border: '1px solid rgba(59,130,246,0.22)',
              boxShadow: '0 8px 40px rgba(5,10,31,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
              zIndex: 2,
              cursor: 'default',
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: GLASS_CARDS[0].iconGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(37,99,235,0.40)',
            }}>
              <Truck size={20} color="white" />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
              {GLASS_CARDS[0].title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.50)', lineHeight: 1.6 }}>
              {GLASS_CARDS[0].body}
            </p>
          </Motion.div>

          {/* Card 2 — bottom-left, slightly recessed */}
          <Motion.div
            variants={cardVariants}
            transition={{ delay: 0.15 }}
            whileHover={{
              y: -6,
              scale: 1.0,
              boxShadow: '0 16px 44px rgba(5,10,31,0.50), 0 0 0 1px rgba(59,130,246,0.36), inset 0 1px 0 rgba(255,255,255,0.08)',
              transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
            }}
            style={{
              position: 'absolute', bottom: '0', left: '0',
              width: '76%',
              padding: '22px 24px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0f1535 0%, #0a1130 50%, #020408 100%)',
              border: '1px solid rgba(59,130,246,0.16)',
              boxShadow: '0 6px 28px rgba(5,10,31,0.40), inset 0 1px 0 rgba(255,255,255,0.04)',
              zIndex: 1,
              scale: 0.96,
              transformOrigin: 'bottom left',
              cursor: 'default',
            }}
          >
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: GLASS_CARDS[1].iconGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 4px 14px rgba(14,40,140,0.40)',
            }}>
              <Wrench size={18} color="white" />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '0.88rem', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
              {GLASS_CARDS[1].title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.55 }}>
              {GLASS_CARDS[1].body}
            </p>
          </Motion.div>
        </Motion.div>
      </div>

      <style>{`
        @keyframes dtb-hero-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </section>
  );
}
