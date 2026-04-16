/**
 * TechnicalSpecifications.jsx — Product technical specifications table renderer
 *
 * Clean, modern card-based spec table with:
 *  - Frosted/subtle card container with border
 *  - Alternating row shading for scannability
 *  - Sticky label column on desktop; stacked on mobile
 *  - Pill badges for short single values (SKU, Brand)
 *  - Linked includes list with arrow icon
 *  - Smooth hover states
 */

import { Link } from 'react-router-dom';

// Icons for specific spec labels
const SPEC_ICONS = {
  'sku':        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  'brand':      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
  'category':   'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  'includes':   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  'default':    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

function getIcon(label) {
  const key = label?.toLowerCase() ?? '';
  return SPEC_ICONS[key] ?? SPEC_ICONS['default'];
}

// Short single values rendered as pill badges
const SHORT_VALUE_LABELS = new Set(['sku', 'brand', 'model', 'upc', 'mpn', 'part number']);

export default function TechnicalSpecifications({ specs = [], title = 'Technical Specifications', onItemClick }) {
  if (!specs || specs.length === 0) return null;

  return (
    <section className="tech-specs" aria-label={title}>

      {/* ── Section heading ── */}
      <div className="tech-specs__header">
        <div className="tech-specs__header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="tech-specs__title">{title}</h3>
          <p className="tech-specs__subtitle">{specs.length} specification{specs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Spec table card ── */}
      <div className="tech-specs__card">
        <dl className="tech-specs__list">
          {specs.map((spec, index) => {
            const labelKey  = spec.label?.toLowerCase() ?? '';
            const isShort   = SHORT_VALUE_LABELS.has(labelKey) && typeof spec.value === 'string' && spec.value.length < 30;
            const isList    = Array.isArray(spec.items) && spec.items.length > 0;
            const iconPath  = getIcon(spec.label);
            const isEven    = index % 2 === 0;

            return (
              <div key={index} className={`tech-specs__row${isList ? ' tech-specs__row--list' : ''}${isEven ? ' tech-specs__row--even' : ''}`}>

                {/* Label */}
                <dt className="tech-specs__label">
                  <span className="tech-specs__label-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d={iconPath} />
                    </svg>
                  </span>
                  <span>{spec.label}</span>
                </dt>

                {/* Value */}
                <dd className="tech-specs__value">
                  {isList ? (
                    <ul className="tech-specs__includes">
                      {spec.items.map((item, i) => (
                        <li key={i} className="tech-specs__include-item">
                          {item.sku ? (
                            <Link
                              to={`/product/${item.sku}`}
                              onClick={onItemClick}
                              className="tech-specs__include-link"
                            >
                              <span className="tech-specs__include-dot" aria-hidden="true" />
                              <span>{item.name}</span>
                              <svg className="tech-specs__include-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </Link>
                          ) : (
                            <span className="tech-specs__include-plain">
                              <span className="tech-specs__include-dot" aria-hidden="true" />
                              <span>{item.name}</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : isShort ? (
                    <span className="tech-specs__badge">{spec.value}</span>
                  ) : typeof spec.value === 'string' && spec.value.includes('<') ? (
                    <span dangerouslySetInnerHTML={{ __html: spec.value }} />
                  ) : (
                    <span className="tech-specs__text">{spec.value}</span>
                  )}
                </dd>

              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

