import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function canUseBrowserBack() {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

export default function SmartBackButton({
  fallbackTo = '/dashboard',
  label = 'Back',
  className = '',
  variant = 'light',
}) {
  const navigate = useNavigate();
  const baseClass = variant === 'dark'
    ? 'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40'
    : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100';

  const handleClick = useCallback((event) => {
    if (!canUseBrowserBack()) return;
    event.preventDefault();
    navigate(-1);
  }, [navigate]);

  return (
    <Link to={fallbackTo} onClick={handleClick} className={`${baseClass} ${className}`.trim()}>
      <ArrowLeft size={15} />
      {label}
    </Link>
  );
}
