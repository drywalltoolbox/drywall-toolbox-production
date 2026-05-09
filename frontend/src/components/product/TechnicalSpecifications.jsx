/**
 * TechnicalSpecifications.jsx
 *
 * Mobile-first technical specification table for drywall tools and product kits.
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

const PRIORITY_LABELS = new Set([
  'brand',
  'sku',
  'part number',
  'model',
  'model number',
  'size',
  'width',
  'length',
  'material',
  'finish',
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

function getPrimaryRows(rows) {
  const priorityRows = rows.filter((row) => PRIORITY_LABELS.has(normalizeLabel(row.label)));
  return priorityRows.slice(0, 4);
}

function SkeletonBlock({ className = '' }) {
  return <span className={`ts-skeleton ${className}`.trim()} aria-hidden="true" />;
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

function IncludesPanel({ spec, onItemClick }) {
  const items = Array.isArray(spec.items) && spec.items.length > 0
    ? spec.items
    : [{ name: spec.value }].filter((item) => item.name);

  if (items.length === 0) return null;

  return (
    <section className="ts-includes" aria-label={spec.label || 'Included items'}>
      <div className="ts-includes__header">
        <div>
          <span className="ts-section-kicker">Included kit</span>
          <h4 className="ts-includes__title">{spec.label || 'Includes'}</h4>
        </div>
        <span className="ts-includes__count">{items.length}</span>
      </div>

      <ul className="ts-includes__grid" role="list">
        {items.map((item, index) => (
          <li key={`${item.name}-${item.sku || index}`} className="ts-includes__item">
            {item.sku ? (
              <Link
                to={`/product/${item.sku}`}
                onClick={onItemClick}
                className="ts-includes__chip ts-includes__chip--link"
                title={`View ${item.name}`}
              >
            <span className="ts-includes__status" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="ts-includes__copy">
                  <span className="ts-includes__name">{item.name}</span>
                  <span className="ts-includes__sku">{item.sku}</span>
                </span>
                <span className="ts-includes__arrow" aria-hidden="true">View</span>
              </Link>
            ) : (
              <span className="ts-includes__chip">
                <span className="ts-includes__status" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="ts-includes__copy">
                  <span className="ts-includes__name">{item.name}</span>
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
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
        <header className="ts-hero">
          <div className="ts-hero__copy">
            <span className="ts-hero__eyebrow">Product data</span>
            <h3 className="ts-hero__title">{title}</h3>
            <p className="ts-empty__copy">
              Structured specifications for this product are being added.
            </p>
          </div>

          <div className="ts-hero__metrics" aria-label="Specification summary">
            <span className="ts-metric">
              <span className="ts-metric__value">0</span>
              <span className="ts-metric__label">Specs</span>
            </span>
          </div>
        </header>

        <div className="ts-snapshot ts-snapshot--placeholder" aria-label="Specification placeholders">
          {['Brand', 'SKU', 'Material', 'Application'].map((label) => (
            <article key={label} className="ts-snapshot__item ts-snapshot__item--placeholder">
              <span className="ts-snapshot__label">{label}</span>
              <SkeletonBlock className="ts-skeleton--value" />
            </article>
          ))}
        </div>

        <div className="ts-table" role="table" aria-label="Product specifications placeholder">
          {['Product Type', 'Compatibility', 'Adjustment', 'Category'].map((label) => (
            <div key={label} className="ts-row" role="row">
              <span className="ts-row__label" role="rowheader">{label}</span>
              <span className="ts-row__value" role="cell">
                <SkeletonBlock className="ts-skeleton--row" />
              </span>
            </div>
          ))}
        </div>

        <footer className="ts-footer ts-footer--pending" aria-label="Specification status">
          <span>Technical data pending</span>
        </footer>
      </section>
    );
  }

  const standardRows = visibleSpecs.filter((spec) => !isIncludesLabel(spec.label));
  const includesSpec = visibleSpecs.find((spec) => isIncludesLabel(spec.label));
  const primaryRows = getPrimaryRows(standardRows);
  const primaryKeys = new Set(primaryRows.map((row) => normalizeLabel(row.label)));
  const detailRows = standardRows.filter((row) => !primaryKeys.has(normalizeLabel(row.label)));

  return (
    <section className="ts-root" aria-label={title}>
      <header className="ts-hero">
        <div className="ts-hero__copy">
          <span className="ts-hero__eyebrow">Product data</span>
          <h3 className="ts-hero__title">{title}</h3>
        </div>

        <div className="ts-hero__metrics" aria-label="Specification summary">
          <span className="ts-metric">
            <span className="ts-metric__value">{standardRows.length}</span>
            <span className="ts-metric__label">Specs</span>
          </span>
          {includesSpec?.items?.length ? (
            <span className="ts-metric">
              <span className="ts-metric__value">{includesSpec.items.length}</span>
              <span className="ts-metric__label">Included</span>
            </span>
          ) : null}
        </div>
      </header>

      {primaryRows.length > 0 && (
        <div className="ts-snapshot" aria-label="Primary specifications">
          {primaryRows.map((spec) => {
            const isMono = MONO_LABELS.has(normalizeLabel(spec.label));

            return (
              <article key={spec.label} className="ts-snapshot__item">
                <span className="ts-snapshot__label">{spec.label}</span>
                <span className="ts-snapshot__value">{renderSpecValue(spec.value, isMono)}</span>
              </article>
            );
          })}
        </div>
      )}

      {detailRows.length > 0 && (
        <div className="ts-table" role="table" aria-label="Product specifications">
          {detailRows.map((spec) => {
            const isMono = MONO_LABELS.has(normalizeLabel(spec.label));

            return (
              <div key={spec.label} className="ts-row" role="row">
                <span className="ts-row__label" role="rowheader">
                  <span>{spec.label}</span>
                </span>
                <span className="ts-row__value" role="cell">
                  {renderSpecValue(spec.value, isMono)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {includesSpec && <IncludesPanel spec={includesSpec} onItemClick={onItemClick} />}

      <footer className="ts-footer" aria-label="Specification status">
        <span>Structured product specifications</span>
      </footer>
    </section>
  );
}
