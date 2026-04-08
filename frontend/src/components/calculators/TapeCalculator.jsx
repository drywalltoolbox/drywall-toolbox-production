import { useState, useMemo, useEffect } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'

const LS_KEY = 'dwCalc_tape'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

const sheetSizes = [
  { value: 32,   label: '4×8 ft',     description: '32 sq ft' },
  { value: 48,   label: '4×12 ft',    description: '48 sq ft' },
  { value: 54,   label: '4×13.5 ft',  description: '54 sq ft' },
]

const tapeTypes = [
  { value: 'paper', label: 'Paper tape',         description: 'Standard seams — embed in mud' },
  { value: 'mesh',  label: 'Fiberglass mesh',    description: 'Self-adhering, +15% for stretch' },
  { value: 'flex',  label: 'Flexible corner',    description: 'Inside & outside corners' },
]

const rollSizes = [
  { value: 75,  label: '75 ft' },
  { value: 250, label: '250 ft' },
  { value: 500, label: '500 ft' },
]

const tips = {
  paper: 'Paper tape requires embedding in mud. Run it tight to the seam with no wrinkles — bubbles cause cracking.',
  mesh:  "Mesh tape self-adheres and is faster to apply, but requires setting-type compound for strength. We've added 15% for stretch.",
  flex:  'Flexible corner tape works on both inside and outside corners — great for rounded transitions.',
}

export default function TapeCalculator({ onUpdate }) {
  const saved = loadSaved()
  const [area, setArea]               = useState(saved.area          ?? 800)
  const [insideCorners, setInsideCorners] = useState(saved.insideCorners ?? saved.corners ?? 4)
  const [sheetSize, setSheetSize]     = useState(saved.sheetSize     ?? 48)
  const [tapeType, setTapeType]       = useState(saved.tapeType      ?? 'paper')
  const [rollSize, setRollSize]       = useState(saved.rollSize      ?? 500)
  const [ceilHeight, setCeilHeight]   = useState(saved.ceilHeight    ?? 9)

  const results = useMemo(() => {
    // Industry standard: ~1 linear ft of tape per sq ft of drywall (all seams + inside corners)
    // Source: engineerfix.com, spikevm.com, basicfreetools.com — geometrically validated
    // (a 4×8 sheet = 32 sq ft ≈ 32 linear ft of joint perimeter)
    const baseSeamFt    = Math.round(area * 1.0)
    // Inside corners (wall-to-wall and wall-to-ceiling transitions): each adds height ft of tape
    const insideCornerFt = Math.round(insideCorners * ceilHeight)
    // Mesh tape physically stretches ~15% more per roll consumed
    const meshMultiplier = tapeType === 'mesh' ? 1.15 : 1
    // 10% waste factor on all tape (cuts, overlaps, mistakes)
    const total = Math.round((baseSeamFt + insideCornerFt) * meshMultiplier * 1.10)
    const rolls = Math.ceil(total / rollSize)
    return { seamFt: baseSeamFt, cornerFt: insideCornerFt, total, rolls }
  }, [area, insideCorners, ceilHeight, rollSize, tapeType])

  // Persist inputs across page refreshes
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ area, insideCorners, sheetSize, tapeType, rollSize, ceilHeight }))
  }, [area, insideCorners, sheetSize, tapeType, rollSize, ceilHeight])

  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        rolls:       results.rolls,
        tapeType,
        rollSize,
        totalFeet:   results.total,
        seamFeet:    results.seamFt,
        cornerFeet:  results.cornerFt,
      })
    }
  }, [results, tapeType, rollSize, onUpdate])

  return (
    <div className="space-y-6">

      {/* ── Section 1: Area & corners ─────────────────────────── */}
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Wall &amp; Ceiling Area
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label htmlFor="tp-area" className="block text-xs font-medium text-gray-600 mb-1.5">
              Total drywall area (sq ft)
            </label>
            <input
              id="tp-area"
              type="number"
              value={area}
              min={1}
              onChange={e => setArea(+e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm leading-snug focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <span className="text-xs text-gray-500 mt-1.5 block leading-snug">
              Walls + ceiling combined
            </span>
          </div>
          <div>
            <label htmlFor="tp-corners" className="block text-xs font-medium text-gray-600 mb-1.5">
              Inside corners
            </label>
            <input
              id="tp-corners"
              type="number"
              value={insideCorners}
              min={0}
              onChange={e => setInsideCorners(+e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm leading-snug focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <span className="text-xs text-gray-500 mt-1.5 block leading-snug">
              Wall-to-wall &amp; wall-to-ceiling joints
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Height + Sheet size + Tape type ───────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div>
          <label htmlFor="tp-ceil" className="block text-xs font-medium text-gray-600 mb-1.5">
            Ceiling height (ft)
          </label>
          <input
            id="tp-ceil"
            type="number"
            value={ceilHeight}
            min={6}
            max={20}
            step={0.5}
            onChange={e => setCeilHeight(+e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm leading-snug focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="tp-sheet" className="block text-xs font-medium text-gray-600 mb-1.5">
            Sheet size used
          </label>
          <CalcDropdown
            id="tp-sheet"
            value={sheetSize}
            onChange={v => setSheetSize(+v)}
            options={sheetSizes}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="tp-type" className="block text-xs font-medium text-gray-600 mb-1.5">
            Tape type
          </label>
          <CalcDropdown
            id="tp-type"
            value={tapeType}
            onChange={setTapeType}
            options={tapeTypes}
          />
        </div>
      </div>

      {/* ── Section 3: Roll size toggle ───────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">
          Roll size
        </p>
        <div className="flex gap-2" role="group" aria-label="Roll size">
          {rollSizes.map(size => {
            const active = rollSize === size.value
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => setRollSize(size.value)}
                aria-pressed={active}
                className={[
                  'flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all duration-150',
                  active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400',
                ].join(' ')}
              >
                {size.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-6">
        <div
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-4"
          aria-live="polite"
          aria-label="Tape calculator results"
        >
          <ResultCard
            label="Tape rolls needed"
            value={results.rolls}
            sub={`${rollSize} ft rolls`}
            hero
          />
          <ResultCard
            label="Total linear feet"
            value={results.total.toLocaleString()}
            sub="ft of tape total"
          />
          <ResultCard
            label="Field seam tape"
            value={results.seamFt.toLocaleString()}
            sub="ft for field seams"
          />
          <ResultCard
            label="Corner tape"
            value={results.cornerFt.toLocaleString()}
            sub="ft for inside corners"
          />
        </div>

        <InfoBox>
          {tips[tapeType]}
        </InfoBox>
      </div>

    </div>
  )
}

