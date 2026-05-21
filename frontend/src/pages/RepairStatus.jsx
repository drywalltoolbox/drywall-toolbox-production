/**
 * frontend/src/pages/RepairStatus.jsx
 *
 * Public repair tracking page — /repairs/status/:id
 *
 * - Uses :id from URL params + ?token=xxx from search params
 * - No auth required; token is the public repair token issued at submission
 * - If no token is present and user is not authenticated, shows a token entry form
 * - Customer-safe timeline only (no backend/system event stream rendering)
 */

import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, SearchX, RefreshCw } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import useRepairStatus       from '../hooks/useRepairStatus.js';
import RepairStatusTracker   from '../components/repairs/RepairStatusTracker.jsx';
import RepairTimeline        from '../components/repairs/RepairTimeline.jsx';
import RepairQuoteReview     from '../components/repairs/RepairQuoteReview.jsx';
import RepairIntegrationNotice from '../components/repairs/RepairIntegrationNotice.jsx';
import RepairUpdateComposer  from '../components/repairs/RepairUpdateComposer.jsx';
import { REPAIR_STATUS_LABELS } from '../api/repairs.js';

// ─── Token entry form (shown when no token in URL) ────────────────────────────

function TokenEntryForm( { onSubmit } ) {
  const [ repairId, setRepairId ] = useState( '' );
  const [ token,    setToken    ] = useState( '' );
  const [ error,    setError    ] = useState( '' );

  const handleSubmit = ( e ) => {
    e.preventDefault();
    if ( ! repairId.trim() || ! token.trim() ) {
      setError( 'Please enter both your Repair ID and tracking token.' );
      return;
    }
    setError( '' );
    onSubmit( repairId.trim(), token.trim() );
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [ 0.25, 0.46, 0.45, 0.94 ] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 shadow-sm"
          >
            <Search size={ 26 } className="text-blue-500" strokeWidth={ 1.75 } />
          </motion.div>
          <h1 className="text-2xl font-bold text-neutral-900">Track Your Repair</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Enter your repair ID and the tracking token from your confirmation email.
          </p>
        </div>

        <form onSubmit={ handleSubmit } className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="repair-id" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Repair ID
            </label>
            <input
              id="repair-id"
              type="text"
              value={ repairId }
              onChange={ ( e ) => setRepairId( e.target.value ) }
              placeholder="e.g. 1042"
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-neutral-50 focus:bg-white"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="repair-token" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Tracking Token
            </label>
            <input
              id="repair-token"
              type="text"
              value={ token }
              onChange={ ( e ) => setToken( e.target.value ) }
              placeholder="From your confirmation email"
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-neutral-50 focus:bg-white"
              autoComplete="off"
            />
          </div>

          <AnimatePresence>
            { error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-600 overflow-hidden"
                role="alert"
              >
                { error }
              </motion.p>
            ) }
          </AnimatePresence>

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all"
          >
            Look Up Repair →
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Need help?{' '}
          <Link to="/contact" className="text-blue-600 hover:underline">Contact us</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton( { className } ) {
  return <div className={ `animate-pulse rounded bg-neutral-100 ${ className }` } />;
}

function StatusSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

// ─── Error display ────────────────────────────────────────────────────────────

function ErrorDisplay( { message, onRetry } ) {
  const isNotFound  = message?.toLowerCase().includes( 'not found' ) || message?.includes( '404' );
  const isUnauth    = message?.toLowerCase().includes( 'token' ) || message?.includes( '401' ) || message?.includes( '403' );

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className={ `w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${ isNotFound ? 'bg-neutral-100' : 'bg-yellow-50' }` }
        >
          { isNotFound
            ? <SearchX size={ 28 } className="text-neutral-400" strokeWidth={ 1.5 } />
            : <AlertTriangle size={ 28 } className="text-yellow-500" strokeWidth={ 1.5 } />
          }
        </motion.div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">
          { isNotFound ? 'Repair Not Found' : isUnauth ? 'Access Denied' : 'Something Went Wrong' }
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          { isNotFound
            ? 'We couldn\'t find a repair matching this ID. Please double-check your repair ID and token.'
            : isUnauth
            ? 'The tracking token is invalid or has expired. Please check your confirmation email.'
            : message || 'An unexpected error occurred. Please try again.' }
        </p>
        <div className="flex gap-3 justify-center">
          { onRetry && (
            <button
              onClick={ onRetry }
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.97] transition-all"
            >
              Retry
            </button>
          ) }
          <Link
            to="/repairs"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Submit a Repair
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RepairStatus() {
  const { id: urlRepairId }    = useParams();
  const [ searchParams ]       = useSearchParams();
  const urlToken               = searchParams.get( 'token' );

  // When the token-entry form is submitted, we store the resolved IDs here
  const [ resolvedId,    setResolvedId    ] = useState( urlRepairId  || null );
  const [ resolvedToken, setResolvedToken ] = useState( urlToken     || null );

  const needsTokenEntry = ! resolvedId || ! resolvedToken;

  const { data, loading, error, refresh } = useRepairStatus(
    needsTokenEntry ? null : resolvedId,
    needsTokenEntry ? null : resolvedToken
  );

  const customerTimeline = toCustomerTimeline( data?.timeline );

  const handleTokenFormSubmit = ( repairId, token ) => {
    setResolvedId( repairId );
    setResolvedToken( token );
  };

  const handleQuoteResponse = () => {
    // Re-fetch status after quote response
    setTimeout( () => refresh(), 800 );
  };

  if ( needsTokenEntry ) {
    return (
      <>
        <SEOHead title="Track Your Repair | Drywall Toolbox" />
        <TokenEntryForm onSubmit={ handleTokenFormSubmit } />
      </>
    );
  }

  if ( error && ! data ) {
    return (
      <>
        <SEOHead title="Repair Status | Drywall Toolbox" />
        <ErrorDisplay message={ error } onRetry={ refresh } />
      </>
    );
  }

  const status = data?.status;
  const label  = data?.label || REPAIR_STATUS_LABELS[ status ] || status;

  return (
    <>
      <SEOHead
        title={ data ? `Repair DTB-${ resolvedId } — ${ label } | Drywall Toolbox` : 'Repair Status | Drywall Toolbox' }
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto px-4 py-8 space-y-4"
      >
        {/* ── Page header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Repair ID</div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold text-neutral-900">DTB-{ resolvedId }</h1>
            </div>
          </div>
          <button
            onClick={ refresh }
            disabled={ loading }
            aria-label="Refresh status"
            className="p-2 text-neutral-400 hover:text-blue-600 disabled:opacity-40 transition-colors rounded-xl hover:bg-blue-50"
          >
            <RefreshCw
              size={ 17 }
              className={ loading ? 'animate-spin' : '' }
            />
          </button>
        </motion.div>

        {/* ── Status tracker ────────────────────────────────────────── */}
        { loading && ! data ? (
          <StatusSkeleton />
        ) : data ? (
          <RepairStatusTracker
            status={ data.status }
            label={ label }
            submittedAt={ data.submitted_at }
            lastUpdatedAt={ data.last_updated_at }
            trackingNumber={ data.tracking_number }
          />
        ) : null }

        {/* ── Integration notice ─────────────────────────────────────── */}
        { status && (
          <RepairIntegrationNotice status={ status } />
        ) }

        {/* ── Quote review ──────────────────────────────────────────── */}
        { status === 'quoted' && (
          <RepairQuoteReview
            repairId={ resolvedId }
            token={ resolvedToken }
            onAccepted={ handleQuoteResponse }
            onDeclined={ handleQuoteResponse }
          />
        ) }

        {/* ── Unified customer update composer ─────────────────────── */}
        { data && ! [ 'completed', 'closed', 'cancelled', 'quote_declined' ].includes( status ) && (
          <RepairUpdateComposer
            repairId={ resolvedId }
            token={ resolvedToken }
            onSubmitted={ () => refresh() }
          />
        ) }

        {/* ── Timeline ──────────────────────────────────────────────── */}
        { ( loading && ! data ) ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            { [ 1, 2 ].map( ( i ) => (
              <div key={ i } className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ) ) }
          </div>
        ) : (
          <RepairTimeline events={ customerTimeline } />
        ) }

        {/* ── Stale-data error banner ────────────────────────────────── */}
        <AnimatePresence>
          { error && data && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs" role="alert">
                Could not refresh status — showing last known data.
              </div>
            </motion.div>
          ) }
        </AnimatePresence>

        <div className="text-center pt-2 pb-4">
          <Link to="/contact" className="text-xs text-neutral-400 hover:text-blue-600 underline transition-colors">
            Need help with your repair?
          </Link>
        </div>
      </motion.div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCustomerTimeline( timeline ) {
  if ( ! Array.isArray( timeline ) ) return [];

  const labelByType = {
    'repair.submitted': 'Request submitted',
    'repair.reviewed': 'Under review',
    'repair.awaiting_customer': 'Waiting on customer details',
    'repair.approved': 'Repair approved',
    'repair.quoted': 'Quote issued',
    'repair.quote_accepted': 'Quote accepted',
    'repair.quote_declined': 'Quote declined',
    'repair.parts_allocated': 'Parts prepared',
    'repair.in_progress': 'Repair in progress',
    'repair.ready_to_ship': 'Ready to ship',
    'repair.completed': 'Repair completed',
    'repair.closed': 'Repair closed',
    'repair.cancelled': 'Repair cancelled',
    'repair.note_added': 'Repair updated',
    'repair.media_uploaded': 'Photos received',
  };

  return timeline
    .map( ( event ) => {
      const type = typeof event?.type === 'string' ? event.type : event?.event_type;
      const occurredAt = event?.occurred_at || event?.created_at;
      if ( typeof type !== 'string' || ! type.startsWith( 'repair.' ) ) return null;
      return { ...event, type, occurred_at: occurredAt };
    } )
    .filter( Boolean )
    .map( ( event ) => ( {
      ...event,
      label: labelByType[ event.type ] || event.label || 'Repair updated',
    } ) )
    .sort( ( a, b ) => new Date( a.occurred_at ) - new Date( b.occurred_at ) );
}
