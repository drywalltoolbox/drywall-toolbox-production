import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, RotateCcw } from 'lucide-react';
import { getCustomerReturns } from '../../api/returns.js';
import { buildAccountActivity, normalizeReturns } from '../../utils/accountActivity.js';
import AccountActivityList from '../account/AccountActivityList.jsx';

export default function ReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReturns(normalizeReturns(await getCustomerReturns(1, 50)));
    } catch {
      setReturns([]);
      setError('Returns are temporarily unavailable. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const activity = useMemo(() => buildAccountActivity({ returns }), [returns]);

  if (loading) {
    return <div className="account-history-state"><Loader size={20} className="animate-spin" /> Loading returns…</div>;
  }

  if (error) {
    return <div className="account-history-state is-error"><span>{error}</span><button type="button" onClick={loadReturns}>Retry</button></div>;
  }

  if (!activity.length) {
    return (
      <div className="account-history-state">
        <RotateCcw size={36} />
        <strong>No return requests</strong>
        <span>Return requests and refund or exchange updates will appear here.</span>
        <Link to="/returns">Open returns portal</Link>
      </div>
    );
  }

  return (
    <div className="account-history">
      <div className="account-history__heading">
        <div><h2>Returns</h2><p>Track approvals, received items, refunds, and exchanges.</p></div>
        <Link to="/returns">Start a return</Link>
      </div>
      <AccountActivityList items={activity} />
    </div>
  );
}
