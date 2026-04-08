import { useState, useMemo, useEffect } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'
import CalcDropdown from './shared/CalcDropdown'

const LS_KEY = 'dwCalc_screws'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

const spacingOptions = [
  { value: '16', label: '16" on center', description: 'Standard framing' },
  { value: '24', label: '24" on center', description: 'Wide-bay framing' },
]

const applicationOptions = [
  { value: 'wall',    label: 'Walls',           description: '16" field spacing' },
  { value: 'ceiling', label: 'Ceiling',          description: '12" field spacing (ASTM C840)' },
  { value: 'both',    label: 'Walls + ceiling',  description: 'Average density' },
]

const sheetSizeOptions = [
  { value: 32, label: '4×8 ft',  description: '32 sq ft' },
  { value: 40, label: '4×10 ft', description: '40 sq ft' },
  { value: 48, label: '4×12 ft', description: '48 sq ft' },
]

const screwLengthOptions = [
  { value: '1-1/4"', label: '1-1/4"', description: 'Single layer on wood' },
  { value: '1-5/8"', label: '1-5/8"', description: 'Standard single layer' },
  { value: '2-1/2"', label: '2-1/2"', description: 'Double layer / thick' },
  { value: '3"',     label: '3"',      description: 'Through thick framing' },
]

const boxSizeOptions = [
  { value: 175,  label: '1 lb box',  description: '~175 screws' },
  { value: 875,  label: '5 lb box',  description: '~875 screws' },
  { value: 1750, label: '10 lb box', description: '~1,750 screws' },
]

export default function ScrewCalculator({ onUpdate }) {
  const saved = loadSaved()
  const [sheets, setSheets] = useState(saved.sheets ?? 20)
  const [spacing, setSpacing] = useState(saved.spacing ?? '16')
  const [application, setApplication] = useState(saved.application ?? 'wall')
  const [sheetSize, setSheetSize] = useState(saved.sheetSize ?? 48)
  const [screwLength, setScrewLength] = useState(saved.screwLength ?? '1-5/8"')
  const [boxSize, setBoxSize] = useState(saved.boxSize ?? 875)

  const results = useMemo(() => {
    const size = +sheetSize
    // Per-sheet screw counts per ASTM C840-23:
    // Walls:    edges 8" OC,  field 16" OC
    // Ceilings: edges 7" OC,  field 12" OC (tighter per ASTM C840-23 to prevent sag)
    let perSheet
    if (size === 32) {          // 4×8 ft
      perSheet = spacing === '16'
        ? (application === 'ceiling' ? 40 : 32)
        : (application === 'ceiling' ? 32 : 28)
    } else if (size === 40) {   // 4×10 ft
      perSheet = spacing === '16'
        ? (application === 'ceiling' ? 50 : 40)
        : (application === 'ceiling' ? 40 : 34)
    } else {                    // 4×12 ft
      perSheet = spacing === '16'
        ? (application === 'ceiling' ? 60 : 48)
        : (application === 'ceiling' ? 48 : 40)
    }

    if (application === 'both') {
      // Average of wall and ceiling density weighted 50/50
      const wallCount = size === 32
        ? (spacing === '16' ? 32 : 28)
        : size === 40
          ? (spacing === '16' ? 40 : 34)
          : (spacing === '16' ? 48 : 40)
      const ceilCount = size === 32
        ? (spacing === '16' ? 40 : 32)
        : size === 40
          ? (spacing === '16' ? 50 : 40)
          : (spacing === '16' ? 60 : 48)
      perSheet = Math.round((wallCount + ceilCount) / 2)
    }

    const total = Math.ceil(sheets * perSheet * 1.10)  // 10% overage for stripping/breakage
    const boxes = Math.ceil(total / boxSize)

    return { perSheet, total, boxes }
  }, [sheets, spacing, application, sheetSize, boxSize])

  // Persist inputs across page refreshes
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ sheets, spacing, application, sheetSize, screwLength, boxSize }))
  }, [sheets, spacing, application, sheetSize, screwLength, boxSize])

  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        boxes: results.boxes,
        screwLength,
        boxSize,
        totalScrews: results.total,
        perSheet: results.perSheet,
        application
      })
    }
  }, [results, screwLength, boxSize, application, onUpdate])

  const appLabel = {
    wall:    'walls (16" field spacing)',
    ceiling: 'ceilings (12" field spacing)',
    both:    'walls + ceiling'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Job Details
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sheets to hang
            </label>
            <input
              type="number"
              value={sheets}
              min={1}
              onChange={e => setSheets(+e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Stud / joist spacing
            </label>
            <CalcDropdown
              value={spacing}
              onChange={setSpacing}
              options={spacingOptions}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Application
          </label>
          <CalcDropdown
            value={application}
            onChange={setApplication}
            options={applicationOptions}
          />
          <span className="text-xs text-gray-500 mt-1.5 block leading-snug">
            Ceilings need closer spacing
          </span>
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Screw length
          </label>
          <CalcDropdown
            value={screwLength}
            onChange={setScrewLength}
            options={screwLengthOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Box size
          </label>
          <CalcDropdown
            value={boxSize}
            onChange={v => setBoxSize(+v)}
            options={boxSizeOptions}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-4"
          aria-live="polite"
          aria-label="Screw calculator results"
        >
          <ResultCard
            label="Boxes to buy"
            value={results.boxes}
            sub={`${boxSize.toLocaleString()} screws/box`}
            hero
          />
          <ResultCard
            label="Total screws needed"
            value={results.total.toLocaleString()}
            sub="includes 10% overage"
          />
          <ResultCard
            label="Screws per sheet"
            value={results.perSheet}
            sub="avg per sheet"
          />
          <ResultCard
            label="Screw length"
            value={screwLength}
            sub="coarse thread"
          />
        </div>

        <InfoBox>
          For {appLabel[application]} at {spacing}" OC with {sheetSize === 32 ? '4×8' : sheetSize === 40 ? '4×10' : '4×12'} sheets — {results.perSheet} screws per sheet including edges. ASTM C840-23 compliant. 10% overage already included.
        </InfoBox>
      </div>
    </div>
  )
}

