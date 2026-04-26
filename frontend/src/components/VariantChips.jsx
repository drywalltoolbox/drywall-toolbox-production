import { useState, useEffect, useRef } from 'react';
import '../styles/sort-dropdown.css';

/**
* VariantChips — dropdown-driven variation selector for product cards.
*
* Renders a styled dropdown list for each variation attribute such as "Size"
* or "Length". Uses no colour swatches; all labels are contractor-friendly text
* (e.g. 7", 10", 12").
 *
 * Props
 * ─────
 *   attributes  Array<{ name: string, options: string[] }>
 *               The variation attributes from the parent variable product.
 *
 *   selected    Object — current selection map, e.g. { Size: '10"' }
 *
 *   onSelect    (name: string, value: string) => void
 *               Called whenever the user picks a new option.
 *
 *   compact     boolean — when true, reduces padding (for use inside product cards)
 */
export default function VariantChips({ attributes, selected, onSelect, compact = false }) {
  const [openAttribute, setOpenAttribute] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpenAttribute(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!attributes || attributes.length === 0) return null;

  const normalizeOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options.flatMap((value) => {
        if (typeof value !== 'string') return [];
        return value.split('|').map((item) => item.trim()).filter(Boolean);
      });
    }
    if (typeof options === 'string') {
      return options.split('|').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div ref={rootRef} className="variant-chips-root" style={{ display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '8px' }}>
      {attributes.map((attr) => {
        const name = (attr.name || '').trim();
        if (!name || name.toLowerCase() === 'brand') return null;
        const options = normalizeOptions(attr.options);
        if (!options || options.length === 0) return null;
        const currentValue = selected?.[name] ?? '';
        const isOpen = openAttribute === name;

        return (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!compact && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'rgba(15,23,42,0.45)',
              }}>
                {name}
              </span>
            )}

            <div className="sort-dropdown-wrapper variant-dropdown-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
              <button
                type="button"
                className="sort-dropdown-button"
                aria-label={`Select ${name}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAttribute((prev) => (prev === name ? null : name));
                }}
              >
                <span className="sort-button-label">
                  {currentValue || `Select ${name}`}
                </span>
                <span className={`sort-chevron ${isOpen ? 'open' : ''}`} />
              </button>

              {isOpen && (
                <div className="sort-dropdown-menu" role="listbox">
                  {options.map((opt) => {
                    const isSelected = currentValue === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`sort-dropdown-item ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(name, opt);
                          setOpenAttribute(null);
                        }}
                      >
                        <div className="sort-item-content">
                          <div className="sort-item-text">
                            <div className="sort-item-label">{opt}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="sort-item-checkmark">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
