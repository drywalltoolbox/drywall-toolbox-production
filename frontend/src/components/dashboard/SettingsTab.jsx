import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Loader, Lock, Mail, Save, User } from 'lucide-react';
import { useAuthContext } from '../../auth/AuthContext.js';
import { changeAccountPassword, getAccountSettings, updateAccountSettings } from '../../api/account.js';
import AddressesTab from './AddressesTab.jsx';

const DEFAULT_PREFERENCES = {
  order_updates: true,
  repair_updates: true,
  return_updates: true,
  marketing: false,
  newsletter: false,
};

function Message({ message }) {
  if (!message?.text) return null;
  return <p className={`account-settings__message is-${message.type}`} role="status">{message.text}</p>;
}

function PreferenceToggle({ name, label, description, checked, onChange }) {
  return (
    <label className="account-settings__toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span className="account-settings__toggle" aria-hidden="true" />
    </label>
  );
}

export default function SettingsTab({ user }) {
  const { updateUser, logout } = useAuthContext();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAccountSettings()
      .then((data) => {
        if (cancelled) return;
        const account = data?.user || {};
        setProfile({
          first_name: account.first_name || '',
          last_name: account.last_name || '',
          email: account.email || '',
          company: account.company || '',
          phone: account.phone || '',
        });
        setPreferences({ ...DEFAULT_PREFERENCES, ...(account.preferences || {}) });
        updateUser(account);
      })
      .catch((error) => {
        if (!cancelled) setMessage({ type: 'error', text: error?.message || 'Unable to load account settings.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [updateUser]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving('profile');
    setMessage(null);
    try {
      const data = await updateAccountSettings({ ...profile, preferences });
      updateUser(data?.user);
      setMessage({ type: 'success', text: data?.message || 'Account settings saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to save account settings.' });
    } finally {
      setSaving('');
    }
  };

  const handlePreferencesSubmit = async () => {
    setSaving('preferences');
    setMessage(null);
    try {
      const data = await updateAccountSettings({ preferences });
      updateUser(data?.user);
      setMessage({ type: 'success', text: 'Communication preferences saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to save preferences.' });
    } finally {
      setSaving('');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving('password');
    setMessage(null);
    try {
      const data = await changeAccountPassword(passwords.current, passwords.next);
      setMessage({ type: 'success', text: data?.message || 'Password updated.' });
      setPasswords({ current: '', next: '', confirm: '' });
      if (data?.reauth_required) {
        window.setTimeout(() => {
          void logout()
            .then(() => window.location.assign('/login'))
            .catch((error) => setMessage({ type: 'error', text: error?.message || 'Password updated, but secure sign out failed. Please sign out manually.' }));
        }, 1200);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Unable to update password.' });
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return <div className="account-history-state"><Loader size={20} className="animate-spin" /> Loading settings…</div>;
  }

  return (
    <div className="account-settings">
      <Message message={message} />

      <form className="account-settings__card account-settings__card--profile" onSubmit={handleProfileSubmit}>
        <header className="account-settings__card-header">
          <span className="is-blue"><User size={18} /></span>
          <div><h2>Profile</h2><p>Your account and customer contact information.</p></div>
        </header>
        <div className="account-settings__fields">
          <label>First name<input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} autoComplete="given-name" /></label>
          <label>Last name<input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} autoComplete="family-name" /></label>
          <label className="is-wide">Email address<input type="email" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} autoComplete="email" /></label>
          <label>Company<input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} autoComplete="organization" /></label>
          <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} autoComplete="tel" /></label>
        </div>
        <button className="account-settings__save" disabled={saving === 'profile'}>
          {saving === 'profile' ? <Loader size={15} className="animate-spin" /> : <Save size={15} />} Save profile
        </button>
      </form>

      <section className="account-settings__card">
        <header className="account-settings__card-header">
          <span className="is-cyan"><Bell size={18} /></span>
          <div><h2>Notifications and email</h2><p>Control account updates and optional marketing messages.</p></div>
        </header>
        <div className="account-settings__toggles">
          <PreferenceToggle name="order_updates" label="Order updates" description="Payment, fulfillment, and shipping updates." checked={preferences.order_updates} onChange={(e) => setPreferences({ ...preferences, order_updates: e.target.checked })} />
          <PreferenceToggle name="repair_updates" label="Repair updates" description="Quotes, status changes, and technician messages." checked={preferences.repair_updates} onChange={(e) => setPreferences({ ...preferences, repair_updates: e.target.checked })} />
          <PreferenceToggle name="return_updates" label="Return updates" description="Approvals, item receipt, refunds, and exchanges." checked={preferences.return_updates} onChange={(e) => setPreferences({ ...preferences, return_updates: e.target.checked })} />
          <PreferenceToggle name="marketing" label="Promotions" description="Product offers and contractor promotions." checked={preferences.marketing} onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })} />
          <PreferenceToggle name="newsletter" label="Newsletter" description="Product education, launches, and company news." checked={preferences.newsletter} onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })} />
        </div>
        <button type="button" className="account-settings__save" disabled={saving === 'preferences'} onClick={handlePreferencesSubmit}>
          {saving === 'preferences' ? <Loader size={15} className="animate-spin" /> : <Mail size={15} />} Save preferences
        </button>
      </section>

      <form className="account-settings__card" onSubmit={handlePasswordSubmit}>
        <header className="account-settings__card-header">
          <span className="is-amber"><Lock size={18} /></span>
          <div><h2>Password</h2><p>Changing your password securely signs out existing sessions.</p></div>
        </header>
        <div className="account-settings__fields">
          <label className="is-wide">Current password<input type="password" required value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} autoComplete="current-password" /></label>
          <label>New password<input type="password" required minLength={8} value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} autoComplete="new-password" /></label>
          <label>Confirm password<input type="password" required minLength={8} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} autoComplete="new-password" /></label>
        </div>
        <button className="account-settings__save is-secondary" disabled={saving === 'password'}>
          {saving === 'password' ? <Loader size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Update password
        </button>
      </form>

      <section className="account-settings__addresses">
        <header className="account-settings__section-heading">
          <div><h2>Saved addresses</h2><p>Billing and shipping addresses used during checkout.</p></div>
        </header>
        <AddressesTab user={user} />
      </section>
    </div>
  );
}
