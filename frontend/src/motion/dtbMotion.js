export const dtbEase = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  soft: [0.2, 0.8, 0.2, 1],
  exit: [0.4, 0, 0.2, 1],
  fade: [0.4, 0, 0.2, 1],
};

export const dtbDuration = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.32,
  elevated: 0.32,
};

export const routeVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.998,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: dtbDuration.normal,
      ease: dtbEase.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -3,
    scale: 0.999,
    transition: {
      duration: 0.18,
      ease: dtbEase.exit,
    },
  },
};

export const reducedRouteVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01, ease: 'linear' } },
  exit: { opacity: 0, transition: { duration: 0.01, ease: 'linear' } },
};

export const surfaceVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.992 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: dtbDuration.normal, ease: dtbEase.standard },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.995,
    transition: { duration: dtbDuration.fast, ease: dtbEase.exit },
  },
};

export const reducedSurfaceVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dtbDuration.instant } },
  exit: { opacity: 0, transition: { duration: dtbDuration.instant } },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const reducedBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const backdropTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] };
export const panelTransition = { duration: dtbDuration.normal, ease: dtbEase.standard };
export const reducedTransition = { duration: dtbDuration.instant, ease: 'linear' };

export const mobileSheetTransition = {
  type: 'tween',
  duration: dtbDuration.normal,
  ease: dtbEase.standard,
};

export const mobileSheetVariants = {
  hidden: { opacity: 0, y: '12%', scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: '8%', scale: 0.995 },
};

export const productModalTransition = {
  type: 'tween',
  duration: 0.38,
  ease: dtbEase.emphasized,
};

export const productModalBackdropTransition = {
  duration: 0.32,
  ease: dtbEase.exit,
};

export const productModalDesktopVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.988,
    transition: { duration: 0.32, ease: dtbEase.exit },
  },
};

export const productModalMobileVariants = {
  hidden: { opacity: 0, y: '14%', scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: '10%',
    scale: 0.994,
    transition: { duration: 0.34, ease: dtbEase.exit },
  },
};
