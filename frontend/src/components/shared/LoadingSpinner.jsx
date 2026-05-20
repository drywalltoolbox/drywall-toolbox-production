import { motion as Motion, useReducedMotion } from 'framer-motion';
import { dtbDuration, dtbEase } from '../../motion/dtbMotion.js';

/**
 * LoadingSpinner
 *
 * A minimal, modern animated spinner used across all loading states.
 * Props:
 *   size     — 'sm' | 'md' (default) | 'lg'
 *   label    — optional screen-reader text (default: 'Loading')
 *   fullPage — if true, centers in a min-h-[60vh] container;
 *              otherwise always centers in a flex row
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading', fullPage = false }) {
  const reduceMotion = useReducedMotion();
  const dim = size === 'sm' ? 16 : size === 'lg' ? 40 : 28;
  const stroke = size === 'sm' ? 2 : size === 'lg' ? 2.8 : 2.5;
  const r = (dim / 2) - (stroke * 1.5);
  const circ = 2 * Math.PI * r;

  const spinner = (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      style={{
        animation: `dtb-spin ${reduceMotion ? 1.4 : 0.8}s linear infinite`,
        display: 'block',
      }}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        stroke="rgba(37,99,235,0.12)"
        strokeWidth={stroke}
      />
      {/* Arc */}
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        stroke="var(--primary-600, #2563eb)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
        strokeDashoffset={0}
      />
    </svg>
  );

  const minH = fullPage ? '60vh' : undefined;

  return (
    <Motion.div
      role="status"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? dtbDuration.instant : dtbDuration.fast, ease: dtbEase.standard }}
      style={{
        minHeight: minH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {spinner}
      <span className="sr-only">{label}</span>
    </Motion.div>
  );
}
