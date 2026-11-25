import { useEffect, useRef } from 'preact/hooks';
import { calm } from './fx.js';

/** Publishes pointer position as --px / --py (-0.5..0.5) for gentle parallax. */
export function useTilt() {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current; if (!el || calm() || matchMedia('(pointer: coarse)').matches) return;
    const f = (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); };
    el.addEventListener('pointermove', f); return () => el.removeEventListener('pointermove', f);
  }, []);
  return ref;
}
