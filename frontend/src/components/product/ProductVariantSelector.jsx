/**
 * frontend/src/components/product/ProductVariantSelector.jsx
 *
 * Chip-based variant option selector. Renders one radiogroup per variation
 * attribute with radio-like option chips. Unavailable options are disabled and
 * visually muted.
 */

import { useMemo } from 'react';
import { findMatchingVariation, getVariationSelectionMap } from '../../utils/variationSelection.js';

function getOptionStatus(optionMeta) {
  const status = optionMeta?.stock_status || 'outofstock';
  const purchasable = optionMeta?.purchasable ?? false;
  if (status === 'outofstock') return status;
  if (!purchasable) return 'unavailable';
  return status;
}

export default function ProductVariantSelector({
  product,
  variations,
  computed,
  selectedVariation,
  onSelect,
}) {
  const isVariable = product?.type === 'variable' || product?.is_variable;

  const variationAttributes = useMemo(() => {
    const attrs = Array.isArray(product?.attributes) ? product.attributes : [];
    return attrs.filter(
      (a) => a?.variation && a?.name && a.name.toLowerCase() !== 'brand'
        && Array.isArray(a.options) && a.options.length > 0
    );
  }, [product]);

  const currentSelections = useMemo(
    () => (selectedVariation ? getVariationSelectionMap(selectedVariation) : {}),
    [selectedVariation]
  );

  const optionMatrix = useMemo(
    () => computed?.available_option_matrix || {},
    [computed]
  );

  if (!isVariable || variationAttributes.length === 0) return null;
  if (!Array.isArray(variations) || variations.length === 0) return null;

  const handleOptionClick = (attrName, option, disabled = false) => {
    if (disabled) return;
    const newSelections = { ...currentSelections, [attrName]: option };
    const match = findMatchingVariation(variations, newSelections);
    onSelect(match ?? null);
  };

  const handleOptionKeyDown = (event, attrName, optionStates, currentIndex) => {
    const key = event.key;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(key)) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % optionStates.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + optionStates.length) % optionStates.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = optionStates.length - 1;
    }

    for (let attempts = 0; attempts < optionStates.length; attempts += 1) {
      const nextOption = optionStates[nextIndex];
      if (nextOption && !nextOption.disabled) {
        handleOptionClick(attrName, nextOption.value);
        return;
      }
      nextIndex = (nextIndex + direction + optionStates.length) % optionStates.length;
    }
  };

  return (
    <div className="product-variant-selector" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {variationAttributes.map((attr) => {
        const attrName      = attr.name;
        const options       = Array.isArray(attr.options) ? attr.options : [];
        const selectedValue = currentSelections[attrName] ?? null;
        const attrMatrix    = optionMatrix[attrName] ?? {};
        const groupLabelId  = `variant-group-${attrName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}`;
        const optionStates = options.map((option) => {
          const meta = attrMatrix[option];
          const status = meta ? getOptionStatus(meta) : 'unavailable';
          const isOos = status === 'outofstock';
          const isUnavail = status === 'unavailable';
          return {
            value: option,
            isOos,
            isUnavail,
            disabled: isUnavail,
          };
        });

        return (
          <div key={attrName} className="product-variant-group">
            <div
              id={groupLabelId}
              style={{
                fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#475569', marginBottom: '10px',
              }}
            >
              {attrName.replace(/^pa_/i, '').replace(/[_-]+/g, ' ')}
              {selectedValue && (
                <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '8px', color: '#0f172a' }}>
                  — {selectedValue}
                </span>
              )}
            </div>

            <div
              role="radiogroup"
              aria-labelledby={groupLabelId}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
            >
              {optionStates.map((optionState, index) => {
                const option      = optionState.value;
                const isSelected  = selectedValue === option;
                const isOos       = optionState.isOos;
                const isUnavail   = optionState.isUnavail;
                const disabled    = optionState.disabled;

                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${option}${isOos ? ', out of stock' : isUnavail ? ', unavailable' : ''}`}
                    aria-disabled={disabled}
                    disabled={disabled}
                    tabIndex={!disabled && (isSelected || (!selectedValue && index === 0)) ? 0 : -1}
                    onClick={() => handleOptionClick(attrName, option, disabled)}
                    onKeyDown={(event) => handleOptionKeyDown(event, attrName, optionStates, index)}
                    title={isOos ? `${option} — Out of Stock` : isUnavail ? `${option} — Unavailable` : option}
                    style={chipStyle(isSelected, isOos, isUnavail)}
                  >
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function chipStyle(isSelected, isOos, isUnavail) {
  return {
    minWidth: '56px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: isSelected
      ? '2px solid var(--primary-600, #2563eb)'
      : '2px solid #e2e8f0',
    background: isSelected
      ? 'rgba(37,99,235,0.08)'
      : isOos || isUnavail ? '#f8fafc' : '#fff',
    color: isSelected
      ? 'var(--primary-700, #1d4ed8)'
      : isOos || isUnavail ? '#94a3b8' : '#0f172a',
    fontSize: '0.82rem',
    fontWeight: isSelected ? 700 : 500,
    cursor: isUnavail ? 'not-allowed' : 'pointer',
    opacity: isOos || isUnavail ? 0.62 : 1,
    textAlign: 'center',
    lineHeight: 1.3,
    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
    position: 'relative',
  };
}
