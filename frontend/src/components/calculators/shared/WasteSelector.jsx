export default function WasteSelector({ value, onChange }) {
  const wasteLevels = [
    { label: '5%', sub: 'simple', value: 0.05 },
    { label: '10%', sub: 'standard', value: 0.10 },
    { label: '15%', sub: 'complex', value: 0.15 },
    { label: '20%', sub: 'heavy', value: 0.20 },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {wasteLevels.map(level => (
        <button
          key={level.value}
          className={`px-2 py-2.5 text-sm rounded-xl border transition-all text-center font-medium ${
            value === level.value
              ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-gray-900'
          }`}
          onClick={() => onChange(level.value)}
        >
          <span className="block font-semibold leading-tight">{level.label}</span>
          <span className={`block text-[11px] mt-0.5 ${value === level.value ? 'text-primary-200' : 'text-gray-400'}`}>{level.sub}</span>
        </button>
      ))}
    </div>
  )
}
