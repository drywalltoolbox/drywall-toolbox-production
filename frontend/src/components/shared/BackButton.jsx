import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  onClick,
  label = 'Back',
  className = '',
  hideLabelOnMobile = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`back-button ${className}`}
      aria-label={label}
      title={label}
    >
      <ArrowLeft size={20} />
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{label}</span>
    </button>
  );
}
