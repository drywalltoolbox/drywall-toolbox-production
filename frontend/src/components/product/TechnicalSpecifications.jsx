/**
 * TechnicalSpecifications.jsx — Redesigned product specification table.
 *
 * Aesthetic: Precision Data Sheet — inspired by engineering spec sheets and
 * industrial tool catalogs. Tight, authoritative, zero visual noise.
 *
 * Props (unchanged from previous version — drop-in replacement)
 * ─────
 *   specs        Array<{ label: string, value?: string, items?: { name, sku? }[] }>
 *   title        string — section heading (default: 'Specifications')
 *   onItemClick  () => void — called when an includes link is clicked
 */

import { Link } from 'react-router-dom';

// Specs whose values should render in monospace (part numbers, codes)
const MONO_LABELS = new Set(['sku', 'upc', 'mpn', 'part number', 'model', 'model number', 'item number']);

// Specs whose entire row gets the identity treatment (pinned top, visually distinct)
const IDENTITY_LABELS = new Set(['brand', 'sku', 'upc', 'mpn', 'part number']);

function isIncludesLabel(label) {
  return /^(set\s+)?includes?$/i.test((label || '').trim());
}

function classifyRow(label) {
  const key = (label || '').toLowerCase().trim();
  return {
    isMono:     MONO_LABELS.has(key),
    isIdentity: IDENTITY_LABELS.has(key),
    isIncludes: isIncludesLabel(label),
  };
}

export default function TechnicalSpecifications({ specs = [], title = 'Specifications', onItemClick }) {
  if (!specs || specs.length === 0) return null;

  // Split: standard rows vs includes row (rendered separately at bottom)
  const standardRows = specs.filter(s => !isIncludesLabel(s.label));
  const includesSpec = specs.find(s => isIncludesLabel(s.label));

  return (
    <section className="ts-root" aria-label={title}>

      {/* ── Section header ──────────────────────────────────────────────── */}
      <header className="ts-header">
        <span className="ts-header__rule" aria-hidden="true" />
        <h3 className="ts-header__title">{title}</h3>
        <span className="ts-header__count" aria-label={`${specs.length} specifications`}>
          {specs.length}
        </span>
      </header>

      {/* ── Main spec grid ──────────────────────────────────────────────── */}
      {standardRows.length > 0 && (
        <div className="ts-table" role="table" aria-label="Product specifications">
          {standardRows.map((spec, i) => {
            const { isMono, isIdentity } = classifyRow(spec.label);
            return (
              <div
                key={i}
                className={`ts-row${isIdentity ? ' ts-row--identity' : ''}`}
                role="row"
              >
                <span className="ts-row__label" role="rowheader">
                  {spec.label}
                </span>
                <span className="ts-row__value" role="cell">
                  {isMono ? (
                    <code className="ts-row__code">{spec.value}</code>
                  ) : typeof spec.value === 'string' && spec.value.includes('<') ? (
                    <span dangerouslySetInnerHTML={{ __html: spec.value }} />
                  ) : (
                    <span>{spec.value}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Includes section ────────────────────────────────────────────── */}
      {includesSpec && Array.isArray(includesSpec.items) && includesSpec.items.length > 0 && (
        <div className="ts-includes">
          <div className="ts-includes__header">
            <span className="ts-includes__label">{includesSpec.label}</span>
            <span className="ts-includes__count">{includesSpec.items.length} items</span>
          </div>
          <ul className="ts-includes__grid" role="list">
            {includesSpec.items.map((item, i) => (
              <li key={i} className="ts-includes__item">
                {item.sku ? (
                  <Link
                    to={`/product/${item.sku}`}
                    onClick={onItemClick}
                    className="ts-includes__chip ts-includes__chip--link"
                    title={`View ${item.name}`}
                  >
                    <span className="ts-includes__chip-name">{item.name}</span>
                    <span className="ts-includes__chip-sku">{item.sku}</span>
                    <svg className="ts-includes__chip-arrow" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <span className="ts-includes__chip">
                    <span className="ts-includes__chip-name">{item.name}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback: includes spec with plain string value and no items array */}
      {includesSpec && (!includesSpec.items || includesSpec.items.length === 0) && includesSpec.value && (
        <div className="ts-includes">
          <div className="ts-includes__header">
            <span className="ts-includes__label">{includesSpec.label}</span>
          </div>
          <p className="ts-includes__plain">{includesSpec.value}</p>
        </div>
      )}

    </section>
  );
}