import { useEffect, useRef } from 'preact/hooks';
import { drawCard, bitsOf } from '../../../core/cards.js';

export function NeevCard({ id, side = 'sure', size = 220, turn = 0 }) {
  const c = useRef();
  useEffect(() => { const k = Math.min(3, devicePixelRatio || 1) * size; c.current.width = c.current.height = k; const x = c.current.getContext('2d'); x.translate(k / 2, k / 2); drawCard(x, id, k, side); }, [id, side, size]);
  return <canvas ref={c} class="ncard" style={`width:${size}px;height:${size}px;transform:rotate(${turn}deg)`} role="img" aria-label={`NeevCard ${id + 1}, ${side === 'sure' ? 'blue' : 'orange'} side`} />;
}
export function cardSVG(id, side) {
  const f = side === 'sure' ? '#2F7FE0' : '#FF8A3D', cells = bitsOf(id).map((b, i) => (b ? `<rect x="${-2 + (i % 4)}" y="${-2 + Math.floor(i / 4)}" width="1.02" height="1.02" fill="#fff"/>` : '')).join('');
  const L = [['A', 0, -5.5, 0], ['B', 5.5, 0, 90], ['C', 0, 5.5, 180], ['D', -5.5, 0, 270]].map(([t, x, y, r]) => `<text transform="translate(${x} ${y}) rotate(${r})" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="800" font-size="2.4" fill="#fff">${t}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 14 14" shape-rendering="geometricPrecision"><rect x="-7" y="-7" width="14" height="14" fill="${f}"/><rect x="-4" y="-4" width="8" height="8" fill="#fff"/><rect x="-3" y="-3" width="6" height="6" fill="#0B2B2A"/>${cells}${L}</svg>`;
}
