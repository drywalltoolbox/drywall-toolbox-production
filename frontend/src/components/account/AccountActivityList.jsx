import { Link } from 'react-router-dom';
import { ChevronRight, Headphones, Package, RotateCcw, Wrench } from 'lucide-react';

const TYPE_CONFIG = {
  order: { Icon: Package, className: 'is-order' },
  'repair-order': { Icon: Wrench, className: 'is-repair' },
  repair: { Icon: Wrench, className: 'is-repair' },
  return: { Icon: RotateCcw, className: 'is-return' },
  support: { Icon: Headphones, className: 'is-support' },
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AccountActivityList({ items, limit, onNavigate }) {
  const visibleItems = typeof limit === 'number' ? items.slice(0, limit) : items;

  return (
    <div className="account-activity-list">
      {visibleItems.map((item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.order;
        return (
          <Link key={item.id} to={item.href} onClick={onNavigate} className="account-activity-card">
            <span className={`account-activity-card__icon ${config.className}`}>
              <config.Icon size={18} strokeWidth={2} />
            </span>
            <span className="account-activity-card__body">
              <span className="account-activity-card__eyebrow">{item.label}</span>
              <span className="account-activity-card__title">{item.title}</span>
              <span className="account-activity-card__meta">
                {[item.detail, formatDate(item.date)].filter(Boolean).join(' · ')}
              </span>
            </span>
            <span className="account-activity-card__aside">
              <span className={`account-activity-card__status is-${item.type}`}>{item.statusLabel}</span>
              {Number.isFinite(item.amount) ? (
                <strong className="account-activity-card__amount">${item.amount.toFixed(2)}</strong>
              ) : null}
            </span>
            <ChevronRight className="account-activity-card__chevron" size={16} />
          </Link>
        );
      })}
    </div>
  );
}
