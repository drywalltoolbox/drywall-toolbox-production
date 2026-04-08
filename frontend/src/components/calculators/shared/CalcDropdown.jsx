import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import '../../../styles/sort-dropdown.css'

/**
 * CalcDropdown — matches the exact look / feel / animation of SortDropdown
 * (sort-dropdown.css) but is full-width and dark-mode aware for use inside
 * the Calculator Hub panels.
 *
 * Props:
 *   value      — currently selected option value
 *   onChange   — (value) => void
 *   options    — [{ value, label, description? }]
 *   id         — optional id for the trigger button (for label association)
 *   placeholder — text shown when nothing is selected
 */
export default function CalcDropdown({ value, onChange, options = [], id, placeholder = 'Select…' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef   = useRef(null)
  const buttonRef = useRef(null)

  const current = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function onDown(e) {
      if (
        menuRef.current   && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const handleSelect = (v) => {
    onChange(v)
    setIsOpen(false)
  }

  return (
    <div className="calc-dropdown-wrapper">
      {/* Trigger button */}
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="calc-dropdown-button"
      >
        <span className="calc-button-label">
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`calc-chevron${isOpen ? ' open' : ''}`}
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div ref={menuRef} className="calc-dropdown-menu" role="listbox">
          {options.map(opt => {
            const selected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(opt.value)}
                className={`calc-dropdown-item${selected ? ' selected' : ''}`}
              >
                <div className="calc-item-text">
                  <span className="calc-item-label">{opt.label}</span>
                  {opt.description && (
                    <span className="calc-item-description">{opt.description}</span>
                  )}
                </div>
                {selected && (
                  <span className="calc-item-checkmark">
                    <Check size={16} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
