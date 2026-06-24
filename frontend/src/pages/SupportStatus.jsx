import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Headphones, MessageSquareReply, RefreshCw, Send, ShieldCheck, UserRoundCheck } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import SmartBackButton from '../components/navigation/SmartBackButton.jsx';
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Headphones size={ 14 } /> Support Ticket
              </div>
              <h1 className="text-3xl font-bold text-slate-950">{ data?.ticket_number || `Ticket #${ id || '' }` }</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{ data?.subject || 'Review support replies, send updates, and track the current handling state.' }</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        { needsToken ? (
          <Notice title="Secure link required" body="Open the status link from your support email so we can verify this ticket belongs to you." />
        ) : error && ! data ? (
          <Notice title="Ticket not available" body={ error } />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <SupportState status={ status } label={ label } />
              <Conversation events={ toConversation( data?.timeline ) } />
            </div>
            <aside className="space-y-5">
              <ReplyBox ticketId={ id } token={ token } disabled={ SUPPORT_TERMINAL_STATUSES.includes( status ) } status={ status } onSent={ refresh } />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={ `flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ waitingOnCustomer ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700' }` }>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Conversation</h2>
      <div className="mt-4 space-y-4">
        { events.length === 0 ? (
          <p className="text-sm text-slate-500">No public conversation updates yet.</p>
        ) : events.map( ( event, index ) => (
          <article key={ `${ event.type }-${ event.occurred_at }-${ index }` } className={ `rounded-2xl border p-4 ${ event.actor_type === 'customer' ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white' }` }>
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

function ReplyBox( { ticketId, token, disabled, status, onSent } ) {
  const [ message, setMessage ] = useState( '' );
  const [ sending, setSending ] = useState( false );
  const [ error, setError ] = useState( '' );
  const [ sent, setSent ] = useState( false );
  const remaining = useMemo( () => Math.max( 0, 1000 - message.length ), [ message.length ] );
  const closed = disabled || status === 'closed' || status === 'resolved';

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
    <form onSubmit={ handleSubmit } className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_2px_2px,rgba(255,255,255,.22)_1px,transparent_0)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <MessageSquareReply size={ 19 } />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Support reply</p>
            <h2 className="mt-1 text-lg font-bold">Send an update</h2>
            <p className="mt-1 text-sm leading-5 text-blue-100/90">
              { closed ? 'This ticket is closed. Contact support if you need to open a new request.' : 'Add context, order details, photos links, or any update our team should review.' }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <label htmlFor="support-reply-message" className="sr-only">Reply message</label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
          <textarea
            id="support-reply-message"
            value={ message }
            onChange={ ( event ) => setMessage( event.target.value.slice( 0, 1000 ) ) }
            disabled={ closed || sending }
            rows={ 7 }
            className="min-h-[168px] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
            placeholder={ closed ? 'This ticket is closed.' : 'Type your reply here…' }
          />
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>{ closed ? 'Replies disabled' : 'Secure customer reply' }</span>
            <span>{ remaining } characters left</span>
          </div>
        </div>

        { error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{ error }</p> }
        { sent && (
          <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={ 14 } /> Reply sent.
          </p>
        ) }

        <button
          type="submit"
          disabled={ closed || sending || message.trim().length < 2 }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          { sending ? <RefreshCw size={ 16 } className="animate-spin" /> : <Send size={ 16 } /> }
          { closed ? 'Ticket closed' : sending ? 'Sending reply…' : 'Send Reply' }
        </button>
      </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
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
