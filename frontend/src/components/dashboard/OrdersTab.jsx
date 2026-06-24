/**
 * Unified customer history: product orders, repair requests, and returns.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader, Package, RotateCcw, ShoppingCart, Wrench } from 'lucide-react';
import { getOrders } from '../../api/orders.js';
import { getCustomerRepairs } from '../../api/repairs.js';
import { getCustomerReturns } from '../../api/returns.js';
import {
  buildAccountActivity,
  normalizeOrders,
  normalizeRepairs,
  normalizeReturns,
} from '../../utils/accountActivity.js';
import AccountActivityList from '../account/AccountActivityList.jsx';

function rejectedMessage(result, fallback) {
  if (!result || result.status !== 'rejected') return '';
  return result.reason?.message || fallback;
}

export default function OrdersTab() {
  const [data, setData] = useState({ orders: [], repairs: [], returns: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ orders: '', repairs: '', returns: '' });
  const [filter, setFilter] = useState('all');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrors({ orders: '', repairs: '', returns: '' });

    const [ordersResult, repairsResult, returnsResult] = await Promise.allSettled([
      getOrders(1, 50),
      getCustomerRepairs(1, 50),
      getCustomerReturns(1, 50),
    ]);

    setData({
      orders: ordersResult.status === 'fulfilled' ? normalizeOrders(ordersResult.value) : [],
      repairs: repairsResult.status === 'fulfilled' ? normalizeRepairs(repairsResult.value) : [],
      returns: returnsResult.status === 'fulfilled' ? normalizeReturns(returnsResult.value) : [],
    });

    setErrors({
      orders: rejectedMessage(ordersResult, 'Orders are temporarily unavailable.'),
      repairs: rejectedMessage(repairsResult, 'Repairs are temporarily unavailable.'),
      returns: rejectedMessage(returnsResult, 'Returns are temporarily unavailable.'),
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const activity = useMemo(() => buildAccountActivity(data), [data]);
  const filteredActivity = useMemo(() => {
    if (filter === 'all') return activity;
    if (filter === 'orders') return activity.filter((item) => item.type === 'order' || item.type === 'repair-order');
    return activity.filter((item) => item.type === filter);
  }, [activity, filter]);

  const filters = [
    { id: 'all', label: 'All activity', count: activity.length, Icon: Package },
    { id: 'orders', label: 'Orders', count: data.orders.length, Icon: ShoppingCart },
    { id: 'repair', label: 'Repairs', count: data.repairs.length, Icon: Wrench },
    { id: 'return', label: 'Returns', count: data.returns.length, Icon: RotateCcw },
  ];

  const activeError = useMemo(() => {
    if (filter === 'orders') return errors.orders;
    if (filter === 'repair') return errors.repairs;
    if (filter === 'return') return errors.returns;
    return [errors.orders, errors.repairs, errors.returns].filter(Boolean).join(' ');
  }, [errors, filter]);

  if (loading) {
    return <div className="account-history-state"><Loader size={20} className="animate-spin" /> Loading account history…</div>;
  }

  return (
    <div className="account-history">
      <div className="account-history__filters" role="tablist" aria-label="Filter account history">
        {filters.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`account-history__filter${filter === id ? ' is-active' : ''}`}
            onClick={() => setFilter(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>

      {activeError ? (
        <div className="account-history-state is-error" role="status">
          <AlertCircle size={18} />
          <span>{activeError}</span>
          <button type="button" onClick={loadHistory}>Retry</button>
        </div>
      ) : null}

      {filteredActivity.length ? (
        <AccountActivityList items={filteredActivity} />
      ) : (
        <div className="account-history-state">
          <Package size={34} />
          <strong>No activity found</strong>
          <span>Your product orders, repair requests, and returns will appear here.</span>
          <Link to="/products">Browse products</Link>
        </div>
      )}
    </div>
  );
}
