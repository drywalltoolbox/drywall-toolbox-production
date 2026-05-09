import React, { useLayoutEffect, useRef, useState } from 'react';

export default function ShippingTicker({ items = [], duration = 22, className = '', ariaLabel = 'Promotions' }) {
  const trackRef = useRef(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const sets = track.querySelectorAll('.dtb-ticker-set');
    if (!sets || sets.length < 2) return;

    const prevTransform = track.style.transform;
    track.style.transform = '';

    const first = sets[0];
    const second = sets[1];
    const measured = Math.max(1, Math.ceil(second.offsetLeft - first.offsetLeft) + 1);

    track.style.setProperty('--dtb-ticker-translate', '-' + measured + 'px');
    track.style.setProperty('--dtb-ticker-duration', duration + 's');
    track.style.transform = prevTransform;

    window.requestAnimationFrame(() => {
      setReady(true);
    });

    const updateMeasurements = () => {
      track.style.transform = '';
      const sets2 = track.querySelectorAll('.dtb-ticker-set');
      if (!sets2 || sets2.length < 2) return;
      const m = Math.max(1, Math.ceil(sets2[1].offsetLeft - sets2[0].offsetLeft) + 1);
      track.style.setProperty('--dtb-ticker-translate', '-' + m + 'px');
      track.style.setProperty('--dtb-ticker-duration', duration + 's');
    };

    window.addEventListener('resize', updateMeasurements);
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMeasurements);
      resizeObserver.observe(track);
    }

    return () => {
      window.removeEventListener('resize', updateMeasurements);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [items, duration]);

  const renderSet = (key) => (
    <div key={key} className="dtb-ticker-set">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="dtb-ticker-sep" aria-hidden="true">{'\u25C6'}</span>
          )}
          <span className="dtb-ticker-item">
            {item.icon ? <span className="dtb-ticker-icon">{item.icon}</span> : null}
            {item.text}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  // Desktop usage passes className="dtb-desktop-shipping-bar".
  // In that case we must NOT include the mobile class, otherwise the desktop
  // media query that hides .dtb-mobile-shipping-bar will hide the live ticker.
  const wrapperClass = className && className.length > 0
    ? (className.includes('dtb-desktop-shipping-bar')
      ? className
      : `dtb-mobile-shipping-bar ${className}`)
    : 'dtb-mobile-shipping-bar';

  return (
    <div className={wrapperClass} aria-label={ariaLabel}>
      <div ref={trackRef} className={ 'dtb-ticker-track ' + (ready ? 'dtb-ticker--ready' : '') } aria-hidden="true">
        {renderSet(0)}
        {renderSet(1)}
      </div>
    </div>
  );
}
