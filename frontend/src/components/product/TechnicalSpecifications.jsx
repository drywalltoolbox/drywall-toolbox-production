/**
 * TechnicalSpecifications.jsx
 *
 * Unified, table-first technical specification renderer.
 *
 * Props:
 *   specs        Array<{ label: string, value?: string, items?: { name, sku? }[] }>
 *   title        string
 *   onItemClick  () => void
 */

import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';

const MONO_LABELS = new Set([
  'asin',
  'gtin',
  'item number',
  'model',
  'model number',
  'mpn',
  'part number',
  'sku',
  'upc',
]);

function normalizeLabel(label = '') {
  return label.toString().trim().toLowerCase();
}

function isIncludesLabel(label) {
  return /^(set\s+)?includes?$/i.test((label || '').trim());
}

function isHtmlValue(value) {
  return typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);
}

function getRowType(label = '') {
  const normalized = normalizeLabel(label);
  if (MONO_LABELS.has(normalized)) return 'code';
  if (normalized.includes('size') || normalized.includes('width') || normalized.includes('length')) return 'dimension';
  if (normalized.includes('brand')) return 'brand';
  if (normalized.includes('type')) return 'type';
  return 'standard';
}

function renderSpecValue(value, isMono) {
  if (value === null || value === undefined || value === '') {
    return <span className="ts-value__empty">Not listed</span>;
  }

  if (Array.isArray(value)) {
    return (
      <span className="ts-value__list">
        {value.map((item, index) => (
          <span key={`${item}-${index}`} className="ts-value__token">
            {item}
          </span>
        ))}
      </span>
    );
  }

  if (isHtmlValue(value)) {
    return (
      <span
        className="ts-value__html"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
      />
    );
  }

  return isMono ? <code className="ts-value__code">{value}</code> : <span>{value}</span>;
}

function renderIncludesValue(spec, onItemClick) {
  const items = Array.isArray(spec.items) && spec.items.length > 0
    ? spec.items
    : [{ name: spec.value }].filter((item) => item.name);

  if (items.length === 0) return <span className="ts-value__empty">Not listed</span>;

  return (
    <ul className="ts-includes-list" role="list">
      {items.map((item, index) => (
        <li key={`${item.name}-${item.sku || index}`} className="ts-includes-list__item">
          {item.sku ? (
            <Link
              to={`/product/${item.sku}`}
              onClick={onItemClick}
              className="ts-includes-list__link"
              title={`View ${item.name}`}
            >
              <span className="ts-includes-list__name">{item.name}</span>
              <span className="ts-includes-list__sku">SKU: {item.sku}</span>
            </Link>
          ) : (
            <span className="ts-includes-list__plain">{item.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkeletonBlock({ className = '' }) {
  return <span className={`ts-skeleton ${className}`.trim()} aria-hidden="true" />;
}

export default function TechnicalSpecifications({
  specs = [],
  title = 'Technical Specifications',
  onItemClick,
}) {
  const visibleSpecs = specs.filter((spec) => spec?.label);

  if (visibleSpecs.length === 0) {
    return (
      <section className="ts-root" aria-label={title}>
        <div className="ts-table-shell" role="table" aria-label="Product specifications placeholder">
          <div className="ts-table-head" role="row">
            <span role="columnheader">Specification</span>
            <span role="columnheader">Value</span>
          </div>
          {['Brand', 'SKU', 'Size', 'Product Type'].map((label) => (
            <div key={label} className="ts-row" role="row">
              <span className="ts-row__label" role="rowheader">{label}</span>
              <span className="ts-row__value" role="cell"><SkeletonBlock className="ts-skeleton--row" /></span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ts-root" aria-label={title}>
      <div className="ts-table-shell" role="table" aria-label="Product specifications">
        <div className="ts-table-head" role="row">
          <span role="columnheader">Specification</span>
          <span role="columnheader">Value</span>
        </div>
        {visibleSpecs.map((spec, index) => {
          const normalized = normalizeLabel(spec.label);
          const isMono = MONO_LABELS.has(normalized);
          const rowType = isIncludesLabel(spec.label) ? 'includes' : getRowType(spec.label);

          return (
            <div key={`${spec.label}-${index}`} className={`ts-row ts-row--${rowType}`} role="row">
              <span className="ts-row__label" role="rowheader">
                {spec.label}
              </span>
              <span className="ts-row__value" role="cell">
                {isIncludesLabel(spec.label)
                  ? renderIncludesValue(spec, onItemClick)
                  : renderSpecValue(spec.value, isMono)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
