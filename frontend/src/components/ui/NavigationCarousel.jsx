/**
 * ui/NavigationCarousel.jsx — Hero section 3D cylindrical navigation carousel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Settings,
  Layers,
  Calculator,
  Briefcase,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_CARDS = [
  { id: 'products', label: 'Products', icon: ShoppingBag, to: '/all-products', desc: 'Browse all tools & equipment' },
  { id: 'parts', label: 'Parts', icon: Settings, to: '/parts', desc: 'OEM replacement parts' },
  { id: 'schematics', label: 'Schematics', icon: Layers, to: '/schematics', desc: 'Tool diagrams & parts lists' },
  { id: 'calculator', label: 'Calculator', icon: Calculator, to: '/calculators', desc: 'Estimate your materials' },
  { id: 'toolsets', label: 'Tool Sets', icon: Briefcase, to: '/toolset-builder', desc: 'Build your perfect kit' },
  { id: 'repairs', label: 'Repairs', icon: Wrench, to: '/repairs', desc: 'Professional repair shop' },
];

const TOTAL = NAV_CARDS.length;
const ANGLE_STEP = 360 / TOTAL;
const AUTO_SLIDE_MS = 4600;
const LERP_ROT = 0.2;
const ROT_PER_PX = 0.22;
const SWIPE_THRESHOLD = 32;
const DRAG_TAP_LIMIT = 8;
const OPACITY_FADE_FACTOR = 0.78;

function getSizing(w) {
  const viewportW = Math.max(320, w || 390);
  const cardW = Math.round(Math.max(136, Math.min(176, viewportW * 0.44)));
  const cardH = Math.round(cardW * 1.04);
  const radius = Math.round(Math.max(cardW * 0.7, Math.min(viewportW * 0.34, cardW * 0.82)));
  const persp = Math.round(radius * 7.5);
  return { cardW, cardH, radius, persp };
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
        zIndex: 20,
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

function NavCard({ card, cardAngle, radius, cardW, cardH, isActive, onTap }) {
  const [hov, setHov] = useState(false);
  const Icon = card.icon;
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
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        width: `${cardW}px`,
        height: `${cardH}px`,
        left: `-${cardW / 2}px`,
        top: `-${cardH / 2}px`,
        transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        padding: '14px',
        borderRadius: '18px',
        border: `1px solid ${hov && isActive ? 'rgba(99,149,255,0.50)' : isActive ? 'rgba(99,149,255,0.30)' : 'rgba(99,149,255,0.10)'}`,
        background: hov && isActive ? 'rgba(255,255,255,0.11)' : isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
        cursor: isActive ? 'pointer' : 'default',
        transition: 'background 0.22s, border-color 0.22s, box-shadow 0.22s',
        boxShadow: isActive ? '0 0 20px rgba(37,99,235,0.14)' : 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '10px',
        outline: 'none',
        willChange: 'transform, opacity',
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: hov && isActive ? 'rgba(37,99,235,0.32)' : 'rgba(37,99,235,0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.18s',
        flexShrink: 0,
      }}>
        <Icon size={21} color="#60a5fa" strokeWidth={1.9} />
      </div>

      <div style={{ minWidth: 0, width: '100%' }}>
        <div style={{
          fontSize: 'clamp(1rem, 4vw, 1.18rem)',
          fontWeight: 800,
          color: hov ? '#ffffff' : '#f0f6ff',
          lineHeight: 1.08,
          marginBottom: '5px',
          transition: 'color 0.15s',
          whiteSpace: 'nowrap',
        }}>
          {card.label}
        </div>
        <div style={{
          fontSize: 'clamp(0.76rem, 3vw, 0.88rem)',
          color: 'rgba(163,192,255,0.58)',
          lineHeight: 1.2,
        }}>
          {card.desc}
        </div>
      </div>
    </div>
  );
}

export default function NavigationCarousel() {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const activeIdxRef = useRef(0);
  const targetRotRef = useRef(0);
  const currentRotRef = useRef(0);
  const pausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragBaseRotRef = useRef(0);
  const pressStartRef = useRef({ x: 0, y: 0 });
  const lastAutoRef = useRef(null);
  const wheelRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef(null);

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
  const { cardW, cardH, radius, persp } = getSizing(containerW);
  const sidePad = isMobile ? 44 : 52;

  const setCenteredIndex = useCallback((rawIdx) => {
    const newIdx = ((Math.round(rawIdx) % TOTAL) + TOTAL) % TOTAL;
    activeIdxRef.current = newIdx;
    setActiveIdx(newIdx);
    targetRotRef.current = -newIdx * ANGLE_STEP;
    lastAutoRef.current = Date.now();
  }, []);

  const goNext = useCallback(() => setCenteredIndex(activeIdxRef.current + 1), [setCenteredIndex]);
  const goPrev = useCallback(() => setCenteredIndex(activeIdxRef.current - 1), [setCenteredIndex]);

  useEffect(() => {
    lastAutoRef.current = Date.now();
    const animate = () => {
      if (!pausedRef.current && !isDraggingRef.current && Date.now() - lastAutoRef.current >= AUTO_SLIDE_MS) goNext();

      const rotDiff = targetRotRef.current - currentRotRef.current;
      currentRotRef.current += Math.abs(rotDiff) > 0.02 ? rotDiff * LERP_ROT : rotDiff;

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotateY(${currentRotRef.current.toFixed(3)}deg)`;
        const children = wheelRef.current.children;
        for (let i = 0; i < children.length; i += 1) {
          const eff = ((i * ANGLE_STEP + currentRotRef.current) % 360 + 360) % 360;
          const dist = eff > 180 ? 360 - eff : eff;
          const op = dist >= 82 ? 0 : 1 - (dist / 82) * OPACITY_FADE_FACTOR;
          children[i].style.opacity = op.toFixed(3);
          children[i].style.pointerEvents = dist < 12 ? 'auto' : 'none';
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [goNext]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDraggingRef.current = true;
      pausedRef.current = true;
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      dragBaseRotRef.current = targetRotRef.current;
      pressStartRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      targetRotRef.current = dragBaseRotRef.current + Math.max(-ANGLE_STEP * 0.62, Math.min(ANGLE_STEP * 0.62, dx * ROT_PER_PX));
    };
    const onMouseUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      pausedRef.current = false;
      setIsDragging(false);
      const dx = e.clientX - dragStartXRef.current;
      if (dx < -SWIPE_THRESHOLD) goNext();
      else if (dx > SWIPE_THRESHOLD) goPrev();
      else setCenteredIndex(activeIdxRef.current);
    };

    scene.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      scene.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [goNext, goPrev, setCenteredIndex]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onTouchStart = (e) => {
      isDraggingRef.current = true;
      pausedRef.current = true;
      setIsDragging(true);
      dragStartXRef.current = e.touches[0].clientX;
      dragBaseRotRef.current = targetRotRef.current;
      pressStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastAutoRef.current = Date.now();
    };
    const onTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.touches[0].clientX - dragStartXRef.current;
      const dy = e.touches[0].clientY - pressStartRef.current.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        targetRotRef.current = dragBaseRotRef.current + Math.max(-ANGLE_STEP * 0.62, Math.min(ANGLE_STEP * 0.62, dx * ROT_PER_PX));
      }
    };
    const onTouchEnd = (e) => {
      isDraggingRef.current = false;
      pausedRef.current = false;
      setIsDragging(false);
      const dx = e.changedTouches[0].clientX - dragStartXRef.current;
      if (dx < -SWIPE_THRESHOLD) goNext();
      else if (dx > SWIPE_THRESHOLD) goPrev();
      else setCenteredIndex(activeIdxRef.current);
    };

    scene.addEventListener('touchstart', onTouchStart, { passive: true });
    scene.addEventListener('touchmove', onTouchMove, { passive: false });
    scene.addEventListener('touchend', onTouchEnd);
    return () => {
      scene.removeEventListener('touchstart', onTouchStart);
      scene.removeEventListener('touchmove', onTouchMove);
      scene.removeEventListener('touchend', onTouchEnd);
    };
  }, [goNext, goPrev, setCenteredIndex]);

  const onEnter = useCallback(() => { pausedRef.current = true; }, []);
  const onLeave = useCallback(() => { pausedRef.current = false; }, []);

  return (
    <div style={{ width: '100%', position: 'relative', padding: '4px 0 24px', overflow: 'hidden' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: `0 ${sidePad}px`, position: 'relative', overflow: 'hidden' }}>
        <ArrowBtn direction="left" onClick={goPrev} isMobile={isMobile} />
        <div
          ref={sceneRef}
          style={{
            width: '100%',
            height: `${cardH + 24}px`,
            perspective: `${persp}px`,
            perspectiveOrigin: '50% 50%',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'pan-y',
            overflow: 'hidden',
            contain: 'layout paint',
          }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          <div
            ref={wheelRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${cardW}px`,
              height: `${cardH}px`,
              marginLeft: `-${cardW / 2}px`,
              marginTop: `-${cardH / 2}px`,
              transformStyle: 'preserve-3d',
              transform: 'rotateY(0deg)',
            }}
          >
            {NAV_CARDS.map((card, i) => (
              <NavCard
                key={card.id}
                card={card}
                cardAngle={i * ANGLE_STEP}
                radius={radius}
                cardW={cardW}
                cardH={cardH}
                isActive={i === activeIdx}
                onTap={(to) => navigate(to)}
              />
            ))}
          </div>
        </div>
        <ArrowBtn direction="right" onClick={goNext} isMobile={isMobile} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '10px' }}>
        {NAV_CARDS.map((card, i) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setCenteredIndex(i)}
            aria-label={`Go to ${card.label}`}
            style={{
              width: i === activeIdx ? '26px' : '7px',
              height: '7px',
              borderRadius: '999px',
              border: 'none',
              background: i === activeIdx ? 'rgba(96,165,250,0.85)' : 'rgba(148,163,184,0.22)',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.28s ease, background 0.28s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
