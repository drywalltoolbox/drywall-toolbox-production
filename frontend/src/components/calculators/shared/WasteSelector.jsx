export default function WasteSelector({ value, onChange }) {
  const wasteLevels = [
    { label: '5% simple', value: 0.05 },
    { label: '10% standard', value: 0.10 },
    { label: '15% complex', value: 0.15 },
    { label: '20% heavy', value: 0.20 },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {wasteLevels.map(level => (
        <button
          key={level.value}
          className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
            value === level.value
              ? 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-600 font-medium text-gray-900 dark:text-gray-100'
              : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => onChange(level.value)}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}
