export const dtbEase = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.36, 0, 0.66, 0],
};

export const dtbDuration = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.28,
  elevated: 0.36,
};

export const routeVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(3px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: { duration: dtbDuration.fast, ease: dtbEase.exit },
  },
};

export const reducedRouteVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: dtbDuration.instant } },
  exit: { opacity: 0, transition: { duration: dtbDuration.instant } },
};

export const surfaceVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: dtbDuration.elevated, ease: dtbEase.emphasized },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: { duration: dtbDuration.fast, ease: dtbEase.exit },
  },
};

export const reducedSurfaceVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dtbDuration.instant } },
  exit: { opacity: 0, transition: { duration: dtbDuration.instant } },
};

export const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(14px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' },
};

export const reducedBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const backdropTransition = { duration: 0.24, ease: [0.32, 0.72, 0, 1] };
export const panelTransition = { duration: dtbDuration.elevated, ease: dtbEase.emphasized };
export const reducedTransition = { duration: dtbDuration.instant, ease: 'linear' };

export const mobileSheetTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

export const mobileSheetVariants = {
  hidden: { opacity: 0, y: '18%', scale: 0.985, filter: 'blur(2px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: '12%', scale: 0.99, filter: 'blur(1px)' },
};
