import { useState, useMemo, useEffect } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import WasteSelector from './shared/WasteSelector'
import RoomPresets from './shared/RoomPresets'
import CalcDropdown from './shared/CalcDropdown'

// Default to a standard 12×14 bedroom with 4 walls
const DEFAULT_WALLS = [
  { id: 1, length: 12 },
  { id: 2, length: 14 },
  { id: 3, length: 12 },
  { id: 4, length: 14 },
]

// Standard opening deductions per GA-216 / ASTM C1396 (sq ft)
const DOOR_SQ_FT = 21   // ~6.8 ft wide × 3.1 ft tall
const WINDOW_SQ_FT = 15 // ~3 ft × 5 ft

const LS_KEY = 'dwCalc_sheet'

const sheetSizeOptions = [
  { value: 32, label: '4×8 ft',  description: '32 sq ft' },
  { value: 40, label: '4×10 ft', description: '40 sq ft' },
  { value: 48, label: '4×12 ft', description: '48 sq ft' },
]

const hangDirOptions = [
  { value: 'horizontal', label: 'Horizontal', description: 'Recommended — fewer seams' },
  { value: 'vertical',   label: 'Vertical',   description: 'Use on very tall walls' },
]

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

export default function SheetCalculator({ onUpdate }) {
  const saved = loadSaved()
  const [walls, setWalls] = useState(saved.walls || DEFAULT_WALLS)
  const [ceilHeight, setCeilHeight] = useState(saved.ceilHeight ?? 9)
  const [sheetSize, setSheetSize] = useState(saved.sheetSize ?? 48)
  const [hangDir, setHangDir] = useState(saved.hangDir ?? 'horizontal')
  const [doors, setDoors] = useState(saved.doors ?? 1)
  const [windows, setWindows] = useState(saved.windows ?? 2)
  const [wastePct, setWastePct] = useState(saved.wastePct ?? 0.10)
  const [inclCeiling, setInclCeiling] = useState(saved.inclCeiling ?? false)
  const [roomLength, setRoomLength] = useState(saved.roomLength ?? 12)
  const [roomWidth, setRoomWidth] = useState(saved.roomWidth ?? 14)

  // All calculation logic lives in useMemo — recalculates only when inputs change
  const results = useMemo(() => {
    const wallGross = walls.reduce((sum, w) => sum + (w.length || 0) * ceilHeight, 0)
    const ceilArea = inclCeiling ? roomLength * roomWidth : 0
    const gross = wallGross + ceilArea
    const deductions = doors * DOOR_SQ_FT + windows * WINDOW_SQ_FT
    const net = Math.max(0, gross - deductions)
    const withWaste = net * (1 + wastePct)
    const sheets = Math.ceil(withWaste / sheetSize)
    return { wallGross, ceilArea, gross, net, withWaste, sheets }
  }, [walls, ceilHeight, sheetSize, doors, windows, wastePct, inclCeiling, roomLength, roomWidth])

  // Persist inputs across page refreshes
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ walls, ceilHeight, sheetSize, hangDir, doors, windows, wastePct, inclCeiling, roomLength, roomWidth }))
  }, [walls, ceilHeight, sheetSize, hangDir, doors, windows, wastePct, inclCeiling, roomLength, roomWidth])

  // Notify parent of updates for summary tab
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        sheets: results.sheets,
        sheetSize,
        hangDir,
        gross: Math.round(results.gross),
        net: Math.round(results.net),
        wallArea: Math.round(results.wallGross),
        ceilArea: Math.round(results.ceilArea),
        wastePct,
        numWalls: walls.length,
        doors,
        windows,
        inclCeiling,
      })
    }
  }, [results, sheetSize, hangDir, wastePct, walls.length, doors, windows, inclCeiling, onUpdate])

  const addWall = () =>
    setWalls(prev => [...prev, { id: Date.now(), length: 10 }])

  const removeWall = (id) =>
    setWalls(prev => prev.filter(w => w.id !== id))

  const updateWallLength = (id, length) =>
    setWalls(prev => prev.map(w => w.id === id ? { ...w, length: +length } : w))

  const applyRoomPreset = (preset) => {
    setWalls([
      { id: Date.now() + 1, length: preset.length },
      { id: Date.now() + 2, length: preset.width },
      { id: Date.now() + 3, length: preset.length },
      { id: Date.now() + 4, length: preset.width },
    ])
  }

  const wasteLabel = ['5%', '10%', '15%', '20%'][[0.05, 0.10, 0.15, 0.20].indexOf(wastePct)] || `${Math.round(wastePct * 100)}%`

  return (
    <div className="space-y-6">
      {/* Room presets */}
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Room Presets
        </h3>
        <RoomPresets onApply={applyRoomPreset} />
      </div>

      {/* Sheet size + hang direction */}
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Sheet Size &amp; Hang Direction
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sheet size
            </label>
            <CalcDropdown
              value={sheetSize}
              onChange={v => setSheetSize(+v)}
              options={sheetSizeOptions}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Hang direction
            </label>
            <CalcDropdown
              value={hangDir}
              onChange={setHangDir}
              options={hangDirOptions}
            />
          </div>
        </div>
      </div>

      {/* Wall list */}
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Walls — enter each wall length
        </h3>
        <div className="space-y-2">
          {walls.map((wall, index) => (
            <div
              key={wall.id}
              className="bg-gray-50 rounded-xl p-3 border border-gray-200/60"
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm font-semibold text-gray-900">
                  Wall {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 tabular-nums">
                    {Math.round((wall.length || 0) * ceilHeight)} sq ft
                  </span>
                  {walls.length > 1 && (
                    <button
                      onClick={() => removeWall(wall.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-base leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Length (ft)
                  </label>
                  <input
                    type="number"
                    value={wall.length}
                    min={1}
                    step={0.5}
                    onChange={e => updateWallLength(wall.id, e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      value={ceilHeight}
                      readOnly
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Area (sq ft)
                    </label>
                    <input
                      type="number"
                      value={Math.round((wall.length || 0) * ceilHeight)}
                      readOnly
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addWall}
          className="w-full mt-2 px-4 py-2.5 border border-dashed border-primary-300 rounded-xl text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
        >
          + Add another wall
        </button>
      </div>

      {/* Openings + ceiling height */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Ceiling height (ft)
          </label>
          <input
            type="number"
            value={ceilHeight}
            min={6}
            max={20}
            step={0.5}
            onChange={e => setCeilHeight(+e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Door openings
          </label>
          <input
            type="number"
            value={doors}
            min={0}
            onChange={e => setDoors(+e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <span className="text-xs text-gray-500 mt-1.5 block leading-snug">
            Each deducts 21 sq ft (GA-216)
          </span>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Window openings
          </label>
          <input
            type="number"
            value={windows}
            min={0}
            onChange={e => setWindows(+e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <span className="text-xs text-gray-500 mt-1.5 block leading-snug">
            Each deducts 15 sq ft
          </span>
        </div>
      </div>

      {/* Ceiling option */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inclCeiling}
            onChange={e => setInclCeiling(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600"
          />
          <span className="text-sm font-medium text-gray-900">
            Include ceiling
          </span>
        </label>
        {inclCeiling && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Room length (ft)
              </label>
              <input
                type="number"
                value={roomLength}
                min={1}
                step={0.5}
                onChange={e => setRoomLength(+e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Room width (ft)
              </label>
              <input
                type="number"
                value={roomWidth}
                min={1}
                step={0.5}
                onChange={e => setRoomWidth(+e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 leading-snug">
                Ceiling area: {Math.round(roomLength * roomWidth)} sq ft
                {' '}(use ⅝″ board at 24″ OC to prevent sag)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Waste selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Waste factor
        </label>
        <WasteSelector value={wastePct} onChange={setWastePct} />
      </div>

      {/* Results */}
      <div className="border-t border-gray-200 pt-6">
        <div
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-4"
          aria-live="polite"
          aria-label="Sheet calculator results"
        >
          <ResultCard
            label="Sheets to order"
            value={results.sheets}
            sub={`${sheetSize} sq ft per sheet`}
            hero
          />
          <ResultCard
            label="Net area"
            value={Math.round(results.net)}
            sub="sq ft after openings"
          />
          <ResultCard
            label="Wall area"
            value={Math.round(results.wallGross)}
            sub="sq ft (gross)"
          />
          {inclCeiling && (
            <ResultCard
              label="Ceiling area"
              value={Math.round(results.ceilArea)}
              sub="sq ft"
            />
          )}
          <ResultCard
            label="With waste"
            value={Math.round(results.withWaste)}
            sub={`sq ft (${wasteLabel} added)`}
          />
        </div>

        <InfoBox>
          {results.sheets > 0
            ? `${results.sheets} sheets covers ${Math.round(results.net)} sq ft net across ${walls.length} wall(s)${inclCeiling ? ' + ceiling' : ''} — ${doors} door(s) and ${windows} window(s) deducted, with ${wasteLabel} waste added.`
            : 'Add your wall lengths above to see the sheet count.'}
        </InfoBox>
      </div>
    </div>
  )
}

