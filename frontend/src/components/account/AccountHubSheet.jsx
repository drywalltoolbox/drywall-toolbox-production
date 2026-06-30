import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Package, User, X, ShoppingBag, ShoppingCart, ChevronRight, AlertCircle, Loader, Wrench, RotateCcw, ChevronDown, LayoutDashboard, Calculator, LifeBuoy, BookOpen, Headphones } from 'lucide-react';
import { getCustomerOrders } from '../../api/orders.js';
import { getCustomerRepairs } from '../../api/repairs.js';
import { getCustomerReturns } from '../../api/returns.js';
import { getCustomerSupportTickets } from '../../api/support.js';
import { getRecentlyViewed } from '../../utils/recentlyViewed.js';
import { buildAccountActivity, normalizeOrders, normalizeRepairs, normalizeReturns, normalizeSupportTickets } from '../../utils/accountActivity.js';
import AccountActivityList from './AccountActivityList.jsx';

const TABS = [
  { id: 'home',    label: 'Home',    Icon: Home },
  { id: 'orders',  label: 'Orders',  Icon: Package },
  { id: 'account', label: 'Account', Icon: User },
];

const HISTORY_FILTERS = [
  { id: 'product', label: 'Product', Icon: ShoppingCart },
  { id: 'repairs', label: 'Repairs', Icon: Wrench },
  { id: 'returns', label: 'Returns', Icon: RotateCcw },
  { id: 'support', label: 'Support', Icon: Headphones },
];

function settledError(result, fallback) {
  if (!result || result.status !== 'rejected') return '';
  return result.reason?.message || fallback;
}

function AccountHubHero({ eyebrow, title, subtitle, Icon }) {
  return (
    <header className="account-hub__hero">
      <div className="account-hub__hero-pattern" aria-hidden="true" />
      <span className="account-hub__hero-icon"><Icon size={22} /></span>
      <div className="account-hub__hero-copy">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </header>
  );
}

function AccountHubAccordion({ title, Icon, open, onToggle, links, onNavigate }) {
  return (
    <section className={`account-hub__accordion${open ? ' is-open' : ''}`}>
      <button type="button" className="account-hub__accordion-trigger" onClick={onToggle} aria-expanded={open}>
        <span className="account-hub__accordion-title"><Icon size={18} />{title}</span>
        <ChevronDown size={17} />
      </button>
      <div className="account-hub__accordion-panel">
        <div>
          {links.map(({ to, label, icon: LinkIcon }) => (
            <Link key={to} to={to} onClick={onNavigate} className="account-hub__accordion-link">
              <span>{LinkIcon ? <LinkIcon size={16} /> : null}{label}</span>
              <ChevronRight size={15} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentlyViewedTile({ product, onClose }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      onClick={onClose}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', transition: 'background 0.12s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.image
          ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Package size={18} style={{ color: 'rgba(15,23,42,0.2)' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
        {product.price && <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'rgba(15,23,42,0.5)' }}>{product.price}</p>}
      </div>
      <ChevronRight size={14} strokeWidth={2.5} style={{ color: 'rgba(15,23,42,0.25)', flexShrink: 0 }} />
    </Link>
  );
}

function AccountHubSignInCTA({ onSignIn }) {
  return (
    <section className="account-hub-cta" aria-labelledby="account-hub-cta-title">
      <div className="account-hub-cta__glow" aria-hidden="true" />
      <div className="account-hub-cta__inner">
        <h2 id="account-hub-cta-title" className="account-hub-cta__headline">Track orders and manage your account</h2>
        <p className="account-hub-cta__body">Sign in for order tracking, repair requests, addresses, and contractor account tools.</p>
        <button type="button" className="account-hub-cta__button" onClick={onSignIn}>
          <span className="account-hub-cta__button-glow" aria-hidden="true" />
          <span className="account-hub-cta__button-content">Sign in<ChevronRight size={18} strokeWidth={2.4} /></span>
        </button>
      </div>
    </section>
  );
}

function RecentlyViewedSection({ recentlyViewed, closeSheet, navigate }) {
  return (
    <section className="account-hub__list-section">
      <button type="button" className="account-hub__section-header" onClick={() => { closeSheet(); navigate('/products'); }}>
        <span>Recently viewed</span>
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
      {recentlyViewed.length > 0 ? (
        <div className="account-hub__recently-viewed-list">
          {recentlyViewed.slice(0, 4).map((p) => <RecentlyViewedTile key={p.id} product={p} onClose={closeSheet} />)}
        </div>
      ) : (
        <div className="account-hub__empty-card">
          <div className="account-hub__empty-icon"><ShoppingBag size={26} strokeWidth={1.5} /></div>
          <p>Recently viewed products will appear here.</p>
        </div>
      )}
    </section>
  );
}

function filterAccountHistory(activity, filter) {
  if (filter === 'product') return activity.filter((item) => item.type === 'order');
  if (filter === 'repairs') return activity.filter((item) => item.type === 'repair' || item.type === 'repair-order');
  if (filter === 'returns') return activity.filter((item) => item.type === 'return');
  if (filter === 'support') return activity.filter((item) => item.type === 'support');
  return activity;
}

function historyFilterError(errors, filter) {
  if (filter === 'product') return errors.orders;
  if (filter === 'repairs') return errors.repairs;
  if (filter === 'returns') return errors.returns;
  if (filter === 'support') return errors.support;
  return Object.values(errors).filter(Boolean).join(' ');
}

function historyFilterEmptyCopy(filter) {
  if (filter === 'product') return 'Product orders will appear here after checkout.';
  if (filter === 'repairs') return 'Repair requests and repair service orders will appear here.';
  if (filter === 'returns') return 'Return requests will appear here.';
  if (filter === 'support') return 'Support tickets and service conversations will appear here.';
  return 'Product orders, repair requests, returns, and support tickets will appear here.';
}

export default function AccountHubSheet({ isOpen, onClose, user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [historyFilter, setHistoryFilter] = useState('product');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [returns, setReturns] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [historyErrors, setHistoryErrors] = useState({ orders: '', repairs: '', returns: '', support: '' });
  const [accountSections, setAccountSections] = useState({ services: false, support: false });

  const showOrdersTab = useCallback((filter = 'product') => {
    setHistoryFilter(filter);
    setActiveTab('orders');
  }, []);

  const closeSheet = useCallback(() => {
    setActiveTab('home');
    setHistoryFilter('product');
    setAccountSections({ services: false, support: false });
    onClose?.();
  }, [onClose]);

  const applyHistoryResults = useCallback(([ordersResult, repairsResult, returnsResult, supportResult]) => {
    setOrders(ordersResult.status === 'fulfilled' ? normalizeOrders(ordersResult.value) : []);
    setRepairs(repairsResult.status === 'fulfilled' ? normalizeRepairs(repairsResult.value) : []);
    setReturns(returnsResult.status === 'fulfilled' ? normalizeReturns(returnsResult.value) : []);
    setSupportTickets(supportResult.status === 'fulfilled' ? normalizeSupportTickets(supportResult.value) : []);
    setHistoryErrors({
      orders: settledError(ordersResult, 'Product orders are temporarily unavailable.'),
      repairs: settledError(repairsResult, 'Repairs are temporarily unavailable.'),
      returns: settledError(returnsResult, 'Returns are temporarily unavailable.'),
      support: settledError(supportResult, 'Support tickets are temporarily unavailable.'),
    });
  }, []);

  const loadOrders = useCallback(async () => {
    if (!isOpen || !user) return;
    setOrdersLoading(true);
    setHistoryErrors({ orders: '', repairs: '', returns: '', support: '' });

    const results = await Promise.allSettled([
      getCustomerOrders(user?.id, 1, 20),
      getCustomerRepairs(1, 20),
      getCustomerReturns(1, 20),
      getCustomerSupportTickets(1, 20),
    ]);

    applyHistoryResults(results);
    setOrdersLoading(false);
  }, [applyHistoryResults, isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve(getRecentlyViewed()).then(setRecentlyViewed);
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !user) return undefined;

    async function load() {
      setOrdersLoading(true);
      setHistoryErrors({ orders: '', repairs: '', returns: '', support: '' });
      const results = await Promise.allSettled([
        getCustomerOrders(user?.id, 1, 20),
        getCustomerRepairs(1, 20),
        getCustomerReturns(1, 20),
        getCustomerSupportTickets(1, 20),
      ]);
      if (cancelled) return;
      applyHistoryResults(results);
      setOrdersLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [applyHistoryResults, isOpen, user]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (e) => { if (e.key === 'Escape') closeSheet(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, closeSheet]);

  const displayName = useMemo(() => [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.display_name || 'My Account', [user]);
  const firstName = useMemo(() => {
    const preferredName = user?.first_name || user?.display_name || user?.name || displayName;
    return String(preferredName).trim().split(/\s+/)[0] || 'there';
  }, [displayName, user]);
  const activity = useMemo(() => buildAccountActivity({ orders, repairs, returns, supportTickets }), [orders, repairs, returns, supportTickets]);
  const filteredHistoryActivity = useMemo(() => filterAccountHistory(activity, historyFilter), [activity, historyFilter]);
  const historyErrorText = useMemo(() => Object.values(historyErrors).filter(Boolean).join(' '), [historyErrors]);
  const activeHistoryError = useMemo(() => historyFilterError(historyErrors, historyFilter), [historyErrors, historyFilter]);
  const allHistoryFailed = Boolean(historyErrorText) && activity.length === 0;
  const historyFilterCounts = useMemo(() => ({
    product: activity.filter((item) => item.type === 'order').length,
    repairs: activity.filter((item) => item.type === 'repair' || item.type === 'repair-order').length,
    returns: activity.filter((item) => item.type === 'return').length,
    support: activity.filter((item) => item.type === 'support').length,
  }), [activity]);

  return (
    <div className={`account-hub${isOpen ? ' account-hub--open' : ''}`} role="dialog" aria-modal="true" aria-label="Account hub" aria-hidden={!isOpen}>
      <button type="button" className="account-hub__backdrop" onClick={closeSheet} aria-label="Close account hub" tabIndex={isOpen ? 0 : -1} />

      <section className="account-hub__sheet">
        <button type="button" className="account-hub__close" onClick={closeSheet} aria-label="Close" tabIndex={isOpen ? 0 : -1}>
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="account-hub__content">
          {!user && (
            <div className="account-hub__panel account-hub__panel--guest">
              <AccountHubSignInCTA onSignIn={() => { closeSheet(); navigate('/login'); }} />
              <div className="account-hub__divider" />
              <RecentlyViewedSection recentlyViewed={recentlyViewed} closeSheet={closeSheet} navigate={navigate} />
            </div>
          )}

          {user && activeTab === 'home' && (
            <div className="account-hub__panel account-hub__panel--home">
              <AccountHubHero
                eyebrow="Account overview"
                title={`Welcome back, ${firstName}`}
                Icon={Home}
              />
              <div className="account-hub__home-header">
                <div className="account-hub__summary-grid">
                  <button type="button" onClick={() => showOrdersTab('product')} className="account-hub__summary-card">
                    <Package size={18} /><strong>{orders.length}</strong><span>Orders</span>
                  </button>
                  <button type="button" onClick={() => showOrdersTab('repairs')} className="account-hub__summary-card is-repair">
                    <Wrench size={18} /><strong>{repairs.length}</strong><span>Repairs</span>
                  </button>
                  <button type="button" onClick={() => showOrdersTab('returns')} className="account-hub__summary-card is-return">
                    <RotateCcw size={18} /><strong>{returns.length}</strong><span>Returns</span>
                  </button>
                </div>
              </div>

              <section className="account-hub__list-section">
                <button type="button" className="account-hub__section-header" onClick={() => showOrdersTab('product')}>
                  <span>Recent activity</span>
                  <span className="account-hub__section-action">View all <ChevronRight size={14} /></span>
                </button>
                {ordersLoading ? (
                  <div className="account-hub__loading"><Loader size={18} className="animate-spin" /> Loading activity…</div>
                ) : activity.length ? (
                  <>
                    {historyErrorText ? <div className="account-hub__empty-card"><p>Some account history is temporarily unavailable. Available activity is shown below.</p></div> : null}
                    <AccountActivityList items={activity} limit={4} onNavigate={closeSheet} />
                  </>
                ) : (
                  <div className="account-hub__empty-card"><div className="account-hub__empty-icon"><Package size={24} /></div><p>Your orders, repairs, returns, and support tickets will appear here.</p></div>
                )}
              </section>

              <RecentlyViewedSection recentlyViewed={recentlyViewed} closeSheet={closeSheet} navigate={navigate} />
            </div>
          )}

          {user && activeTab === 'orders' && (
            <div className="account-hub__panel">
              <AccountHubHero
                eyebrow="Account history"
                title="Orders & services"
                subtitle="Product orders, repairs, returns, and support tickets in one place."
                Icon={Package}
              />
              {ordersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px 0' }}>
                  <Loader size={20} style={{ color: '#2563eb' }} className="animate-spin" />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)' }}>Loading account history…</span>
                </div>
              ) : allHistoryFailed ? (
                <div className="account-hub__panel account-hub__panel--centered">
                  <div className="account-hub__empty-state">
                    <div className="account-hub__empty-state-icon"><AlertCircle size={34} strokeWidth={1.4} /></div>
                    <strong className="account-hub__empty-state-title">Account history unavailable</strong>
                    <p className="account-hub__empty-state-body">{historyErrorText}</p>
                    <button type="button" className="account-hub__outline-btn" onClick={loadOrders}>Retry</button>
                  </div>
                </div>
              ) : activity.length === 0 ? (
                <div className="account-hub__panel account-hub__panel--centered">
                  <div className="account-hub__empty-state">
                    <div className="account-hub__empty-state-icon"><Package size={34} strokeWidth={1.4} /></div>
                    <strong className="account-hub__empty-state-title">No account activity yet</strong>
                    <p className="account-hub__empty-state-body">Product orders, repair requests, returns, and support tickets will appear here.</p>
                    <button type="button" className="account-hub__outline-btn" onClick={() => { closeSheet(); navigate('/products'); }}>Start shopping</button>
                  </div>
                </div>
              ) : (
                <div className="account-history account-hub__history-section">
                  <div className="account-history__filters account-hub__history-filters" role="tablist" aria-label="Filter account history">
                    {HISTORY_FILTERS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={historyFilter === id}
                        className={`account-history__filter${historyFilter === id ? ' is-active' : ''}`}
                        onClick={() => setHistoryFilter(id)}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                        <strong>{historyFilterCounts[id] || 0}</strong>
                      </button>
                    ))}
                  </div>

                  {activeHistoryError ? <div className="account-history-state is-error" role="status"><AlertCircle size={18} /><span>{activeHistoryError}</span><button type="button" onClick={loadOrders}>Retry</button></div> : null}

                  {filteredHistoryActivity.length ? (
                    <AccountActivityList items={filteredHistoryActivity} onNavigate={closeSheet} />
                  ) : (
                    <div className="account-history-state">
                      <Package size={34} />
                      <strong>No activity found</strong>
                      <span>{historyFilterEmptyCopy(historyFilter)}</span>
                      {historyFilter === 'support' ? (
                        <Link to="/contact" onClick={closeSheet}>Contact support</Link>
                      ) : (
                        <Link to="/products" onClick={closeSheet}>Browse products</Link>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { closeSheet(); navigate('/dashboard?tab=orders'); }}
                    style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)', background: 'transparent', fontSize: '0.8rem', fontWeight: 650, color: '#2563eb', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    View full history <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {user && activeTab === 'account' && (
            <div className="account-hub__panel">
              <AccountHubHero
                eyebrow="My account"
                title={displayName}
                subtitle={user?.email || 'Manage your Drywall Toolbox account.'}
                Icon={User}
              />
              <div className="account-hub__account-menu">
                <Link to="/dashboard" onClick={closeSheet} className="account-hub__dashboard-link">
                  <span><LayoutDashboard size={18} />My Dashboard</span>
                  <ChevronRight size={16} />
                </Link>
                <AccountHubAccordion
                  title="Services"
                  Icon={Wrench}
                  open={accountSections.services}
                  onToggle={() => setAccountSections((state) => ({ ...state, services: !state.services }))}
                  onNavigate={closeSheet}
                  links={[
                    { to: '/repairs', label: 'Repair Services', icon: Wrench },
                    { to: '/schematics', label: 'Schematics', icon: BookOpen },
                    { to: '/calculators', label: 'Calculators', icon: Calculator },
                  ]}
                />
                <AccountHubAccordion
                  title="Support"
                  Icon={LifeBuoy}
                  open={accountSections.support}
                  onToggle={() => setAccountSections((state) => ({ ...state, support: !state.support }))}
                  onNavigate={closeSheet}
                  links={[
                    { to: '/contact', label: 'Contact Us', icon: LifeBuoy },
                    { to: '/returns', label: 'Returns Portal', icon: RotateCcw },
                    { to: '/faq', label: 'FAQ', icon: BookOpen },
                  ]}
                />
              </div>
              <section className="account-hub__list-section">
                <button type="button" className="account-hub__signout-btn" onClick={async () => { closeSheet(); await onLogout?.(); }}>Sign out</button>
              </section>
            </div>
          )}
        </div>

        {user && (
          <nav className="account-hub-nav" aria-label="Account hub navigation">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={`account-hub-nav__item${activeTab === id ? ' account-hub-nav__item--active' : ''}`} onClick={() => setActiveTab(id)} aria-selected={activeTab === id} aria-label={label} tabIndex={isOpen ? 0 : -1}>
                <span className="account-hub-nav__pill"><Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.6} /></span>
              </button>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
