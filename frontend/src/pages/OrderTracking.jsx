/**
 * frontend/src/pages/OrderTracking.jsx
 *
 * Customer-facing order tracking page.
 *
 * Routes:
 *   /order-tracking/:id              — authenticated customer tracking
 *   /order-tracking/:id?order_key=…  — guest tracking via order key
 */

import { useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import { useOrderStatus } from '../hooks/useOrderStatus.js';
import { useOrderEventStream } from '../hooks/useOrderEventStream.js';
import { ORDER_STATUS_LABELS, ORDER_TERMINAL_STATUSES } from '../api/orders.js';
import '../styles/order-pages.css';

const STATUS_ICONS = {
  pending: Clock,
  'on-hold': Clock,
  processing: Package,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: AlertCircle,
  refunded: AlertCircle,
  failed: AlertCircle,
};

const TIMELINE_ICONS = {
  'order.created': Package,
  'order.payment_confirmed': CheckCircle,
  'order.inventory_reserved': Package,
  'order.picked': Package,
  'order.packed': Package,
  'order.shipped': Truck,
  'order.delivered': CheckCircle,
  'order.completed': CheckCircle,
  'order.cancelled': AlertCircle,
  'order.refunded': AlertCircle,
};

function formatOrderType(type) {
  if (type === 'repair_service') return 'Repair Service Order';
  return 'Product Order';
}

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function StatusBadge({ status, label }) {
  const Icon = STATUS_ICONS[status] || Package;
  return (
    <span className="dtb-order-status-badge">
      <Icon size={14} />
      {label || ORDER_STATUS_LABELS[status] || status || 'Order received'}
    </span>
  );
}

function TrackingSkeleton() {
  return (
    <div className="dtb-order-page page-wrapper">
      <SEOHead noindex title="Order Tracking" />
      <div className="dtb-order-shell">
        <section className="dtb-order-hero">
          <span className="dtb-order-status-icon dtb-order-status-icon--neutral">
            <Loader className="animate-spin" size={42} strokeWidth={1.8} />
          </span>
          <p className="dtb-order-eyebrow">Order tracking</p>
          <h1 className="dtb-order-title">Loading order</h1>
          <p className="dtb-order-subtitle">Retrieving the latest fulfillment and shipment information.</p>
        </section>
      </div>
    </div>
  );
}

function TimelineIcon({ type }) {
  const Icon = TIMELINE_ICONS[type] || Package;
  return <Icon size={16} strokeWidth={2} />;
}

function OrderTimeline({ timeline }) {
  if (!timeline?.length) return null;

  return (
    <section className="dtb-order-card" aria-labelledby="timeline-title">
      <header className="dtb-order-card__header">
        <h2 id="timeline-title" className="dtb-order-card__title">
          <Clock size={20} /> Order timeline
        </h2>
      </header>
      <div className="dtb-order-card__body">
        <ol className="dtb-order-timeline">
          {[...timeline].reverse().map((event, i) => (
            <li key={`${event.type || 'event'}-${event.occurred_at || i}`} className="dtb-order-timeline__item">
              <span className="dtb-order-timeline__icon"><TimelineIcon type={event.type} /></span>
              <div>
                <p className="dtb-order-timeline__label">{event.label}</p>
                <time className="dtb-order-timeline__time">{formatDateTime(event.occurred_at)}</time>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TrackingCard({ tracking }) {
  if (!tracking?.tracking_number && !tracking?.carrier && !tracking?.estimated_delivery) return null;

  return (
    <section className="dtb-order-card" aria-labelledby="shipment-title">
      <header className="dtb-order-card__header">
        <h2 id="shipment-title" className="dtb-order-card__title">
          <Truck size={20} /> Shipment tracking
        </h2>
      </header>
      <div className="dtb-order-card__body">
        <dl className="dtb-order-detail-list">
          <div className="dtb-order-detail-row">
            <dt className="dtb-order-detail-label">Carrier</dt>
            <dd className="dtb-order-detail-value">{tracking.carrier || 'Pending assignment'}</dd>
          </div>
          {tracking.tracking_number ? (
            <div className="dtb-order-detail-row">
              <dt className="dtb-order-detail-label">Tracking number</dt>
              <dd className="dtb-order-detail-value">{tracking.tracking_number}</dd>
            </div>
          ) : null}
          {tracking.estimated_delivery ? (
            <div className="dtb-order-detail-row">
              <dt className="dtb-order-detail-label">Estimated delivery</dt>
              <dd className="dtb-order-detail-value">{formatDate(tracking.estimated_delivery)}</dd>
            </div>
          ) : null}
        </dl>
        {tracking.tracking_url ? (
          <div className="dtb-order-actions" style={{ justifyContent: 'flex-start', marginTop: '1rem' }}>
            <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer" className="dtb-order-button dtb-order-button--primary">
              Track package <ExternalLink size={14} />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function OrderTracking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderKey = searchParams.get('order_key') || '';

  const { data, loading, error, refresh } = useOrderStatus(id, orderKey);
  const { streaming } = useOrderEventStream(id, orderKey);

  useEffect(() => {
    if (!streaming) return undefined;
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [streaming, refresh]);

  if (loading && !data) {
    return <TrackingSkeleton />;
  }

  if (error && !data) {
    const message = error.includes('401') || error.includes('Authentication')
      ? 'Please log in to view your order.'
      : error.includes('403') || error.includes('access')
        ? 'You do not have access to this order.'
        : 'We are having trouble loading your tracking information. Please try again shortly.';

    return (
      <div className="dtb-order-page page-wrapper">
        <SEOHead noindex title="Order Tracking" />
        <div className="dtb-order-shell" style={{ maxWidth: 720 }}>
          <section className="dtb-order-hero">
            <span className="dtb-order-status-icon dtb-order-status-icon--neutral">
              <AlertCircle size={42} strokeWidth={1.8} />
            </span>
            <p className="dtb-order-eyebrow">Order tracking</p>
            <h1 className="dtb-order-title">Unable to load order</h1>
            <p className="dtb-order-subtitle">{message}</p>
            <div className="dtb-order-actions">
              <button onClick={refresh} className="dtb-order-button dtb-order-button--secondary" type="button">
                <RefreshCw size={15} /> Try again
              </button>
              <Link to="/dashboard?tab=orders" className="dtb-order-button dtb-order-button--primary">
                My Orders
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const isTerminal = data && ORDER_TERMINAL_STATUSES.includes(data.status);

  return (
    <div className="dtb-order-page page-wrapper">
      <SEOHead noindex title={`Order #${id} — Tracking`} />
      <div className="dtb-order-shell">
        <Link to="/dashboard?tab=orders" className="dtb-order-back-link">
          <ArrowLeft size={14} /> Back to orders
        </Link>

        <section className="dtb-order-hero" aria-labelledby="tracking-order-title">
          <span className="dtb-order-status-icon dtb-order-status-icon--neutral">
            {data?.status === 'completed' ? <CheckCircle size={54} strokeWidth={1.7} /> : <Package size={54} strokeWidth={1.7} />}
          </span>
          <p className="dtb-order-eyebrow">Order tracking</p>
          <h1 id="tracking-order-title" className="dtb-order-title">Order #{id}</h1>
          <p className="dtb-order-subtitle">
            Current fulfillment status, shipment details, and order activity are shown below.
          </p>
          {data ? (
            <div className="dtb-order-badges">
              <StatusBadge status={data.status} label={data.label} />
              <span className="dtb-order-status-badge">{formatOrderType(data.order_type)}</span>
              {streaming ? (
                <span className="dtb-order-live-badge">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live updates
                </span>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="dtb-order-grid">
          <main className="dtb-order-stack">
            {data?.items?.length > 0 ? (
              <section className="dtb-order-card" aria-labelledby="tracking-items-title">
                <header className="dtb-order-card__header">
                  <h2 id="tracking-items-title" className="dtb-order-card__title">
                    <Package size={20} /> Items ordered
                  </h2>
                </header>
                <div className="dtb-order-card__body">
                  <div className="dtb-order-items">
                    {data.items.map((item, i) => (
                      <article key={`${item.name || 'item'}-${i}`} className="dtb-order-item">
                        <div>
                          <h3 className="dtb-order-item__name">{item.name}</h3>
                          <p className="dtb-order-item__meta">Qty: {item.quantity || 1}</p>
                        </div>
                        <span className="dtb-order-item__price">{item.status ? String(item.status).replace(/-/g, ' ') : 'Queued'}</span>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <OrderTimeline timeline={data?.timeline} />
          </main>

          <aside className="dtb-order-stack">
            {data ? <TrackingCard tracking={data} /> : null}

            <section className="dtb-order-card" aria-labelledby="order-meta-title">
              <header className="dtb-order-card__header">
                <h2 id="order-meta-title" className="dtb-order-card__title">
                  <Clock size={20} /> Order details
                </h2>
              </header>
              <div className="dtb-order-card__body">
                <dl className="dtb-order-detail-list">
                  <div className="dtb-order-detail-row">
                    <dt className="dtb-order-detail-label">Placed</dt>
                    <dd className="dtb-order-detail-value">{formatDateTime(data?.placed_at)}</dd>
                  </div>
                  <div className="dtb-order-detail-row">
                    <dt className="dtb-order-detail-label">Last updated</dt>
                    <dd className="dtb-order-detail-value">{formatDateTime(data?.last_updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </aside>
        </div>

        <div className="dtb-order-actions">
          {!isTerminal ? (
            <button onClick={refresh} className="dtb-order-button dtb-order-button--secondary" type="button">
              <RefreshCw size={15} /> Refresh
            </button>
          ) : null}
          <Link to="/products" className="dtb-order-button dtb-order-button--primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
