import { forwardRef } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  mobileSheetVariants,
  reducedSurfaceVariants,
  mobileSheetTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

const MotionDrawer = forwardRef(function MotionDrawer({
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
      variants={reduceMotion ? reducedSurfaceVariants : mobileSheetVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduceMotion ? reducedTransition : mobileSheetTransition}
      onScroll={onScroll}
      {...rest}
    >
      {children}
    </Motion.div>
  );
});

export default MotionDrawer;
