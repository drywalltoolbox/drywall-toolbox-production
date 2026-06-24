/**
 * frontend/src/pages/RepairStatus.jsx
 *
 * Public repair tracking page — /repairs/status/:id
 */

import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, SearchX, RefreshCw } from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import useRepairStatus from '../hooks/useRepairStatus.js';
import RepairStatusTracker from '../components/repairs/RepairStatusTracker.jsx';
import RepairQuoteReview from '../components/repairs/RepairQuoteReview.jsx';
import RepairIntegrationNotice from '../components/repairs/RepairIntegrationNotice.jsx';
import RepairUpdateComposer from '../components/repairs/RepairUpdateComposer.jsx';
import { REPAIR_STATUS_LABELS } from '../api/repairs.js';

function formatRepairDisplayId(id) {
  return id ? `Repair #${id}` : 'Repair';
}

function TokenEntryForm({ onSubmit }) {
  const [repairId, setRepairId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!repairId.trim() || !token.trim()) {
      setError('Please enter both your repair number and tracking token.');
      return;
    }
    setError('');
    onSubmit(repairId.trim(), token.trim());
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 shadow-sm">
            <Search size={26} className="text-blue-500" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Track Your Repair</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your repair number and the tracking token from your confirmation email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="repair-id" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Repair Number
            </label>
            <input
              id="repair-id"
              type="text"
              value={repairId}
              onChange={(event) => setRepairId(event.target.value)}
              placeholder="e.g. 1042"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="repair-token" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tracking Token
            </label>
            <input
              id="repair-token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="From your confirmation email"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-xs text-red-600"
                role="alert"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            Look Up Repair →
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Need help? <Link to="/contact" className="text-blue-600 hover:underline">Contact us</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />;
}

function StatusSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function ErrorDisplay({ message, onRetry }) {
  const normalized = String(message || '').toLowerCase();
  const isNotFound = normalized.includes('not found') || normalized.includes('404');
  const isUnauth = normalized.includes('token') || normalized.includes('401') || normalized.includes('403');

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-sm text-center"
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isNotFound ? 'bg-neutral-100' : 'bg-yellow-50'}`}>
          {isNotFound
            ? <SearchX size={28} className="text-neutral-400" strokeWidth={1.5} />
            : <AlertTriangle size={28} className="text-yellow-500" strokeWidth={1.5} />}
        </div>
        <h2 className="mb-2 text-lg font-semibold text-neutral-800">
          {isNotFound ? 'Repair Not Found' : isUnauth ? 'Access Denied' : 'Something Went Wrong'}
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          {isNotFound
            ? 'We could not find a repair matching this number. Please double-check your repair number and token.'
            : isUnauth
              ? 'The tracking token is invalid or has expired. Please check your confirmation email.'
              : message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex justify-center gap-3">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
              type="button"
            >
              Retry
            </button>
          ) : null}
          <Link to="/repairs" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50">
            Submit a Repair
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RepairStatus() {
  const { id: urlRepairId } = useParams();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  const [resolvedId, setResolvedId] = useState(urlRepairId || null);
  const [resolvedToken, setResolvedToken] = useState(urlToken || null);
  const needsTokenEntry = !resolvedId || !resolvedToken;

  const { data, loading, error, refresh } = useRepairStatus(
    needsTokenEntry ? null : resolvedId,
    needsTokenEntry ? null : resolvedToken,
  );

  const customerTimeline = toCustomerTimeline(data?.timeline);
  const requestDetails = toDisplayRequestDetails(data?.request_details);
  const status = data?.status;
  const label = data?.label || REPAIR_STATUS_LABELS[status] || status;
  const displayId = formatRepairDisplayId(resolvedId);

  const handleTokenFormSubmit = (repairId, token) => {
    setResolvedId(repairId);
    setResolvedToken(token);
  };

  const handleQuoteResponse = () => {
    setTimeout(() => refresh(), 800);
  };

  if (needsTokenEntry) {
    return (
      <>
        <SEOHead title="Track Your Repair | Drywall Toolbox" />
        <TokenEntryForm onSubmit={handleTokenFormSubmit} />
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <SEOHead title="Repair Status | Drywall Toolbox" />
        <ErrorDisplay message={error} onRetry={refresh} />
      </>
    );
  }

  return (
    <>
      <SEOHead title={data ? `${displayId} — ${label} | Drywall Toolbox` : 'Repair Status | Drywall Toolbox'} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-2xl space-y-4 px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Repair Number</div>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">{displayId}</h1>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh status"
            className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
            type="button"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </motion.div>

        {loading && !data ? (
          <StatusSkeleton />
        ) : data ? (
          <RepairStatusTracker
            status={data.status}
            label={label}
            submittedAt={data.submitted_at}
            lastUpdatedAt={data.last_updated_at}
            trackingNumber={data.tracking_number}
            events={customerTimeline}
          />
        ) : null}

        {status ? <RepairIntegrationNotice status={status} /> : null}

        {status === 'quoted' ? (
          <RepairQuoteReview
            repairId={resolvedId}
            token={resolvedToken}
            onAccepted={handleQuoteResponse}
            onDeclined={handleQuoteResponse}
          />
        ) : null}

        {requestDetails.length > 0 ? <SubmittedRequestDetails details={requestDetails} /> : null}

        {data && !['completed', 'closed', 'cancelled', 'quote_declined'].includes(status) ? (
          <RepairUpdateComposer repairId={resolvedId} token={resolvedToken} onSubmitted={() => refresh()} />
        ) : null}

        <AnimatePresence>
          {error && data ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800" role="alert">
                Could not refresh status — showing last known data.
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="pb-4 pt-2 text-center">
          <Link to="/contact" className="text-xs text-neutral-400 underline transition-colors hover:text-blue-600">
            Need help with your repair?
          </Link>
        </div>
      </motion.div>
    </>
  );
}

function toCustomerTimeline(timeline) {
  if (!Array.isArray(timeline)) return [];

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
    .map((event) => {
      const type = typeof event?.type === 'string' ? event.type : event?.event_type;
      const occurredAt = event?.occurred_at || event?.created_at;
      if (typeof type !== 'string' || !type.startsWith('repair.')) return null;
      return { ...event, type, occurred_at: occurredAt };
    })
    .filter(Boolean)
    .map((event) => ({
      ...event,
      label: labelByType[event.type] || event.label || 'Repair updated',
    }))
    .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
}

function SubmittedRequestDetails({ details }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = 'submitted-request-details-panel';

  if (!Array.isArray(details) || details.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-5 py-4 text-left transition-colors hover:bg-neutral-50"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Submitted Request Details</h3>
            <p className="mt-1 text-xs text-neutral-500">
              {isOpen ? 'Click to close your submitted request details.' : 'Click to view the information you originally submitted.'}
            </p>
          </div>
          <span className={`mt-0.5 text-base leading-none text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
            ▾
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-5 sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label} className={item.fullWidth ? 'sm:col-span-2' : ''}>
                  <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {item.label}
                  </dt>
                  <dd className="wrap-break-word whitespace-pre-line text-sm leading-snug text-neutral-800">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function toDisplayRequestDetails(details) {
  if (!details || typeof details !== 'object') return [];

  const shipping = (typeof details.shipping_rate_price === 'number' && Number.isFinite(details.shipping_rate_price))
    ? `${details.shipping_rate_name || 'Shipping'} (${formatCurrency(details.shipping_rate_price)})`
    : details.shipping_rate_name;

  const returnAddress = [details.address_1, details.city, details.state, details.postcode, details.country]
    .map((part) => normalizeField(part))
    .filter(Boolean)
    .join(', ');

  return [
    { label: 'Tool Brand', value: normalizeField(details.tool_brand) },
    { label: 'Tool Category', value: normalizeField(details.tool_category) },
    { label: 'Model', value: normalizeField(details.tool_model) },
    { label: 'Serial Number', value: normalizeField(details.serial_number) },
    { label: 'Service Tier', value: formatSlugLabel(details.service_tier) },
    { label: 'Priority', value: formatSlugLabel(details.priority) },
    { label: 'Contact Preference', value: formatSlugLabel(details.contact_preference) },
    { label: 'Issue Started', value: formatSlugLabel(details.issue_start) },
    { label: 'Customer Name', value: normalizeField(details.customer_name) },
    { label: 'Customer Email', value: normalizeField(details.customer_email) },
    { label: 'Customer Phone', value: normalizeField(details.customer_phone) },
    { label: 'Company', value: normalizeField(details.company) },
    { label: 'Return Address', value: returnAddress || null, fullWidth: true },
    { label: 'Shipping Service', value: normalizeField(shipping) },
    { label: 'Tool Age', value: normalizeField(details.tool_age) },
    { label: 'Issue Description', value: normalizeField(details.issue_description), fullWidth: true },
  ].filter((item) => Boolean(item.value));
}

function normalizeField(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function formatSlugLabel(value) {
  const normalized = normalizeField(value);
  if (!normalized) return null;
  return normalized
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  } catch {
    return `$${value}`;
  }
}
