/**
 * PageTransition
 *
 * Lightweight route transition wrapper. Motion is intentionally limited to
 * opacity/transform so page changes feel immediate and do not trigger expensive
 * filter paints on mobile GPUs.
 */
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { routeVariants, reducedRouteVariants } from '../../motion/dtbMotion.js';

export default function PageTransition({ children, locationKey }) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedRouteVariants : routeVariants;

  return (
    <AnimatePresence initial={false}>
      <Motion.div
        key={locationKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '100%',
          minHeight: '100%',
          willChange: reduceMotion ? 'opacity' : 'transform, opacity',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </Motion.div>
    </AnimatePresence>
  );
}
