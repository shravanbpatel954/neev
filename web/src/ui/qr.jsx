import { useMemo } from 'preact/hooks';
import qrcode from 'qrcode-generator';

export function matrix(text, level = 'L') { const q = qrcode(0, level); q.addData(text); q.make(); const n = q.getModuleCount(); return { n, at: (r, c) => q.isDark(r, c) }; }
export function QR({ text, size = 160, level }) {
  const { n, d } = useMemo(() => { const m = matrix(text, level); let d = ''; for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) if (m.at(r, c)) d += `M${c} ${r}h1v1h-1z`; return { n: m.n, d }; }, [text, level]);
  return <svg class="qr" width={size} height={size} viewBox={`-3 -3 ${n + 6} ${n + 6}`} shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-3" y="-3" width={n + 6} height={n + 6} fill="#fff" rx="2" /><path d={d} fill="#0B2B2A" /></svg>;
}
