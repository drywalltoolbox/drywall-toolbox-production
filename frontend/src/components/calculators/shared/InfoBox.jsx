export default function InfoBox({ children, variant = 'info' }) {
  return (
    <div className={`rounded-xl border p-4 text-sm leading-relaxed ${
      variant === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-primary-200 bg-primary-50 text-primary-800'
    }`}>
      {children}
    </div>
  )
}
