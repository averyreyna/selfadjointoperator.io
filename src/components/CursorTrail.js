import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CursorTrail.module.css';

const SYMBOLS = ['∧', '∨', '⊕', '⊗', '∞', '∴'];
const TRAIL_LENGTH = 18;
/** Pixels between trail samples */
const MIN_TRAIL_DIST = 6;
/** Pixels moved before advancing the cursor symbol in the cycle */
const SYMBOL_STEP_DIST = 12;

const emptyParticles = () =>
  Array.from({ length: TRAIL_LENGTH }, (_, i) => ({
    x: -100,
    y: -100,
    symbol: SYMBOLS[i % SYMBOLS.length],
    opacity: 0,
  }));

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function useFinePointer() {
  const [fine, setFine] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return fine;
}

function buildParticles(trail) {
  return Array.from({ length: TRAIL_LENGTH }, (_, i) => {
    const pt = trail[i] ?? { x: -100, y: -100 };
    const visible = Boolean(trail[i]);
    return {
      x: pt.x,
      y: pt.y,
      symbol: SYMBOLS[i % SYMBOLS.length],
      opacity: visible ? 1 - i / (TRAIL_LENGTH + 2) : 0,
    };
  });
}

export default function CursorTrail() {
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const prevPosRef = useRef(null);
  const movedRef = useRef(0);
  const symbolIndexRef = useRef(0);
  const trailRef = useRef([]);
  const lastTrailSampleRef = useRef(null);
  const [cursor, setCursor] = useState({
    x: -100,
    y: -100,
    symbol: SYMBOLS[0],
    visible: false,
  });
  const [particles, setParticles] = useState(emptyParticles);

  const onMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;

    const prev = prevPosRef.current;
    if (prev == null) {
      prevPosRef.current = { x, y };
      lastTrailSampleRef.current = { x, y };
      setCursor({
        x,
        y,
        symbol: SYMBOLS[symbolIndexRef.current],
        visible: true,
      });
      return;
    }

    const seg = Math.hypot(x - prev.x, y - prev.y);
    prevPosRef.current = { x, y };

    movedRef.current += seg;
    while (movedRef.current >= SYMBOL_STEP_DIST) {
      movedRef.current -= SYMBOL_STEP_DIST;
      symbolIndexRef.current =
        (symbolIndexRef.current + 1) % SYMBOLS.length;
    }

    const trail = trailRef.current;
    const lastSample = lastTrailSampleRef.current;
    const dx = x - lastSample.x;
    const dy = y - lastSample.y;
    if (dx * dx + dy * dy >= MIN_TRAIL_DIST * MIN_TRAIL_DIST) {
      trail.unshift({ x, y });
      if (trail.length > TRAIL_LENGTH) trail.pop();
      lastTrailSampleRef.current = { x, y };
    }

    setParticles(buildParticles(trail));
    setCursor({
      x,
      y,
      symbol: SYMBOLS[symbolIndexRef.current],
      visible: true,
    });
  }, []);

  useEffect(() => {
    if (reducedMotion || !finePointer) return undefined;

    const html = document.documentElement;
    const body = document.body;
    html.style.cursor = 'none';
    body.style.cursor = 'none';

    const onLeave = () => {
      trailRef.current = [];
      lastTrailSampleRef.current = null;
      prevPosRef.current = null;
      movedRef.current = 0;
      setParticles(emptyParticles());
      setCursor((c) => ({ ...c, visible: false }));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    html.addEventListener('mouseleave', onLeave);

    return () => {
      html.style.cursor = '';
      body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      html.removeEventListener('mouseleave', onLeave);
    };
  }, [reducedMotion, finePointer, onMove]);

  if (reducedMotion || !finePointer) return null;

  return (
    <div className={styles.root} aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={`t-${i}`}
          className={styles.particle}
          style={{
            left: p.x,
            top: p.y,
            opacity: p.opacity,
          }}
        >
          {p.symbol}
        </span>
      ))}
      <span
        className={styles.cursor}
        style={{
          left: cursor.x,
          top: cursor.y,
          opacity: cursor.visible ? 1 : 0,
        }}
      >
        {cursor.symbol}
      </span>
    </div>
  );
}
