import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Headphones, MessageSquareReply, RefreshCw, Send, ShieldCheck, UserRoundCheck } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import usePublicStatus from '../hooks/usePublicStatus.js';
import { getSupportStatus, submitSupportReply, SUPPORT_STATUS_LABELS, SUPPORT_TERMINAL_STATUSES } from '../api/statusTracking.js';

const STATUS_COPY = {
  open: 'Your request is in the support queue.',
  pending_staff: 'Your reply is in. Our team is reviewing the conversation.',
  pending_customer: 'Support has replied and may be waiting on more details from you.',
  in_progress: 'A support specialist is actively working on this ticket.',
  resolved: 'This ticket has been marked resolved.',
  closed: 'This ticket is closed.',
};

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

  return (
    <main className="min-h-screen bg-slate-50">
      <SEOHead title={ data ? `${ data.ticket_number } - ${ label } | Drywall Toolbox` : 'Support Status | Drywall Toolbox' } />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Headphones size={ 14 } /> Support Ticket
              </div>
              <h1 className="text-3xl font-bold text-slate-950">{ data?.ticket_number || `Ticket #${ id || '' }` }</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{ data?.subject || 'Review support replies, send updates, and track the current handling state.' }</p>
            </div>
            <button
              type="button"
              onClick={ refresh }
              disabled={ loading || needsToken }
              className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={ 16 } className={ loading ? 'animate-spin' : '' } /> Refresh
            </button>
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
              <SupportState status={ status } label={ label } />
              <Conversation events={ toConversation( data?.timeline ) } />
            </div>
            <aside className="space-y-5">
              <ReplyBox ticketId={ id } token={ token } disabled={ SUPPORT_TERMINAL_STATUSES.includes( status ) } onSent={ refresh } />
              <TicketFacts data={ data } />
            </aside>
          </div>
        ) }
      </section>
    </main>
  );
}

function SupportState( { status, label } ) {
  const waitingOnCustomer = status === 'pending_customer';
  const Icon = waitingOnCustomer ? UserRoundCheck : status === 'resolved' || status === 'closed' ? ShieldCheck : Headphones;

  return (
    <div className="rounded border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className={ `flex h-12 w-12 shrink-0 items-center justify-center rounded ${ waitingOnCustomer ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700' }` }>
          <Icon size={ 23 } />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{ label }</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{ STATUS_COPY[ status ] || STATUS_COPY.open }</p>
        </div>
      </div>
    </div>
  );
}

function Conversation( { events } ) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Conversation</h2>
      <div className="mt-4 space-y-4">
        { events.length === 0 ? (
          <p className="text-sm text-slate-500">No public conversation updates yet.</p>
        ) : events.map( ( event, index ) => (
          <article key={ `${ event.type }-${ event.occurred_at }-${ index }` } className={ `rounded border p-4 ${ event.actor_type === 'customer' ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white' }` }>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ event.actor_type === 'customer' ? 'You' : 'Drywall Toolbox Support' }</p>
              <time className="text-xs text-slate-400">{ formatDate( event.occurred_at ) }</time>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{ event.body || event.label }</p>
          </article>
        ) ) }
      </div>
    </div>
  );
}

function ReplyBox( { ticketId, token, disabled, onSent } ) {
  const [ message, setMessage ] = useState( '' );
  const [ sending, setSending ] = useState( false );
  const [ error, setError ] = useState( '' );
  const [ sent, setSent ] = useState( false );

  const handleSubmit = async ( event ) => {
    event.preventDefault();
    setError( '' );
    setSent( false );
    if ( message.trim().length < 2 ) {
      setError( 'Please enter a reply before sending.' );
      return;
    }
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
    <form onSubmit={ handleSubmit } className="rounded border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquareReply size={ 17 } className="text-blue-700" />
        <h2 className="text-sm font-semibold text-slate-900">Reply to Support</h2>
      </div>
      <textarea
        value={ message }
        onChange={ ( event ) => setMessage( event.target.value ) }
        disabled={ disabled || sending }
        rows={ 5 }
        className="w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        placeholder={ disabled ? 'This ticket is closed.' : 'Add details, photos links, order numbers, or any update our team needs.' }
      />
      { error && <p className="mt-2 text-xs text-red-600">{ error }</p> }
      { sent && <p className="mt-2 text-xs text-green-700">Reply sent.</p> }
      <button
        type="submit"
        disabled={ disabled || sending }
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
      >
        { sending ? <RefreshCw size={ 16 } className="animate-spin" /> : <Send size={ 16 } /> }
        Send Reply
      </button>
    </form>
  );
}

function TicketFacts( { data } ) {
  const facts = [
    [ 'Type', formatSlug( data?.ticket_type ) ],
    [ 'Priority', formatSlug( data?.priority ) ],
    [ 'Opened', formatDate( data?.created_at ) ],
    [ 'Updated', formatDate( data?.last_updated_at ) ],
  ].filter( ( [ , value ] ) => value );

  return (
    <div className="rounded border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Ticket Details</h2>
      <dl className="mt-4 space-y-3">
        { facts.map( ( [ label, value ] ) => (
          <div key={ label }>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ label }</dt>
            <dd className="mt-1 text-sm text-slate-800">{ value }</dd>
          </div>
        ) ) }
      </dl>
    </div>
  );
}

function Notice( { title, body } ) {
  return (
    <div className="mx-auto max-w-md rounded border border-slate-200 bg-white p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 text-amber-500" />
      <h1 className="text-lg font-bold text-slate-900">{ title }</h1>
      <p className="mt-2 text-sm text-slate-600">{ body }</p>
      <Link to="/contact" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Contact support</Link>
    </div>
  );
}

function toConversation( timeline ) {
  if ( ! Array.isArray( timeline ) ) return [];
  return timeline
    .filter( ( event ) => event?.type === 'ticket.created' || event?.type === 'ticket.reply_customer' || event?.type === 'ticket.reply_staff' )
    .map( ( event ) => ( {
      ...event,
      label: event.type === 'ticket.created' ? 'Ticket opened' : 'Support updated the ticket',
    } ) )
    .sort( ( a, b ) => new Date( a.occurred_at ) - new Date( b.occurred_at ) );
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
