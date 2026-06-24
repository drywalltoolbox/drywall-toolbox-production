import { REPAIR_STATUS_LABELS } from '../api/repairs.js';
import { RETURN_STATUS_LABELS } from '../api/statusTracking.js';

function timestamp(value) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeOrders(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.orders) ? data.orders : [];
}

export function normalizeRepairs(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.repairs)) return data.repairs;
  return Array.isArray(data?.data?.repairs) ? data.data.repairs : [];
}

export function normalizeReturns(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.returns) ? data.returns : [];
}

export function normalizeSupportTickets(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.tickets) ? data.tickets : [];
}

export function buildAccountActivity({ orders = [], repairs = [], returns = [], supportTickets = [] }) {
  return [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: order.order_type === 'repair_service' ? 'repair-order' : 'order',
      label: order.order_type === 'repair_service' ? 'Repair service order' : 'Product order',
      title: `Order #${order.number || order.id}`,
      detail: order.items_count ? `${order.items_count} item${order.items_count === 1 ? '' : 's'}` : '',
      status: order.status || 'pending',
      statusLabel: String(order.status || 'pending').replace(/-/g, ' '),
      date: order.date_created || '',
      sortDate: timestamp(order.date_created),
      amount: Number(order.total || 0),
      href: `/order/${order.id}${order.order_key ? `?order_key=${encodeURIComponent(order.order_key)}` : ''}`,
    })),
    ...repairs.map((repair) => {
      const id = repair.repair_id || repair.id || repair.number;
      const token = repair.public_token || repair.token;
      return {
        id: `repair-${id}`,
        type: 'repair',
        label: 'Repair request',
        title: `Repair #${repair.number || id}`,
        detail: repair.tool_label || repair.product_name || 'Repair service',
        status: repair.status || 'submitted',
        statusLabel: repair.label || REPAIR_STATUS_LABELS[repair.status] || String(repair.status || 'submitted').replace(/_/g, ' '),
        date: repair.submitted_at || repair.created_at || '',
        sortDate: timestamp(repair.submitted_at || repair.created_at),
        href: token
          ? `/repairs/status/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`
          : `/repairs/status/${encodeURIComponent(id)}`,
      };
    }),
    ...returns.map((item) => ({
      id: `return-${item.id}`,
      type: 'return',
      label: 'Return request',
      title: `Return #${item.id}`,
      detail: item.order_number ? `Order #${item.order_number}` : item.reason || 'Return request',
      status: item.status || 'pending_review',
      statusLabel: item.status_label || RETURN_STATUS_LABELS[item.status] || String(item.status || 'pending_review').replace(/_/g, ' '),
      date: item.created_at || '',
      sortDate: timestamp(item.created_at),
      href: item.public_token
        ? `/returns/status/${encodeURIComponent(item.id)}?token=${encodeURIComponent(item.public_token)}`
        : '/returns',
    })),
    ...supportTickets.map((ticket) => ({
      id: `support-${ticket.id}`,
      type: 'support',
      label: 'Support ticket',
      title: `Support #${ticket.id}`,
      detail: ticket.subject || (ticket.order_id ? `Order #${ticket.order_id}` : 'Support request'),
      status: ticket.status || 'open',
      statusLabel: ticket.status_label || String(ticket.status || 'open').replace(/_/g, ' '),
      date: ticket.updated_at || ticket.created_at || '',
      sortDate: timestamp(ticket.updated_at || ticket.created_at),
      href: ticket.public_token
        ? `/support/status/${encodeURIComponent(ticket.id)}?token=${encodeURIComponent(ticket.public_token)}`
        : '/contact',
    })),
  ].sort((a, b) => b.sortDate - a.sortDate);
}
