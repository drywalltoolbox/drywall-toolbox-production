import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import SmartBackButton from '../components/navigation/SmartBackButton.jsx';
import usePublicStatus from '../hooks/usePublicStatus.js';
import { getSupportStatus, submitSupportReply, SUPPORT_STATUS_LABELS, SUPPORT_TERMINAL_STATUSES } from '../api/statusTracking.js';

const MAX_REPLY_CHARS = 600;

const STATUS_COPY = {
  open: 'Your request is in the support queue.',
  pending_staff: 'Your reply is in. Our team is reviewing the conversation.',
  pending_customer: 'Support has replied and may be waiting on more details from you.',
  in_progress: 'A support specialist is actively working on this ticket.',
  resolved: 'This ticket has been marked resolved.',
  closed: 'This ticket is closed.',
};

const SUPPORT_STEPS = [
  { key: 'open', label: 'Opened' },
  { key: 'in_progress', label: 'Review' },
  { key: 'pending_customer', label: 'Response' },
  { key: 'resolved', label: 'Resolved' },
];

const SUPPORT_STEP_INDEX = {
  open: 0,
  pending_staff: 1,
  in_progress: 1,
  pending_customer: 2,
  resolved: 3,
  closed: 3,
  spam: 3,
};

const SUPPORT_TOKEN_LABELS = {
  ticket_url: 'this ticket page',
  admin_ticket_url: '',
  support_email: 'support@drywalltoolbox.com',
  site_name: 'Drywall Toolbox',
};

function formatSupportDisplayId(id) {
  return id ? `Support #${id}` : 'Support Ticket';
}

export default function SupportStatus() {
  const { id } = useParams();
  const [ params ] = useSearchParams();
  const token = params.get( 'token' );
  const needsToken = ! id || ! token;
  const { data, loading, error, refresh } = usePublicStatus(
    needsToken ? null : id,
    needsToken ? null : token,
    getSupportStatus,
    SUPPORT_TERMINAL_STATUSES
  );

  const status = data?.status || 'open';
  const label = data?.label || SUPPORT_STATUS_LABELS[ status ] || 'Support Status';
  const displayId = formatSupportDisplayId( id );
  const conversation = toConversation( data?.timeline, data );

  return (
    <main className="min-h-screen bg-slate-50">
      <SEOHead title={ data ? `${ displayId } - ${ label } | Drywall Toolbox` : 'Support Status | Drywall Toolbox' } />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SmartBackButton fallbackTo="/dashboard?tab=support" label="Back to support" />
            <button
              type="button"
              onClick={ refresh }
              disabled={ loading || needsToken }
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={ 16 } className={ loading ? 'animate-spin' : '' } /> Refresh
            </button>
          </div>
          <div>
            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Support Ticket
            </div>
            <h1 className="text-3xl font-bold text-slate-950">{ displayId }</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              { data?.subject || 'Review support replies, send updates, and track the current handling state.' }
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        { needsToken ? (
          <Notice title="Secure link required" body="Open the status link from your support email so we can verify this ticket belongs to you." />
        ) : error && ! data ? (
          <Notice title="Ticket not available" body={ error } />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <SupportState status={ status } label={ label } events={ conversation } />
              <Conversation events={ conversation } customerName={ data?.customer_name } />
            </div>
            <aside className="space-y-5">
              <ReplyBox ticketId={ id } token={ token } disabled={ SUPPORT_TERMINAL_STATUSES.includes( status ) } status={ status } onSent={ refresh } />
              <TicketFacts data={ data } displayId={ displayId } />
            </aside>
          </div>
        ) }
      </section>
    </main>
  );
}

function SupportState( { status, label, events = [] } ) {
  const waitingOnCustomer = status === 'pending_customer';
  const activeIndex = SUPPORT_STEP_INDEX[ status ] ?? 0;
  const progress = Math.max( 8, ( activeIndex / ( SUPPORT_STEPS.length - 1 ) ) * 100 );
  const statusTone = waitingOnCustomer ? 'text-amber-600' : status === 'resolved' || status === 'closed' ? 'text-emerald-600' : 'text-blue-700';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-blue-600" />
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
            <h2 className={ `mt-1 text-2xl font-bold ${ statusTone }` }>{ label }</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{ STATUS_COPY[ status ] || STATUS_COPY.open }</p>
          </div>
          <span className={ `mt-2 h-2.5 w-2.5 rounded-full ${ waitingOnCustomer ? 'bg-amber-500' : 'bg-blue-600' }` } aria-hidden="true" />
        </div>

        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-blue-600" style={ { width: `${ progress }%` } } />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            { SUPPORT_STEPS.map( ( step, index ) => {
              const complete = index < activeIndex;
              const active = index === activeIndex;
              return (
                <div key={ step.key } className="min-w-0 text-center">
                  <span className={ `mx-auto block h-4 w-4 rounded-full border-2 ${ complete ? 'border-blue-600 bg-blue-600' : active ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white' }` } aria-hidden="true" />
                  <p className={ `mt-1 truncate text-[11px] font-semibold ${ active ? 'text-blue-700' : complete ? 'text-blue-500' : 'text-slate-400' }` }>{ step.label }</p>
                </div>
              );
            } ) }
          </div>
        </div>

        <SupportProgressUpdates events={ events } />
      </div>
    </div>
  );
}

function SupportProgressUpdates( { events } ) {
  if ( ! Array.isArray( events ) || events.length === 0 ) return null;
  const visibleEvents = events.slice( -3 ).reverse();
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Updates</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Latest first</span>
      </div>
      <ol className="space-y-3">
        { visibleEvents.map( ( event, index ) => (
          <li key={ `${ event.type }-${ event.occurred_at }-${ index }` } className="flex gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />
            <div>
              <p className="text-sm font-semibold leading-snug text-slate-800">{ event.label }</p>
              <p className="mt-0.5 text-xs text-slate-500">{ formatDate( event.occurred_at ) }</p>
            </div>
          </li>
        ) ) }
      </ol>
    </div>
  );
}

function Conversation( { events, customerName } ) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conversation</span>
      </div>
      <div className="space-y-3">
        { events.length === 0 ? (
          <p className="text-sm text-slate-500">No public conversation updates yet.</p>
        ) : events.map( ( event, index ) => {
          const isCustomer = event.actor_type === 'customer';
          const author = isCustomer ? 'You' : 'Drywall Toolbox Support';
          const message = event.body || event.label;
          return (
            <article key={ `${ event.type }-${ event.occurred_at }-${ index }` } className={ `flex ${ isCustomer ? 'justify-end' : 'justify-start' }` }>
              <div className={ `max-w-[92%] rounded-2xl border px-4 py-3 shadow-sm ${ isCustomer ? 'border-blue-100 bg-blue-50 text-slate-800' : 'border-slate-200 bg-white text-slate-800' }` }>
                <div className="mb-2 grid gap-0.5 sm:flex sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{ author }</p>
                  <time className="text-[11px] text-slate-400">{ formatDate( event.occurred_at ) }</time>
                </div>
                <MessageBody text={ message } fallback={ isCustomer ? customerName || 'Customer message' : 'Support update' } />
              </div>
            </article>
          );
        } ) }
      </div>
    </div>
  );
}

function MessageBody( { text, fallback } ) {
  const paragraphs = String( text || fallback || '' )
    .split( /\n{2,}/ )
    .map( ( paragraph ) => paragraph.trim() )
    .filter( Boolean );

  if ( paragraphs.length === 0 ) {
    return <p className="text-sm leading-6 text-slate-600">{ fallback || 'Support update' }</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700">
      { paragraphs.map( ( paragraph, index ) => (
        <p key={ `${ paragraph.slice( 0, 24 ) }-${ index }` } className="whitespace-pre-line">{ paragraph }</p>
      ) ) }
    </div>
  );
}

function ReplyBox( { ticketId, token, disabled, status, onSent } ) {
  const [ message, setMessage ] = useState( '' );
  const [ sending, setSending ] = useState( false );
  const [ error, setError ] = useState( '' );
  const [ sent, setSent ] = useState( false );
  const remaining = useMemo( () => MAX_REPLY_CHARS - message.length, [ message.length ] );
  const closed = disabled || status === 'closed' || status === 'resolved';
  const canSend = message.trim().length >= 2 && ! closed && ! sending;

  const handleSubmit = async ( event ) => {
    event.preventDefault();
    if ( ! canSend ) return;
    setError( '' );
    setSent( false );
    setSending( true );
    try {
      await submitSupportReply( ticketId, token, message.trim() );
      setMessage( '' );
      setSent( true );
      onSent?.();
    } catch ( err ) {
      setError( err?.message || 'Unable to send reply.' );
    } finally {
      setSending( false );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-800">Send an Update</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        { closed ? 'This ticket is closed. Open a new support request if you need more help.' : 'Share details with our support team. This is not live chat.' }
      </p>

      <form onSubmit={ handleSubmit } className="space-y-3">
        <textarea
          value={ message }
          onChange={ ( event ) => setMessage( event.target.value.slice( 0, MAX_REPLY_CHARS ) ) }
          disabled={ closed || sending }
          maxLength={ MAX_REPLY_CHARS }
          rows={ 4 }
          placeholder={ closed ? 'This ticket is closed.' : 'Add details for our support team...' }
          className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
        />

        <div className="flex items-center justify-between gap-2">
          <span className={ `text-xs ${ remaining < 80 ? 'text-amber-600' : 'text-slate-400' }` }>
            { remaining } characters remaining
          </span>
          <button
            type="submit"
            disabled={ ! canSend }
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
          >
            { sending ? <RefreshCw size={ 14 } className="animate-spin" /> : null }
            { sending ? 'Sending…' : 'Send Update' }
          </button>
        </div>
      </form>

      { error && <p className="mt-2 text-xs text-red-600" role="alert">{ error }</p> }
      { sent && <p className="mt-2 text-xs text-green-700" role="status">Reply sent.</p> }
    </div>
  );
}

function TicketFacts( { data, displayId } ) {
  const facts = [
    [ 'Ticket', displayId ],
    [ 'Type', formatSlug( data?.ticket_type ) ],
    [ 'Priority', formatSlug( data?.priority ) ],
    [ 'Opened', formatDate( data?.created_at ) ],
    [ 'Updated', formatDate( data?.last_updated_at ) ],
  ].filter( ( [ , value ] ) => value );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Ticket Details</h2>
      <dl className="mt-4 space-y-3">
        { facts.map( ( [ factLabel, value ] ) => (
          <div key={ factLabel }>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ factLabel }</dt>
            <dd className="mt-1 text-sm text-slate-800">{ value }</dd>
          </div>
        ) ) }
      </dl>
    </div>
  );
}

function Notice( { title, body } ) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-3 text-amber-500" />
      <h1 className="text-lg font-bold text-slate-900">{ title }</h1>
      <p className="mt-2 text-sm text-slate-600">{ body }</p>
      <Link to="/contact" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Contact support</Link>
    </div>
  );
}

function toConversation( timeline, ticket ) {
  if ( ! Array.isArray( timeline ) ) return [];
  return timeline
    .filter( ( event ) => event?.type === 'ticket.created' || event?.type === 'ticket.reply_customer' || event?.type === 'ticket.reply_staff' )
    .map( ( event ) => ( {
      ...event,
      body: normalizeSupportMessage( event?.body || '', ticket ),
      label: event.type === 'ticket.created' ? 'Ticket opened' : event.actor_type === 'customer' ? 'Customer reply sent' : 'Support replied',
    } ) )
    .sort( ( a, b ) => new Date( a.occurred_at ) - new Date( b.occurred_at ) );
}

function normalizeSupportMessage( raw, ticket ) {
  const customerName = String( ticket?.customer_name || 'there' ).trim();
  const ticketNumber = String( ticket?.ticket_number || ( ticket?.id ? `Support #${ ticket.id }` : '' ) ).trim();
  const orderId = ticket?.order_id ? `#${ ticket.order_id }` : '';
  const replacements = {
    customer: customerName,
    customer_name: customerName,
    ticket: ticketNumber,
    ticket_number: ticketNumber,
    order: orderId,
    order_id: orderId,
    ...SUPPORT_TOKEN_LABELS,
  };

  let message = String( raw || '' )
    .replace( /\r\n?/g, '\n' )
    .replace( /\{\{\s*([a-z0-9_]+)\s*\}\}/gi, ( _, key ) => replacements[ String( key ).toLowerCase() ] ?? '' )
    .replace( /\{\s*([a-z0-9_]+)\s*\}/gi, ( _, key ) => replacements[ String( key ).toLowerCase() ] ?? '' )
    .replace( /\{\s*\}/g, '' )
    .replace( /\{\s*([^{}\n]{2,120})\s*\}/g, '$1' )
    .replace( /[ \t]+([,.!?;:])/g, '$1' )
    .replace( /\bYour order\s+is\b/gi, 'Your order is' )
    .replace( /You can also review the latest details here:\s*this ticket page\.?/gi, 'You can also review the latest details on this ticket page.' );

  const lines = message.split( '\n' )
    .map( ( line ) => line.trim() )
    .filter( ( line ) => {
      if ( ! line ) return true;
      if ( /\{\{.+?\}\}|\{\s*[a-z0-9_]+\s*\}/i.test( line ) ) return false;
      if ( /^(review the latest details here|you can also review|ticket:)\s*:?[\s]*$/i.test( line ) ) return false;
      return true;
    } );

  message = lines.join( '\n' ).replace( /\n{3,}/g, '\n\n' ).trim();
  return message;
}

function formatSlug( value ) {
  if ( ! value ) return '';
  return String( value ).replaceAll( '_', ' ' ).replaceAll( '-', ' ' ).replace( /\b\w/g, ( char ) => char.toUpperCase() );
}

function formatDate( value ) {
  if ( ! value ) return '';
  try {
    return new Date( value ).toLocaleString( undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } );
  } catch {
    return value;
  }
}
