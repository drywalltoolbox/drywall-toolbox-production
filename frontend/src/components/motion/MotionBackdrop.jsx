import { motion as Motion } from 'framer-motion';
import {
  backdropVariants,
  reducedBackdropVariants,
  backdropTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

export default function MotionBackdrop({
  reduceMotion = false,
  className = '',
  onClick,
  style,
  zIndex,
}) {
  return (
    <Motion.div
      className={className}
      style={{ zIndex, ...style }}
      variants={reduceMotion ? reducedBackdropVariants : backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduceMotion ? reducedTransition : backdropTransition}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
