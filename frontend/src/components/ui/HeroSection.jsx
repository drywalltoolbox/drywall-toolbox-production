/**
 * ui/HeroSection.jsx — Full-width dark centered hero
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import TrustedBrands from './TrustedBrands';
import NavigationCarousel from './NavigationCarousel';

const HERO_TITLE_AURORA_COLORS = [
  '#ffffff',
  '#d7dde8',
  '#ffffff',
  '#bfc8d6',
  '#6f7887',
  '#f8fafc',
  '#cfd7e4',
  '#ffffff',
];

const AuroraText = memo(function AuroraText({
  children,
  className = '',
  colors = HERO_TITLE_AURORA_COLORS,
  speed = 0.62,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(110deg, ${colors.join(', ')}, ${colors[0]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animationDuration: `${10 / speed}s`,
  };

  return (
    <span className={`dtb-aurora-text ${className}`}>
      <span className="dtb-sr-only">{children}</span>
      <span className="dtb-aurora-text__visible" style={gradientStyle} aria-hidden="true">
        {children}
      </span>
    </span>
  );
});

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const charContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.024, delayChildren: 0.08 } } };
const charVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.40, ease: [0.16, 1, 0.3, 1] } },
};

function formatCharForAnimation(char) {
  return char === ' ' ? '\u00A0' : char;
}

function AnimatedAuroraLine({ line, lineIndex }) {
  return (
    <span style={{ display: 'block' }}>
      <AuroraText>
        {line.split('').map((char, charIndex) => (
          <Motion.span
            key={`${lineIndex}-${charIndex}`}
            variants={charVariant}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {formatCharForAnimation(char)}
          </Motion.span>
        ))}
      </AuroraText>
    </span>
  );
}

function SlideInTitle({ lines }) {
  return (
    <Motion.h1
      className="dtb-hero-title-gradient"
      variants={charContainer}
      initial="hidden"
      animate="visible"
      style={{
        margin: '0 0 24px',
        fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
        fontWeight: 800,
        lineHeight: 1.07,
        letterSpacing: '-0.03em',
      }}
    >
      {lines.map((line, li) => (
        <AnimatedAuroraLine key={li} line={line} lineIndex={li} />
      ))}
    </Motion.h1>
  );
}

export default function HeroSection({
  title,
  titleLines,
  subtitle,
  ctaLinks = [],
  brands = [],
  showCarousel = true,
  className = '',
}) {
  return (
    <section
      className={`dtb-ui-hero${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '520px',
        overflow: 'hidden',
        background: '#070d1c',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 0%, rgba(29,78,216,0.32) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 110%, rgba(56,189,248,0.13) 0%, transparent 55%)' }} />

      <Motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: 'clamp(4rem, 8vw, 6rem) clamp(1.25rem, 5vw, 3rem) clamp(2.5rem, 5vw, 3.5rem)',
          maxWidth: '860px',
          margin: '0 auto',
          width: '100%',
        }}
      >
[SNIPPED_FOR_BREVITY]
      </Motion.div>

      {showCarousel && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            marginBottom: 'clamp(1.2rem, 3vw, 1.9rem)',
          }}
        >
          <NavigationCarousel />
        </div>
      )}

      {brands.length > 0 && showCarousel && (
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            zIndex: 1,
            width: 'min(920px, calc(100% - 2.5rem))',
            height: '1px',
            margin: '0 auto clamp(1.05rem, 2.8vw, 1.7rem)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(226,232,240,0.44) 18%, rgba(248,250,252,0.75) 50%, rgba(226,232,240,0.44) 82%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}

      {brands.length > 0 && <TrustedBrands brands={brands} title="Trusted Brands" speed={32} transparent />}
    </section>
  );
}
