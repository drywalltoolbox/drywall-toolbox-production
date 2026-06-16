import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import {
  dtbDuration,
  dtbEase,
  reducedTransition,
} from '../motion/dtbMotion.js';

const WorkflowTransitionContext = createContext(null);

export function WorkflowTransitionProvider({ children }) {
  const [workflow, setWorkflow] = useState(null);
  const reduceMotion = useReducedMotion();

  const showWorkflow = useCallback((payload = {}) => {
    if (payload.blocking === false) {
      return;
    }

    setWorkflow({
      label: payload.label || 'Processing…',
      sublabel: payload.sublabel || '',
      blocking: true,
    });
  }, []);

  const hideWorkflow = useCallback(() => {
    setWorkflow(null);
  }, []);

  const runWorkflow = useCallback(async (payload, task) => {
    showWorkflow(payload);
    try {
      return await task();
    } finally {
      hideWorkflow();
    }
  }, [hideWorkflow, showWorkflow]);

  const value = useMemo(() => ({
    workflow,
    showWorkflow,
    hideWorkflow,
    runWorkflow,
  }), [hideWorkflow, runWorkflow, showWorkflow, workflow]);

  return (
    <WorkflowTransitionContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {workflow && (
          <Motion.div
            className="dtb-workflow-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? reducedTransition : { duration: dtbDuration.fast, ease: dtbEase.standard }}
            aria-live="polite"
            aria-busy="true"
            role="alertdialog"
          >
            <Motion.div
              className="dtb-workflow-card"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
              transition={reduceMotion
                ? reducedTransition
                : { duration: dtbDuration.normal, ease: dtbEase.standard }}
            >
              <div className="dtb-workflow-spinner" aria-hidden="true" />
              <strong>{workflow.label}</strong>
              {workflow.sublabel ? <p>{workflow.sublabel}</p> : null}
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </WorkflowTransitionContext.Provider>
  );
}

export function useWorkflowTransition() {
  const context = useContext(WorkflowTransitionContext);
  if (!context) {
    throw new Error('useWorkflowTransition must be used inside WorkflowTransitionProvider');
  }
  return context;
}
