export default function ResultCard({ label, value, sub, hero }) {
  return (
    <div className={`rounded-xl p-3 sm:p-4 border ${
      hero
        ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold leading-tight ${
        hero ? 'text-primary-600' : 'text-gray-900'
      }`}>
        {value ?? '—'}
      </p>
      {sub && (
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
          {sub}
        </p>
      )}
    </div>
  )
}
