import { useGlobalLoading } from '../../context/GlobalLoadingContext.jsx';

export default function GlobalLoadingOverlay() {
  const { isLoading } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div className="dtb-global-loading-overlay" role="status" aria-live="polite" aria-label="Loading">
      <svg viewBox="25 25 50 50" className="dtb-global-loading-spinner" aria-hidden="true">
        <circle r="20" cy="50" cx="50" />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  );
}
