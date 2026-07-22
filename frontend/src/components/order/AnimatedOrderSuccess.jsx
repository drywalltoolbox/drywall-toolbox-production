import { Link } from 'react-router-dom';

export default function AnimatedOrderSuccess({
  orderId,
  title = 'Order confirmed',
  message = 'Your order is confirmed. A receipt is on its way to your inbox.',
  titleId,
  trackingHref,
}) {
  const trackingTarget = trackingHref || (orderId
    ? `/order-tracking/${encodeURIComponent(orderId)}`
    : '/dashboard?tab=orders');

  return (
    <div className="dtb-order-success" role="status" aria-live="polite">
      <span className="dtb-order-success__mark-wrap" aria-hidden="true">
        <svg className="dtb-order-success__mark" viewBox="0 0 52 52">
          <circle className="dtb-order-success__circle" cx="26" cy="26" r="24" fill="none" />
          <path className="dtb-order-success__check" fill="none" d="M14 27l8 8 16-16" />
        </svg>
        <span className="dtb-order-success__pulse" />
      </span>
      <p className="dtb-order-eyebrow">Payment successful</p>
      <h1 id={titleId} className="dtb-order-title">{title}</h1>
      <p className="dtb-order-subtitle">{message}</p>
      <div className="dtb-order-success__actions" aria-label="Order actions">
        <Link to={trackingTarget} className="dtb-order-button dtb-order-button--primary">
          Track My Order
        </Link>
        <Link to="/products" className="dtb-order-button dtb-order-button--secondary">
          Keep Shopping
        </Link>
      </div>
    </div>
  );
}
