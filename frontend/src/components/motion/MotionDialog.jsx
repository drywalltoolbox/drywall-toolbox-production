import { forwardRef } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  surfaceVariants,
  reducedSurfaceVariants,
  panelTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

const MotionDialog = forwardRef(function MotionDialog({
  reduceMotion = false,
  className,
  style,
  children,
  onScroll,
  ...rest
}, ref) {
  return (
    <Motion.div
      ref={ref}
      className={className}
      style={style}
      variants={reduceMotion ? reducedSurfaceVariants : surfaceVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduceMotion ? reducedTransition : panelTransition}
      onScroll={onScroll}
      {...rest}
    >
      {children}
    </Motion.div>
  );
});

export default MotionDialog;
