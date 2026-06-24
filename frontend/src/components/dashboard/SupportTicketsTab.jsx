import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Loader } from 'lucide-react';
import { getCustomerSupportTickets } from '../../api/support.js';
import { buildAccountActivity, normalizeSupportTickets } from '../../utils/accountActivity.js';
import AccountActivityList from '../account/AccountActivityList.jsx';

export default function SupportTicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTickets(normalizeSupportTickets(await getCustomerSupportTickets(1, 50)));
    } catch {
      setTickets([]);
      setError('Support tickets are temporarily unavailable. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const activity = useMemo(() => buildAccountActivity({ supportTickets: tickets }), [tickets]);

  if (loading) {
    return <div className="account-history-state"><Loader size={20} className="animate-spin" /> Loading support tickets…</div>;
  }

  if (error) {
    return <div className="account-history-state is-error"><span>{error}</span><button type="button" onClick={loadTickets}>Retry</button></div>;
  }

  if (!activity.length) {
    return (
      <div className="account-history-state">
        <Headphones size={36} />
        <strong>No support tickets</strong>
        <span>Questions and support conversations will appear here.</span>
        <Link to="/contact">Contact support</Link>
      </div>
    );
  }

  return (
    <div className="account-history">
      <div className="account-history__heading">
        <div><h2>Support Tickets</h2><p>Review conversations, status updates, and replies from our support team.</p></div>
        <Link to="/contact">New ticket</Link>
      </div>
      <AccountActivityList items={activity} />
    </div>
  );
}
