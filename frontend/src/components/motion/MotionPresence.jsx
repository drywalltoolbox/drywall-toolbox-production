import { AnimatePresence } from 'framer-motion';

export default function MotionPresence({ children, mode = 'wait', initial = false }) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}
