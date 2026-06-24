import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Box, CheckCircle2, ClipboardCheck, PackageCheck, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import SmartBackButton from '../components/navigation/SmartBackButton.jsx';
import usePublicStatus from '../hooks/usePublicStatus.js';
import { getReturnStatus, RETURN_STATUS_LABELS, RETURN_TERMINAL_STATUSES } from '../api/statusTracking.js';

const STEPS = [
  { key: 'pending_review', label: 'Review', Icon: ClipboardCheck },
  { key: 'approved', label: 'Approved', Icon: CheckCircle2 },
  { key: 'awaiting_item', label: 'Ship Item', Icon: Truck },
  { key: 'item_received', label: 'Received', Icon: Box },
  { key: 'resolved', label: 'Resolution', Icon: PackageCheck },
];

const STEP_INDEX = {
  pending_review: 0,
  approved: 1,
  awaiting_item: 2,
  item_received: 3,
  refund_issued: 4,
  exchange_sent: 4,
  closed: 4,
  rejected: 4,
};

export default function ReturnStatus() {
  const { id } = useParams();
  const [ params ] = useSearchParams();
  const token = params.get( 'token' );
  const needsToken = ! id || ! token;
  const { data, loading, error, refresh } = usePublicStatus(
    needsToken ? null : id,
    needsToken ? null : token,
    getReturnStatus,
    RETURN_TERMINAL_STATUSES
  );

  const status = data?.status || 'pending_review';
  const label = data?.label || RETURN_STATUS_LABELS[ status ] || 'Return Status';

  return (
    <main className="min-h-screen bg-neutral-50">
      <SEOHead title={ data ? `Return ${ data.return_number } - ${ label } | Drywall Toolbox` : 'Return Status | Drywall Toolbox' } />
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SmartBackButton fallbackTo="/dashboard?tab=returns" label="Back to returns" />
            <button
              type="button"
              onClick={ refresh }
              disabled={ loading || needsToken }
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              <RefreshCw size={ 16 } className={ loading ? 'animate-spin' : '' } /> Refresh
            </button>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <RotateCcw size={ 14 } /> Return Tracking
              </div>
              <h1 className="text-3xl font-bold text-neutral-950">{ data?.return_number || `Return #${ id || '' }` }</h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                Track approval, item receipt, and refund or exchange progress from one customer-safe view.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        { needsToken ? (
          <Notice title="Tracking token required" body="Open the return status link from your confirmation screen or email so we can verify access to this return." />
        ) : error && ! data ? (
          <Notice title="Return not available" body={ error } tone="warning" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <StatusPanel status={ status } label={ label } loading={ loading && ! data } />
              <ReturnDetails data={ data } />
              <Timeline events={ toTimeline( data ) } />
            </div>
            <aside className="space-y-5">
              <NextStep status={ status } />
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-neutral-900">Need a hand?</h2>
                <p className="mt-2 text-sm text-neutral-600">Questions about packaging, eligibility, or timing can be handled by support.</p>
                <Link to="/contact" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">Contact support</Link>
              </div>
            </aside>
          </div>
        ) }
      </section>
    </main>
  );
}

function StatusPanel( { status, label, loading } ) {
  const active = STEP_INDEX[ status ] ?? 0;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current Status</p>
          <h2 className="mt-1 text-xl font-bold text-neutral-950">{ loading ? 'Loading...' : label }</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{ Math.min( 100, ( active + 1 ) * 20 ) }%</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        { STEPS.map( ( step, index ) => {
          const Icon = step.Icon;
          const complete = index <= active;
          return (
            <div key={ step.key } className="min-w-0">
              <div className={ `flex h-10 items-center justify-center rounded-xl ${ complete ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-400' }` }>
                <Icon size={ 18 } />
              </div>
              <p className="mt-2 truncate text-center text-[11px] font-semibold text-neutral-600">{ step.label }</p>
            </div>
          );
        } ) }
      </div>
    </div>
  );
}

function ReturnDetails( { data } ) {
  const items = [
    [ 'Order', data?.order_number ],
    [ 'Reason', data?.reason ],
    [ 'Resolution', formatSlug( data?.resolution ) ],
    [ 'Submitted', formatDate( data?.created_at ) ],
    [ 'Last Updated', formatDate( data?.last_updated_at ) ],
  ].filter( ( [ , value ] ) => value );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">Return Details</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        { items.map( ( [ label, value ] ) => (
          <div key={ label }>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{ label }</dt>
            <dd className="mt-1 text-sm text-neutral-800">{ value }</dd>
          </div>
        ) ) }
      </dl>
    </div>
  );
}

function NextStep( { status } ) {
  const copy = {
    pending_review: 'Our team is checking eligibility, order history, and the reason for return.',
    approved: 'Your return is approved. Watch for RMA and shipping instructions from our team.',
    awaiting_item: 'Package the item securely and send it using the instructions provided.',
    item_received: 'We have the item and are inspecting it before issuing the final resolution.',
    refund_issued: 'The refund has been issued. Bank posting times vary by payment method.',
    exchange_sent: 'Your exchange is on the way. Use your order tracking email for carrier movement.',
    rejected: 'This return was not approved. Contact support if you have additional details.',
    closed: 'This return is closed and no further action is currently needed.',
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">Next Step</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{ copy[ status ] || copy.pending_review }</p>
    </div>
  );
}

function Timeline( { events } ) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">Return Timeline</h2>
      <ol className="mt-4 space-y-3">
        { events.map( ( event, index ) => (
          <li key={ `${ event.label }-${ index }` } className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-neutral-800">{ event.label }</p>
              <p className="text-xs text-neutral-500">{ formatDate( event.occurred_at ) }</p>
            </div>
          </li>
        ) ) }
      </ol>
    </div>
  );
}

function Notice( { title, body, tone = 'neutral' } ) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
      <AlertTriangle className={ `mx-auto mb-3 ${ tone === 'warning' ? 'text-amber-500' : 'text-neutral-400' }` } />
      <h1 className="text-lg font-bold text-neutral-900">{ title }</h1>
      <p className="mt-2 text-sm text-neutral-600">{ body }</p>
      <Link to="/returns" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Start a return</Link>
    </div>
  );
}

function toTimeline( data ) {
  const events = Array.isArray( data?.timeline ) ? data.timeline : [];
  if ( events.length ) return events;
  return data?.created_at ? [ { label: 'Return request submitted', occurred_at: data.created_at } ] : [];
}

function formatSlug( value ) {
  if ( ! value ) return '';
  return String( value ).replaceAll( '_', ' ' ).replace( /\b\w/g, ( char ) => char.toUpperCase() );
}

function formatDate( value ) {
  if ( ! value ) return '';
  try {
    return new Date( value ).toLocaleString( undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } );
  } catch {
    return value;
  }
}
