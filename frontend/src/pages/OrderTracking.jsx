/**
 * frontend/src/pages/OrderTracking.jsx
 *
 * Customer-facing product order tracking page.
 *
 * Routes:
 *   /order-tracking/:id              — authenticated customer tracking
 *   /order-tracking/:id?order_key=…  — guest tracking via order key
 */

import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Loader,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead';
import { useOrderStatus } from '../hooks/useOrderStatus.js';
import { useOrderEventStream } from '../hooks/useOrderEventStream.js';
import { ORDER_STATUS_LABELS, ORDER_TERMINAL_STATUSES } from '../api/orders.js';
import '../styles/order-pages.css';
import '../styles/order-tracking.css';

const STATUS_ICONS = {
  pending: Clock,
  'on-hold': Clock,
  processing: PackageCheck,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: AlertCircle,
  refunded: AlertCircle,
  failed: AlertCircle,
};

const TIMELINE_ICONS = {
  'order.created': Package,
  'order.payment_pending': Clock,
  'order.payment_confirmed': CheckCircle,
  'order.inventory_reserved': PackageCheck,
  'order.picked': PackageCheck,
  'order.packed': PackageCheck,
  'order.shipped': Truck,
  'order.delivered': CheckCircle,
  'order.completed': CheckCircle,
  'order.cancelled': AlertCircle,
  'order.refunded': AlertCircle,
  'order.payment_failed': AlertCircle,
};

const TIMELINE_LABELS = {
  'order.created': 'Order created',
  'order.payment_pending': 'Payment pending',
  'order.payment_review_required': 'Payment under review',
  'order.payment_confirmed': 'Payment confirmed',
  'order.inventory_reserved': 'Inventory reserved',
  'order.picked': 'Order picked',
  'order.packed': 'Order packed',
  'order.shipped': 'Shipment created',
  'order.delivered': 'Delivered',
  'order.completed': 'Order completed',
  'order.cancelled': 'Order cancelled',
  'order.refunded': 'Order refunded',
  'order.payment_failed': 'Payment failed',
  'order.status_changed': 'Order status updated',
};

const TRACKING_STEPS = [
  { id: 'received', label: 'Received', description: 'Order captured' },
  { id: 'payment', label: 'Payment', description: 'Secure payment' },
  { id: 'processing', label: 'Processing', description: 'Preparing items' },
  { id: 'shipped', label: 'Shipped', description: 'In transit' },
  { id: 'complete', label: 'Complete', description: 'Delivered' },
];

function formatOrderType(type) {
  if (type === 'repair_service') return 'Repair service';
  return 'Product order';
}

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function formatDate(value) {
  if (!value) return 'Pending';
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Pending';
  }
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value, currency = 'USD') {
  const parsed = parseMoney(value);
  if (parsed === null) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `$${parsed.toFixed(2)}`;
  }
}

function humanizeToken(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveStatusLabel(order) {
  if (order?.payment_required && order?.status === 'pending') return 'Payment pending';
  return order?.label || order?.status_label || ORDER_STATUS_LABELS[order?.status] || humanizeToken(order?.status) || 'Order received';
}

function normalizeTimelineLabel(event) {
  const type = String(event?.type || event?.event_type || '');
  if (TIMELINE_LABELS[type]) return TIMELINE_LABELS[type];

  const rawLabel = String(event?.label || '').trim();
  if (rawLabel) {
    const readable = rawLabel
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/ordercreated/i, 'Order created')
      .replace(/paymentconfirmed/i, 'Payment confirmed')
      .replace(/paymentpending/i, 'Payment pending')
      .replace(/\s+/g, ' ')
      .trim();
    return readable || 'Order updated';
  }

  return humanizeToken(type) || 'Order updated';
}

function normalizeTimeline(timeline, order) {
  const source = Array.isArray(timeline) ? timeline : [];
  const normalized = source
    .map((event, index) => ({
      ...event,
      type: String(event?.type || event?.event_type || 'order.updated'),
      label: normalizeTimelineLabel(event),
      occurred_at: event?.occurred_at || event?.created_at || event?.date_created || order?.placed_at || order?.date_created,
      index,
    }))
    .filter((event) => event.occurred_at || event.label)
    .sort((a, b) => new Date(a.occurred_at || 0) - new Date(b.occurred_at || 0));

  if (normalized.length > 0) return normalized;

  return [{
    type: 'order.created',
    label: 'Order created',
    occurred_at: order?.placed_at || order?.date_created || order?.created_at,
    index: 0,
  }];
}

function getLineItems(order) {
  if (Array.isArray(order?.line_items)) return order.line_items;
  if (Array.isArray(order?.items)) return order.items;
  return [];
}

function resolveItemImage(item = {}) {
  if (typeof item.image === 'string' && item.image.trim()) return item.image.trim();
  if (item.image && typeof item.image === 'object') {
    return item.image.src || item.image.url || item.image.thumbnail || '';
  }
  return item.image_url || item.image_thumb || item.thumbnail || item.thumbnail_url || '';
}

function OrderItemMedia({ item }) {
  const imageUrl = resolveItemImage(item);
  const imageAlt = item?.image_alt || item?.name || 'Ordered product';

  return (
    <span className={`dtb-order-item__thumb ${imageUrl ? 'has-image' : ''}`} aria-hidden={!imageUrl}>
      {imageUrl ? (
        <img
          src={imageUrl}
          srcSet={item?.image_srcset || undefined}
          sizes="72px"
          alt={imageAlt}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Package size={18} />
      )}
    </span>
  );
}

function getTracking(order) {
  const source = order?.tracking && typeof order.tracking === 'object' ? order.tracking : order || {};
  return {
    carrier: source.carrier || source.tracking_carrier || '',
    number: source.tracking_number || source.number || '',
    url: source.tracking_url || source.url || '',
    estimatedDelivery: source.estimated_delivery || source.estimatedDelivery || '',
    shipped: Boolean(source.shipped || source.tracking_number || source.number),
  };
}

function getPlacedAt(order) {
  return order?.placed_at || order?.date_created || order?.created_at;
}

function getLastUpdatedAt(order) {
  return order?.last_updated_at || order?.date_modified || order?.updated_at || getPlacedAt(order);
}

function getStepIndex(order) {
  const status = String(order?.status || '').toLowerCase();
  if (status === 'completed') return 4;
  if (status === 'shipped') return 3;
  if (status === 'processing') return 2;
  if (status === 'on-hold' || order?.payment_required) return 1;
  if (status === 'failed' || status === 'cancelled' || status === 'refunded') return 0;
  return 0;
}

function getStatusTone(status) {
  if (['completed', 'shipped'].includes(status)) return 'success';
  if (['failed', 'cancelled', 'refunded'].includes(status)) return 'danger';
  if (['pending', 'on-hold'].includes(status)) return 'warning';
  return 'info';
}

function StatusBadge({ status, label, paymentRequired = false }) {
  const Icon = STATUS_ICONS[status] || Package;
  const tone = getStatusTone(status);
  return (
    <span className={`dtb-order-status-badge dtb-order-status-badge--${tone}`}>
      <Icon size={14} />
      {paymentRequired && status === 'pending' ? 'Payment pending' : label || ORDER_STATUS_LABELS[status] || humanizeToken(status) || 'Order received'}
    </span>
  );
}

function TrackingSkeleton() {
  return (
    <div className="dtb-order-page page-wrapper">
      <SEOHead noindex title="Order Tracking" />
      <div className="dtb-order-tracking-shell">
        <section className="dtb-order-status-panel dtb-order-status-panel--loading">
          <span className="dtb-order-tracker-icon dtb-order-tracker-icon--neutral">
            <Loader className="animate-spin" size={30} strokeWidth={1.8} />
          </span>
          <div className="dtb-order-loading-copy">
            <p className="dtb-order-eyebrow">Order tracking</p>
            <h1 className="dtb-order-tracking-title">Loading order</h1>
            <p className="dtb-order-tracking-copy">Retrieving the latest fulfillment and shipment information.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TimelineIcon({ type }) {
  const Icon = TIMELINE_ICONS[type] || Package;
  return <Icon size={15} strokeWidth={2} />;
}

function OrderStatusTracker({ order, streaming }) {
  const status = String(order?.status || 'pending').toLowerCase();
  const activeIndex = getStepIndex(order);
  const label = resolveStatusLabel(order);
  const StatusIcon = STATUS_ICONS[status] || Package;
  const progressWidth = `${Math.max(8, (activeIndex / (TRACKING_STEPS.length - 1)) * 100)}%`;

  return (
    <section className="dtb-order-status-panel" aria-labelledby="tracking-order-title">
      <div className="dtb-order-status-panel__topline">
        <div>
          <p className="dtb-order-eyebrow">Order tracking</p>
          <h1 id="tracking-order-title" className="dtb-order-tracking-title">Order #{order?.number || order?.id}</h1>
        </div>
        <StatusBadge status={status} label={label} paymentRequired={Boolean(order?.payment_required)} />
      </div>

      <div className="dtb-order-status-panel__summary">
        <span className={`dtb-order-tracker-icon dtb-order-tracker-icon--${getStatusTone(status)}`}>
          <StatusIcon size={30} strokeWidth={1.8} />
        </span>
        <div>
          <h2>{label}</h2>
          <p>
            {order?.payment_required
              ? 'Your order is reserved. Complete secure payment to begin fulfillment.'
              : 'We will update this page as your order moves through fulfillment and shipping.'}
          </p>
        </div>
      </div>

      <div className="dtb-order-progress" aria-label="Order progress">
        <div className="dtb-order-progress__bar"><span style={{ width: progressWidth }} /></div>
        <div className="dtb-order-progress__steps">
          {TRACKING_STEPS.map((step, index) => {
            const complete = index < activeIndex;
            const active = index === activeIndex;
            return (
              <div key={step.id} className={`dtb-order-progress-step ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}>
                <span>{complete ? <CheckCircle size={13} /> : index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dtb-order-status-meta">
        <span><Clock size={14} /> Placed {formatDateTime(getPlacedAt(order))}</span>
        <span><RefreshCw size={14} /> Updated {formatDateTime(getLastUpdatedAt(order))}</span>
        <span><Package size={14} /> {formatOrderType(order?.order_type)}</span>
        {streaming ? <span className="dtb-order-live-badge"><span /> Live updates</span> : null}
      </div>
    </section>
  );
}

function PaymentActionCard({ order }) {
  if (!order?.payment_required || !order?.payment_url) return null;
  return (
    <section className="dtb-order-alert-card dtb-order-alert-card--payment" aria-labelledby="payment-action-title">
      <div>
        <p className="dtb-order-alert-card__kicker">Action needed</p>
        <h2 id="payment-action-title">Complete secure payment</h2>
        <p>Your order has been created, but payment still needs to be completed before fulfillment can begin.</p>
      </div>
      <a href={order.payment_url} className="dtb-order-button dtb-order-button--primary">
        Continue payment <ExternalLink size={15} />
      </a>
    </section>
  );
}

function ItemsCard({ items, currency }) {
  if (!items.length) return null;
  return (
    <section className="dtb-order-card dtb-order-card--tracking" aria-labelledby="tracking-items-title">
      <header className="dtb-order-card__header">
        <h2 id="tracking-items-title" className="dtb-order-card__title">
          <ShoppingBag size={20} /> Items ordered
        </h2>
        <span className="dtb-order-card__chip">{items.length} line{items.length === 1 ? '' : 's'}</span>
      </header>
      <div className="dtb-order-card__body">
        <div className="dtb-order-items dtb-order-items--friendly">
          {items.map((item, i) => {
            const price = formatMoney(item.total ?? item.price, currency);
            return (
              <article key={`${item.id || item.name || 'item'}-${i}`} className="dtb-order-item dtb-order-item--friendly">
                <div className="dtb-order-item__main">
                  <OrderItemMedia item={item} />
                  <div>
                    <h3 className="dtb-order-item__name">{item.name || 'Ordered item'}</h3>
                    <p className="dtb-order-item__meta">Quantity: {item.quantity || 1}</p>
                  </div>
                </div>
                {price ? <strong className="dtb-order-item__price">{price}</strong> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ShipmentCard({ tracking, order }) {
  const hasTracking = tracking.number || tracking.carrier || tracking.estimatedDelivery;
  return (
    <section className="dtb-order-card dtb-order-card--tracking" aria-labelledby="shipment-title">
      <header className="dtb-order-card__header">
        <h2 id="shipment-title" className="dtb-order-card__title">
          <Truck size={20} /> Shipment
        </h2>
        <span className={`dtb-order-card__chip ${hasTracking ? 'is-active' : ''}`}>{hasTracking ? 'Tracking ready' : 'Pending'}</span>
      </header>
      <div className="dtb-order-card__body">
        {hasTracking ? (
          <dl className="dtb-order-detail-list dtb-order-detail-list--compact">
            <DetailRow label="Carrier" value={tracking.carrier || 'Pending assignment'} />
            <DetailRow label="Tracking number" value={tracking.number} />
            <DetailRow label="Estimated delivery" value={formatDate(tracking.estimatedDelivery)} />
          </dl>
        ) : (
          <div className="dtb-order-empty-state">
            <span><MapPin size={20} /></span>
            <h3>Shipment details are not available yet</h3>
            <p>{order?.payment_required ? 'Shipping starts after secure payment is completed.' : 'Tracking will appear here once the order is packed and handed to the carrier.'}</p>
          </div>
        )}
        {tracking.url ? (
          <div className="dtb-order-actions dtb-order-actions--left">
            <a href={tracking.url} target="_blank" rel="noopener noreferrer" className="dtb-order-button dtb-order-button--secondary">
              Track package <ExternalLink size={14} />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="dtb-order-detail-row">
      <dt className="dtb-order-detail-label">{label}</dt>
      <dd className="dtb-order-detail-value">{value}</dd>
    </div>
  );
}

function DetailsCard({ order }) {
  return (
    <section className="dtb-order-card dtb-order-card--tracking" aria-labelledby="order-meta-title">
      <header className="dtb-order-card__header">
        <h2 id="order-meta-title" className="dtb-order-card__title">
          <CreditCard size={20} /> Order details
        </h2>
      </header>
      <div className="dtb-order-card__body">
        <dl className="dtb-order-detail-list dtb-order-detail-list--compact">
          <DetailRow label="Placed" value={formatDateTime(getPlacedAt(order))} />
          <DetailRow label="Last updated" value={formatDateTime(getLastUpdatedAt(order))} />
          <DetailRow label="Payment" value={order?.payment_method_title || humanizeToken(order?.payment_method) || 'Secure payment'} />
          <DetailRow label="Order type" value={formatOrderType(order?.order_type)} />
          {order?.total ? <DetailRow label="Total" value={formatMoney(order.total, order.currency)} /> : null}
        </dl>
      </div>
    </section>
  );
}

function OrderTimeline({ timeline }) {
  if (!timeline?.length) return null;

  return (
    <section className="dtb-order-card dtb-order-card--tracking" aria-labelledby="timeline-title">
      <header className="dtb-order-card__header">
        <h2 id="timeline-title" className="dtb-order-card__title">
          <Clock size={20} /> Activity timeline
        </h2>
      </header>
      <div className="dtb-order-card__body">
        <ol className="dtb-order-timeline dtb-order-timeline--friendly">
          {timeline.map((event, i) => (
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

  const viewModel = useMemo(() => {
    const order = data ? { ...data, id: data.id || id, number: data.number || id } : null;
    return {
      order,
      items: getLineItems(order),
      tracking: getTracking(order),
      timeline: normalizeTimeline(order?.timeline, order),
    };
  }, [data, id]);

  if (loading && !data) {
    return <TrackingSkeleton />;
  }

  if (error && !data) {
    const message = error.includes('401') || error.includes('Authentication')
      ? 'Please log in to view your order, or use the tracking link from your confirmation email.'
      : error.includes('403') || error.includes('access')
        ? 'This order tracking link is not authorized. Please use the latest link from your order email.'
        : 'We are having trouble loading your tracking information. Please try again shortly.';

    return (
      <div className="dtb-order-page page-wrapper">
        <SEOHead noindex title="Order Tracking" />
        <div className="dtb-order-tracking-shell">
          <section className="dtb-order-status-panel dtb-order-status-panel--error">
            <span className="dtb-order-tracker-icon dtb-order-tracker-icon--danger">
              <AlertCircle size={30} strokeWidth={1.8} />
            </span>
            <p className="dtb-order-eyebrow">Order tracking</p>
            <h1 className="dtb-order-tracking-title">Unable to load order</h1>
            <p className="dtb-order-tracking-copy">{message}</p>
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

  const { order, items, tracking, timeline } = viewModel;
  const isTerminal = order && ORDER_TERMINAL_STATUSES.includes(order.status);

  return (
    <div className="dtb-order-page page-wrapper">
      <SEOHead noindex title={`Order #${order?.number || id} — Tracking`} />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        className="dtb-order-tracking-shell"
      >
        <div className="dtb-order-tracking-header">
          <Link to="/dashboard?tab=orders" className="dtb-order-back-link">
            <ArrowLeft size={14} /> Back to orders
          </Link>
          <button onClick={refresh} disabled={loading} className="dtb-order-refresh-button" type="button" aria-label="Refresh order tracking">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {order ? <OrderStatusTracker order={order} streaming={streaming} /> : null}
        {order ? <PaymentActionCard order={order} /> : null}

        <div className="dtb-order-tracking-grid">
          <main className="dtb-order-stack">
            <ItemsCard items={items} currency={order?.currency} />
            <OrderTimeline timeline={timeline} />
          </main>

          <aside className="dtb-order-stack">
            <ShipmentCard tracking={tracking} order={order} />
            <DetailsCard order={order} />
          </aside>
        </div>

        {error && data ? (
          <div className="dtb-order-stale-banner" role="alert">
            Could not refresh status — showing the latest saved order information.
          </div>
        ) : null}

        <div className="dtb-order-actions dtb-order-actions--footer">
          {!isTerminal ? (
            <button onClick={refresh} className="dtb-order-button dtb-order-button--secondary" type="button">
              <RefreshCw size={15} /> Refresh status
            </button>
          ) : null}
          <Link to="/products" className="dtb-order-button dtb-order-button--primary">
            Continue Shopping
          </Link>
          <Link to="/contact" className="dtb-order-button dtb-order-button--ghost">
            Need help?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
