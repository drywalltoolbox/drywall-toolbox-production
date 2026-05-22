/**
 * frontend/src/components/repairs/RepairTimeline.jsx
 *
 * Chronological list of repair lifecycle events.
 * Staggered entrance animation per row, draw-in connector lines.
 *
 * Props:
 *   events  Array<{ type: string, label: string, occurred_at: string }>
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Search, Clock, CheckCircle, FileText, Handshake,
  XCircle, Package, Wrench, Truck, BadgeCheck, Archive, Ban,
  MessageSquare, Camera, ClipboardList,
} from 'lucide-react';

// ─── Event type metadata ──────────────────────────────────────────────────────

const EVENT_META = {
  'repair.submitted':         { Icon: Mail,          color: 'blue'    },
  'repair.reviewed':          { Icon: Search,        color: 'blue'    },
  'repair.awaiting_customer': { Icon: Clock,         color: 'yellow'  },
  'repair.approved':          { Icon: CheckCircle,   color: 'green'   },
  'repair.quoted':            { Icon: FileText,      color: 'yellow'  },
  'repair.quote_accepted':    { Icon: Handshake,     color: 'green'   },
  'repair.quote_declined':    { Icon: XCircle,       color: 'red'     },
  'repair.parts_allocated':   { Icon: Package,       color: 'blue'    },
  'repair.in_progress':       { Icon: Wrench,        color: 'yellow'  },
  'repair.ready_to_ship':     { Icon: Truck,         color: 'green'   },
  'repair.completed':         { Icon: BadgeCheck,    color: 'green'   },
  'repair.closed':            { Icon: Archive,       color: 'neutral' },
  'repair.cancelled':         { Icon: Ban,           color: 'red'     },
  'repair.note_added':        { Icon: MessageSquare, color: 'blue'    },
  'repair.media_uploaded':    { Icon: Camera,        color: 'blue'    },
};

const COLOR_CLASSES = {
  blue:    { dot: 'bg-blue-500',    line: 'bg-blue-200',    text: 'text-blue-700'    },
  green:   { dot: 'bg-green-500',   line: 'bg-green-200',   text: 'text-green-700'   },
  yellow:  { dot: 'bg-yellow-400',  line: 'bg-yellow-200',  text: 'text-yellow-700'  },
  red:     { dot: 'bg-red-500',     line: 'bg-red-200',     text: 'text-red-700'     },
  neutral: { dot: 'bg-neutral-400', line: 'bg-neutral-200', text: 'text-neutral-600' },
};

function getEventMeta( type ) {
  if ( EVENT_META[ type ] ) return EVENT_META[ type ];
  if ( type?.includes( 'cancel' ) )                              return { Icon: Ban,        color: 'red'     };
  if ( type?.includes( 'complete' ) || type?.includes( 'ship' ) ) return { Icon: BadgeCheck, color: 'green'   };
  if ( type?.includes( 'progress' ) )                            return { Icon: Wrench,     color: 'yellow'  };
  return { Icon: ClipboardList, color: 'neutral' };
}

// ─── Timestamp formatter ──────────────────────────────────────────────────────

function fmtRelative( iso ) {
  if ( ! iso ) return '';
  try {
    const diff = Date.now() - new Date( iso ).getTime();
    const mins  = Math.floor( diff / 60_000 );
    const hours = Math.floor( diff / 3_600_000 );
    const days  = Math.floor( diff / 86_400_000 );

    if ( mins < 1   ) return 'Just now';
    if ( mins < 60  ) return `${ mins }m ago`;
    if ( hours < 24 ) return `${ hours }h ago`;
    if ( days < 7   ) return `${ days }d ago`;

    return new Date( iso ).toLocaleDateString( undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    } );
  } catch {
    return iso;
  }
}

function fmtAbsolute( iso ) {
  if ( ! iso ) return '';
  try {
    return new Date( iso ).toLocaleString( undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    } );
  } catch {
    return iso;
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0,   transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RepairTimeline( { events = [] } ) {
  if ( events.length === 0 ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6"
      >
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Timeline</h3>
        <div className="flex flex-col items-center justify-center py-8 text-neutral-300">
          <ClipboardList size={ 32 } strokeWidth={ 1.5 } className="mb-2" />
          <p className="text-sm">No events yet</p>
        </div>
      </motion.div>
    );
  }

  // Newest-first for display
  const sorted = [ ...events ].sort(
    ( a, b ) => new Date( b.occurred_at ) - new Date( a.occurred_at )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6"
    >
      <h3 className="text-sm font-semibold text-neutral-700 mb-5">Timeline</h3>

      <AnimatePresence initial={ true }>
        <motion.ol
          variants={ listVariants }
          initial="hidden"
          animate="visible"
          className="relative"
          aria-label="Repair event timeline"
        >
          { sorted.map( ( event, idx ) => {
            const { Icon, color } = getEventMeta( event.type );
            const colors          = COLOR_CLASSES[ color ] || COLOR_CLASSES.neutral;
            const isLast          = idx === sorted.length - 1;
            const isFirst         = idx === 0;

            return (
              <motion.li
                key={ `${ event.type }-${ event.occurred_at }-${ idx }` }
                variants={ itemVariants }
                className="flex gap-3.5 pb-5 last:pb-0 relative"
              >
                {/* Vertical connector — draw in from top */}
                { ! isLast && (
                  <motion.div
                    aria-hidden="true"
                    initial={{ scaleY: 0, originY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 + idx * 0.07, ease: 'easeOut' }}
                    className={ `absolute left-3.75 top-8 bottom-0 w-0.5 ${ colors.line }` }
                  />
                ) }

                {/* Icon dot */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 + idx * 0.07 }}
                  className={ `w-8 h-8 rounded-full ${ colors.dot } flex items-center justify-center shrink-0 z-10 shadow-sm` }
                >
                  <Icon size={ 14 } strokeWidth={ 2 } className="text-white" />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  { isFirst && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 mb-1">
                      Latest
                    </span>
                  ) }
                  <p className={ `text-sm font-semibold ${ colors.text }` }>
                    { event.label || event.type }
                  </p>
                  { event.message && (
                    <div className="mt-1 leading-relaxed">
                      { event.actor_label && (
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-0.5">
                          { event.actor_label }
                        </p>
                      ) }
                      <p className="text-xs text-neutral-600">
                        { event.message }
                      </p>
                    </div>
                  ) }
                  <p
                    className="text-xs text-neutral-400 mt-0.5"
                    title={ fmtAbsolute( event.occurred_at ) }
                  >
                    { fmtRelative( event.occurred_at ) }
                    <span className="mx-1.5 text-neutral-200">·</span>
                    <span className="text-neutral-300">{ fmtAbsolute( event.occurred_at ) }</span>
                  </p>
                </div>
              </motion.li>
            );
          } ) }
        </motion.ol>
      </AnimatePresence>
    </motion.div>
  );
}
