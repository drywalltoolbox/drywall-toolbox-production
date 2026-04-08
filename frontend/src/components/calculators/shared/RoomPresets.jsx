export default function RoomPresets({ onApply }) {
  const presets = [
    { name: 'Bedroom', width: 12, length: 14 },
    { name: 'Master BR', width: 16, length: 18 },
    { name: 'Living Room', width: 18, length: 20 },
    { name: 'Kitchen', width: 12, length: 16 },
    { name: 'Bathroom', width: 8, length: 10 },
    { name: 'Garage', width: 20, length: 24 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
      {presets.map(preset => (
        <button
          key={preset.name}
          onClick={() => onApply(preset)}
          className="p-3 border border-gray-300 dark:border-gray-700 rounded-md text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {preset.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {preset.width}×{preset.length} ft
          </div>
        </button>
      ))}
    </div>
  )
}
