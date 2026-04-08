export default function RoomPresets({ onApply }) {
  const presets = [
    { name: 'Bedroom', width: 12, length: 14 },
    { name: 'Master BR', width: 16, length: 18 },
    { name: 'Living Rm', width: 18, length: 20 },
    { name: 'Kitchen', width: 12, length: 16 },
    { name: 'Bathroom', width: 8, length: 10 },
    { name: 'Garage', width: 20, length: 24 },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {presets.map(preset => (
        <button
          key={preset.name}
          onClick={() => onApply(preset)}
          className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-primary-50 hover:border-primary-300 transition-all active:scale-95"
        >
          <div className="font-semibold text-xs text-gray-800 leading-tight">
            {preset.name}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {preset.width}×{preset.length}
          </div>
        </button>
      ))}
    </div>
  )
}
