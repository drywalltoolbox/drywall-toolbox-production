export default function InfoBox({ children, variant = 'info' }) {
  const variants = {
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
    warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    success: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
  }

  return (
    <div className={`rounded-lg border-l-4 p-4 text-sm ${variants[variant]}`}>
      {children}
    </div>
  )
}
