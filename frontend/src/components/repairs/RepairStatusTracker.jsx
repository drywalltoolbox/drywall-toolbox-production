/**
 * frontend/src/components/repairs/RepairStatusTracker.jsx
 *
 * Visual repair status tracker with integrated customer progress updates.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { REPAIR_STATUS_PROGRESS } from '../../api/repairs.js';

const MILESTONES = [
  { key: 'submitted',   label: 'Submitted'  },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready_to_ship', label: 'Ready to Ship' },
  { key: 'completed',   label: 'Completed'  },
];

const MILESTONE_ORDER = {
  submitted:         0,
  reviewed:          0,
  awaiting_customer: 0,
  approved:          1,
  quoted:            1,
  quote_accepted:    1,
  parts_allocated:   1,
  in_progress:       1,
  ready_to_ship:     2,
  completed:         3,
  closed:            3,
  cancelled:        -1,
  quote_declined:   -1,
};

const TERMINAL_NEGATIVE = [ 'cancelled', 'quote_declined' ];

function fmt( iso ) {
  if ( ! iso ) return '—';
  try {
    return new Date( iso ).toLocaleString( undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    } );
  } catch {
    return iso;
  }
}

function ProgressUpdates({ events = [] }) {
  const visibleEvents = Array.isArray(events) ? events.slice(-4).reverse() : [];
  if (!visibleEvents.length) return null;

  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Progress Updates</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Latest first</span>
      </div>
      <ol className="space-y-3">
        {visibleEvents.map((event, index) => (
          <li key={`${event.type || event.label}-${event.occurred_at || index}`} className="flex gap-3">
            <span className="mt-1.5 flex h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100" />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-neutral-800">{event.label || 'Repair updated'}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{fmt(event.occurred_at || event.created_at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function RepairStatusTracker( {
  status,
  label,
  submittedAt,
  lastUpdatedAt,
  trackingNumber,
  events = [],
} ) {
  const progress       = REPAIR_STATUS_PROGRESS[ status ] ?? 0;
  const milestoneIndex = MILESTONE_ORDER[ status ] ?? 0;
  const isNegative     = TERMINAL_NEGATIVE.includes( status );
  const isCompleted    = status === 'completed' || status === 'closed';

  const accentColor = isNegative ? 'bg-red-400' : isCompleted ? 'bg-green-400' : 'bg-blue-500';
  const labelColor  = isNegative ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-blue-700';
  const indicatorColor = isNegative ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [ 0.25, 0.46, 0.45, 0.94 ] }}
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      <motion.div
        className={ `h-1 ${ accentColor }` }
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
      />

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Current Status
            </div>
            <motion.div
              key={ status }
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={ `text-xl font-bold leading-tight ${ labelColor }` }
            >
              { label || status }
            </motion.div>
          </div>
          <span className={ `mt-1 inline-flex h-2.5 w-2.5 rounded-full ${ indicatorColor }` } aria-hidden="true" />
        </div>

        <AnimatePresence>
          { isNegative && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm leading-relaxed text-red-700">
                { status === 'cancelled'
                  ? 'This repair request has been cancelled. Please contact us if you have questions.'
                  : "The repair quote was declined. Contact us if you'd like to revisit your options." }
              </div>
            </motion.div>
          ) }
        </AnimatePresence>

        { ! isNegative && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                className={ `h-full rounded-full ${ isCompleted ? 'bg-green-500' : 'bg-blue-500' }` }
                initial={{ width: 0 }}
                animate={{ width: `${ progress }%` }}
                transition={{ duration: 1.0, delay: 0.2, ease: [ 0.25, 0.46, 0.45, 0.94 ] }}
                role="progressbar"
                aria-valuenow={ progress }
                aria-valuemin={ 0 }
                aria-valuemax={ 100 }
                aria-label={ `Repair progress: ${ progress }%` }
              />
            </div>

            <div className="mt-3.5 flex justify-between">
              { MILESTONES.map( ( m, i ) => {
                const done   = milestoneIndex > i;
                const active = milestoneIndex === i && ! isCompleted;
                const future = ! done && ! active;

                return (
                  <div key={ m.key } className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      { active && <span aria-hidden="true" className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" /> }
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.07, duration: 0.3, ease: 'backOut' }}
                        className={ [
                          'z-10 h-3.5 w-3.5 rounded-full border-2 transition-colors duration-500',
                          done   ? 'border-blue-500 bg-blue-500'          : '',
                          active ? 'border-blue-500 bg-white shadow-md'   : '',
                          future ? 'border-neutral-300 bg-white'          : '',
                        ].join( ' ' ) }
                      />
                    </div>
                    <span className={ [
                      'text-center text-[10px] font-medium leading-tight',
                      active ? 'text-blue-700'   : '',
                      done   ? 'text-blue-400'   : '',
                      future ? 'text-neutral-400' : '',
                    ].join( ' ' ) }>
                      { m.label }
                    </span>
                  </div>
                );
              } ) }
            </div>
          </div>
        ) }

        <div className="grid grid-cols-2 gap-2.5">
          { [
            { label: 'Submitted',    value: fmt( submittedAt )    },
            { label: 'Last Updated', value: fmt( lastUpdatedAt )  },
          ].map( ( { label: dtLabel, value }, i ) => (
            <motion.div
              key={ dtLabel }
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.3 }}
              className="rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5"
            >
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                { dtLabel }
              </div>
              <div className="text-xs font-semibold leading-snug text-neutral-700">
                { value }
              </div>
            </motion.div>
          ) ) }
        </div>

        <ProgressUpdates events={events} />

        <AnimatePresence>
          { trackingNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-emerald-50 p-4"
            >
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600">
                Shipping Tracking
              </div>
              <div className="font-mono text-base font-bold leading-none tracking-wider text-green-800">
                { trackingNumber }
              </div>
              <p className="mt-1.5 text-xs text-green-600">
                Use this number to track your shipment with your carrier.
              </p>
            </motion.div>
          ) }
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
