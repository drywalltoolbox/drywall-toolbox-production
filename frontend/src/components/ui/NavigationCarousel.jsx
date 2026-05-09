/**
 * ui/NavigationCarousel.jsx — Fixed-center 3D navigation carousel
 *
 * The carousel uses deterministic 3D card slots instead of rotating the entire
 * wheel/container. This keeps the active card locked to the viewport center
 * while preserving a 3D angled-card effect for neighboring cards.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_CARDS = [
  { id: 'products', label: 'Products', to: '/all-products' },
  { id: 'parts', label: 'Parts', to: '/parts' },
  { id: 'schematics', label: 'Schematics', to: '/schematics' },
  { id: 'calculator', label: 'Calculator', to: '/calculators' },
  { id: 'toolsets', label: 'Tool Sets', to: '/toolset-builder' },
  { id: 'repairs', label: 'Repairs', to: '/repairs' },
];

const TOTAL = NAV_CARDS.length;
const AUTO_SLIDE_MS = 10000;
const SWIPE_THRESHOLD = 34;
const DRAG_TAP_LIMIT = 8;
const DRAG_RESISTANCE = 0.28;

function wrapIndex(index) {
  return ((index % TOTAL) + TOTAL) % TOTAL;
}

function shortestOffset(index, activeIndex) {
  let offset = index - activeIndex;
  if (offset > TOTAL / 2) offset -= TOTAL;
  if (offset < -TOTAL / 2) offset += TOTAL;
  return offset;
}

function getSizing(w) {
  const viewportW = Math.max(320, w || 390);
  const cardW = Math.round(Math.max(154, Math.min(190, viewportW * 0.46)));
  const cardH = Math.round(cardW * 0.76);
  const sideOffset = Math.round(Math.max(cardW * 0.74, Math.min(viewportW * 0.31, cardW * 0.9)));
  const depth = Math.round(cardW * 0.4);
  const persp = Math.round(Math.max(760, viewportW * 2.3));
  return { cardW, cardH, sideOffset, depth, persp };
}

function ArrowBtn({ direction, onClick, isMobile }) {
  const [hov, setHov] = useState(false);
  const sz = isMobile ? 30 : 40;
  const icSz = isMobile ? 14 : 18;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute',
        [direction === 'left' ? 'left' : 'right']: isMobile ? '10px' : 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        width: `${sz}px`,
        height: `${sz}px`,
        borderRadius: '50%',
        border: `1px solid ${hov ? 'rgba(99,149,255,0.40)' : 'rgba(99,149,255,0.22)'}`,
        background: hov ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)',
        color: hov ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.18s, color 0.18s, border-color 0.18s',
        backdropFilter: 'blur(8px)',
        padding: 0,
      }}
    >
      {direction === 'left' ? <ChevronLeft size={icSz} /> : <ChevronRight size={icSz} />}
    </button>
  );
}

function getSlotTransform(offset, dragOffset, sideOffset, depth) {
  const virtual = offset + dragOffset;
  const abs = Math.abs(virtual);
  const clamped = Math.max(-2, Math.min(2, virtual));
  const x = clamped * sideOffset;
  const z = -Math.min(abs, 2) * depth;
  const rotateY = Math.max(-46, Math.min(46, -clamped * 34));
  const scale = Math.max(0.72, 1 - Math.min(abs, 2) * 0.14);

  return {
    transform: `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
    opacity: abs > 2.15 ? 0 : abs > 1.65 ? 0.32 : abs > 0.65 ? 0.58 : 1,
    zIndex: Math.round(100 - abs * 20),
    pointerEvents: abs < 0.42 ? 'auto' : 'none',
  };
}

function NavCard({ card, cardW, cardH, isActive, slotStyle, onTap }) {
  const [hov, setHov] = useState(false);
  const pressRef = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    pressRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    const dx = Math.abs(e.clientX - pressRef.current.x);
    const dy = Math.abs(e.clientY - pressRef.current.y);
    if (isActive && dx < DRAG_TAP_LIMIT && dy < DRAG_TAP_LIMIT) onTap(card.to);
  };

  return (
    <div
      role="button"
      tabIndex={isActive ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => { if (isActive && (e.key === 'Enter' || e.key === ' ')) onTap(card.to); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={`Navigate to ${card.label}`}
      aria-hidden={!isActive}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        boxSizing: 'border-box',
        width: `${cardW}px`,
        height: `${cardH}px`,
        transform: slotStyle.transform,
        opacity: slotStyle.opacity,
        zIndex: slotStyle.zIndex,
        pointerEvents: slotStyle.pointerEvents,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        padding: '16px',
        borderRadius: '18px',
        border: `1px solid ${hov && isActive ? 'rgba(99,149,255,0.64)' : isActive ? 'rgba(99,149,255,0.42)' : 'rgba(99,149,255,0.20)'}`,
        background: isActive
          ? 'linear-gradient(180deg, rgba(24,35,58,0.98) 0%, rgba(18,28,48,0.98) 100%)'
          : 'linear-gradient(180deg, rgba(16,24,42,0.94) 0%, rgba(11,20,36,0.94) 100%)',
        cursor: isActive ? 'pointer' : 'default',
        transition: 'transform 440ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        boxShadow: isActive ? '0 0 26px rgba(37,99,235,0.22)' : '0 0 18px rgba(2,6,23,0.18)',
        userSelect: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        outline: 'none',
        overflow: 'hidden',
        willChange: 'transform, opacity',
      }}
    >
      <div style={{
        fontSize: 'clamp(1.18rem, 4.9vw, 1.42rem)',
        fontWeight: 800,
        color: hov ? '#ffffff' : '#f8fbff',
        lineHeight: 1.06,
        transition: 'color 0.15s',
        whiteSpace: 'normal',
      }}>
        {card.label}
      </div>
    </div>
  );
}

export default function NavigationCarousel() {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const activeIdxRef = useRef(0);
  const pausedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastAutoRef = useRef(0);
  const sceneRef = useRef(null);

  useEffect(() => {
    lastAutoRef.current = Date.now();
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = containerW > 0 && containerW <= 680;
  const { cardW, cardH, sideOffset, depth, persp } = getSizing(containerW);
  const sidePad = isMobile ? 40 : 52;

  const setCenteredIndex = useCallback((rawIdx) => {
    const newIdx = wrapIndex(rawIdx);
    activeIdxRef.current = newIdx;
    setActiveIdx(newIdx);
    setDragOffset(0);
    lastAutoRef.current = Date.now();
  }, []);

  const goNext = useCallback(() => setCenteredIndex(activeIdxRef.current + 1), [setCenteredIndex]);
  const goPrev = useCallback(() => setCenteredIndex(activeIdxRef.current - 1), [setCenteredIndex]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!pausedRef.current && !isDraggingRef.current && Date.now() - lastAutoRef.current >= AUTO_SLIDE_MS) goNext();
    }, 250);
    return () => window.clearInterval(id);
  }, [goNext]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDraggingRef.current = true;
      pausedRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      scene.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        const nextOffset = Math.max(-0.72, Math.min(0.72, (dx / Math.max(sideOffset, 1)) * DRAG_RESISTANCE));
        setDragOffset(nextOffset);
      }
    };

    const finishDrag = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      pausedRef.current = false;
      setIsDragging(false);
      scene.releasePointerCapture?.(e.pointerId);

      const dx = e.clientX - dragStartRef.current.x;
      setDragOffset(0);
      if (dx < -SWIPE_THRESHOLD) goNext();
      else if (dx > SWIPE_THRESHOLD) goPrev();
      else setCenteredIndex(activeIdxRef.current);
    };

    scene.addEventListener('pointerdown', onPointerDown);
    scene.addEventListener('pointermove', onPointerMove, { passive: false });
    scene.addEventListener('pointerup', finishDrag);
    scene.addEventListener('pointercancel', finishDrag);

    return () => {
      scene.removeEventListener('pointerdown', onPointerDown);
      scene.removeEventListener('pointermove', onPointerMove);
      scene.removeEventListener('pointerup', finishDrag);
      scene.removeEventListener('pointercancel', finishDrag);
    };
  }, [goNext, goPrev, setCenteredIndex, sideOffset]);

  const onEnter = useCallback(() => { pausedRef.current = true; }, []);
  const onLeave = useCallback(() => { pausedRef.current = false; }, []);

  return (
    <div style={{ width: '100%', position: 'relative', padding: '4px 0 28px', overflow: 'hidden' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: `0 ${sidePad}px`, position: 'relative', overflow: 'visible' }}>
        <ArrowBtn direction="left" onClick={goPrev} isMobile={isMobile} />
        <div
          ref={sceneRef}
          style={{
            width: '100%',
            height: `${cardH + 96}px`,
            perspective: `${persp}px`,
            perspectiveOrigin: '50% 50%',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'pan-y',
            overflow: 'visible',
            clipPath: 'inset(-32px 0 -32px 0)',
          }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
            }}
          >
            {NAV_CARDS.map((card, i) => {
              const offset = shortestOffset(i, activeIdx);
              const slotStyle = getSlotTransform(offset, dragOffset, sideOffset, depth);
              return (
                <NavCard
                  key={card.id}
                  card={card}
                  cardW={cardW}
                  cardH={cardH}
                  isActive={i === activeIdx}
                  slotStyle={slotStyle}
                  onTap={(to) => navigate(to)}
                />
              );
            })}
          </div>
        </div>
        <ArrowBtn direction="right" onClick={goNext} isMobile={isMobile} />
      </div>
    </div>
  );
}
