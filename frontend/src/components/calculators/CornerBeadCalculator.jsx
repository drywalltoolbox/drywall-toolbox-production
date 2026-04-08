import { useState, useMemo, useEffect } from 'react'
import ResultCard from './shared/ResultCard'
import InfoBox from './shared/InfoBox'

export default function CornerBeadCalculator({ onUpdate }) {
  const [corners, setCorners] = useState(4)
  const [height, setHeight] = useState(9)
  const [arches, setArches] = useState(0)
  const [archHeight, setArchHeight] = useState(7)
  const [beadType, setBeadType] = useState('standard')
  const [stockLength, setStockLength] = useState(8)

  const results = useMemo(() => {
    const stdFt = Math.round(corners * height)
    const archFt = Math.round(arches * archHeight * 2)
    const totalFt = stdFt + archFt
    const sections = Math.ceil(totalFt / stockLength)
    return { stdFt, archFt, totalFt, sections }
  }, [corners, height, arches, archHeight, stockLength])

  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        sections: results.sections,
        beadType,
        stockLength,
        totalFeet: results.totalFt,
        standardFeet: results.stdFt,
        archFeet: results.archFt
      })
    }
  }, [results, beadType, stockLength, onUpdate])

  const beadTypes = [
    { value: 'standard', label: 'Standard metal corner bead' },
    { value: 'bullnose', label: 'Bullnose corner bead' },
    { value: 'vinyl', label: 'Vinyl corner bead' },
    { value: 'flex', label: 'Flexible / arch bead' },
  ]

  const stockLengths = [
    { value: 8, label: '8 ft sections' },
    { value: 10, label: '10 ft sections' },
    { value: 12, label: '12 ft sections' },
  ]

  const tips = {
    standard: 'Standard metal bead is the most durable option. Fasten every 6–9" alternating sides.',
    bullnose: 'Bullnose gives a rounded profile — popular in modern and contemporary builds.',
    vinyl: 'Vinyl bead resists rust in wet areas. Use vinyl-specific compound for best adhesion.',
    flex: 'Flexible bead bends to any radius. Score lightly before bending to prevent kinking.'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Outside Corners
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Number of outside corners
            </label>
            <input
              type="number"
              value={corners}
              min={0}
              onChange={e => setCorners(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Standard 90° outside corners
            </span>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Wall/ceiling height (ft)
            </label>
            <input
              type="number"
              value={height}
              min={1}
              step={0.5}
              onChange={e => setHeight(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Archways / curved corners
          </label>
          <input
            type="number"
            value={arches}
            min={0}
            onChange={e => setArches(+e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            Uses flexible arch bead
          </span>
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Arch height (ft)
          </label>
          <input
            type="number"
            value={archHeight}
            min={1}
            step={0.5}
            onChange={e => setArchHeight(+e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Bead Type & Stock Length
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Corner bead type
            </label>
            <select
              value={beadType}
              onChange={e => setBeadType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {beadTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Stock bead length (ft)
            </label>
            <select
              value={stockLength}
              onChange={e => setStockLength(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {stockLengths.map(length => (
                <option key={length.value} value={length.value}>
                  {length.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <ResultCard
            label="Bead sections to buy"
            value={results.sections}
            sub={`${stockLength} ft sections`}
            hero
          />
          <ResultCard
            label="Total linear ft"
            value={results.totalFt}
            sub="corner bead needed"
          />
          <ResultCard
            label="Standard corners"
            value={results.stdFt}
            sub="ft of straight bead"
          />
          <ResultCard
            label="Arch bead"
            value={results.archFt}
            sub="ft of flex bead"
          />
        </div>

        <InfoBox>
          {tips[beadType]}
        </InfoBox>
      </div>
    </div>
  )
}
