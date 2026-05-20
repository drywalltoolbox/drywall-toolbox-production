/**
 * PageTransition
 *
 * Wraps page content with a smooth fade + upward-drift entrance and a quick
 * fade-out exit on every route change, powered by Framer Motion.
 *
 * Usage:
 *   <PageTransition locationKey={location.key}>
 *     <Suspense>…<Routes>…</Routes></Suspense>
 *   </PageTransition>
 *
 * `AnimatePresence mode="wait"` ensures the outgoing page fully exits before
 * the incoming page starts entering, preventing overlapping content flashes.
 * The `locationKey` prop is used as the React key on the animated wrapper so
 * a new animation plays on every pathname change. Using `location.pathname`
 * (not `location.key`) prevents in-page `navigate({replace:true})` calls
 * (e.g. syncing query params) from re-triggering the transition.
 *
 * Accessibility: when `prefers-reduced-motion: reduce` is active the animation
 * is skipped entirely — only a clean opacity cross-fade is applied to prevent
 * triggering motion sensitivity.
 */
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { routeVariants, reducedRouteVariants } from '../../motion/dtbMotion.js';

export default function PageTransition( { children, locationKey } ) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedRouteVariants : routeVariants;

  return (
    <AnimatePresence mode="wait" initial={ false }>
      <Motion.div
        key={ locationKey }
        variants={ variants }
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '100%',
          minHeight: '100%',
          willChange: reduceMotion ? 'opacity' : 'transform, opacity, filter',
          transform: 'translateZ(0)',
        }}
      >
        { children }
      </Motion.div>
    </AnimatePresence>
  );
}
