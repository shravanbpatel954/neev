// The scanner. Both sources feed the SAME detector: a live camera, or a rendered classroom frame.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Confirmer, TURN, detect, drawCard } from '../../../core/cards.js';
import { buzz, sfx } from '../lib/fx.js';
import { Btn, Icon } from './bits.jsx';

const W = 960, H = 600, SKIN = ['#8D5A3B', '#A9714B', '#C58A5E', '#74462C'], SHIRT = ['#DCE6E4', '#C9D8DC', '#E6DFD0'];
function paint(ctx, list, time, light) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#CFC7B2'); g.addColorStop(1, '#B3A98F'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#A0805A'; for (let r = 0; r < 5; r++) ctx.fillRect(0, 96 + r * 117, W, 9);
  list.forEach((c, n) => {
    const x = 64 + (n % 8) * 119, y = 62 + Math.floor(n / 8) * 117, up = Math.min(1, Math.max(0, (time - c.delay) / 260));
    ctx.fillStyle = SHIRT[n % 3]; ctx.beginPath(); ctx.roundRect(x - 34, y + 4, 68, 46, 14); ctx.fill();
    ctx.fillStyle = SKIN[n % 4]; ctx.beginPath(); ctx.arc(x, y - 12, 20, 0, 7); ctx.fill();
    ctx.fillStyle = '#2B1B12'; ctx.beginPath(); ctx.arc(x, y - 17, 20, Math.PI, 0); ctx.fill();
    if (!c.option || up <= 0) return;
    ctx.save(); ctx.translate(x + Math.sin(time / 300 + n) * 2, y + 6 + (1 - up) * 46 + Math.cos(time / 340 + n) * 1.6);
    ctx.rotate(((TURN[c.option] + c.tilt + Math.sin(time / 420 + n * 2) * 3) * Math.PI) / 180); ctx.transform(1, c.skew, 0, 1, 0, 0);
    drawCard(ctx, c.id, 84, c.side); ctx.restore();
  });
  if (light < 1) { ctx.fillStyle = `rgba(4,10,30,${1 - light})`; ctx.fillRect(0, 0, W, H); }
}

/** cards: [{id, name, option, side}] for the rendered classroom (option null = absent). onRead(id, option, side). */
export function Scanner({ cards, onRead, read, live, setLive, light, need = 3, onFrame }) {
  const cv = useRef(), vid = useRef(), [err, setErr] = useState(null), [ms, setMs] = useState(null), readRef = useRef(read); readRef.current = read;
  useEffect(() => {
    let stop = false, stream, raf, last = 0, t0 = performance.now();
    const ctx = cv.current.getContext('2d', { willReadFrequently: true }), conf = new Confirmer(need);
    const list = cards.map((c, i) => ({ ...c, delay: 250 + ((i * 7919) % 2300), tilt: ((i * 53) % 25) - 12, skew: (((i * 31) % 11) - 5) / 90 }));
    const tick = (now) => {
      if (stop || !cv.current) return; raf = requestAnimationFrame(tick);
      if (now - last < 85) return; last = now;
      if (live) {
        const v = vid.current; if (!v?.videoWidth) return;
        const k = Math.min(1, 960 / v.videoWidth), w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
        if (cv.current.width !== w || cv.current.height !== h) { cv.current.width = w; cv.current.height = h; }
        ctx.drawImage(v, 0, 0, w, h);
      } else { if (cv.current.width !== W) { cv.current.width = W; cv.current.height = H; } paint(ctx, list, now - t0, light); }
      const { width: w, height: h } = cv.current, a = performance.now(), dets = detect(ctx.getImageData(0, 0, w, h).data, w, h); setMs(Math.round(performance.now() - a));
      const fresh = conf.push(dets); onFrame?.(dets);
      for (const d of dets) {
        const [p, q, r, s] = d.corners, ok = conf.done.has(d.id);
        ctx.lineWidth = 4; ctx.strokeStyle = ok ? '#6EDFB3' : '#F2B035'; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.lineTo(...r); ctx.lineTo(...s); ctx.closePath(); ctx.stroke();
        if (ok) { const x = (p[0] + r[0]) / 2, y = (p[1] + r[1]) / 2; ctx.fillStyle = '#178A63'; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.option, x, y + 1); }
      }
      let any = false; for (const d of fresh) if (!readRef.current?.has(d.id)) { any = true; onRead(d.id, d.option, d.side); }
      if (any) { sfx('tick'); buzz(6); }
    };
    (async () => {
      setErr(null);
      if (live) {
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('insecure');
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
          if (stop) { stream.getTracks().forEach((x) => x.stop()); return; }
          vid.current.srcObject = stream; await vid.current.play();
        } catch (e) { if (!stop) { setErr(e.message === 'insecure' ? 'The camera needs https or localhost. Using the sample classroom.' : 'Camera not available. Using the sample classroom.'); setLive?.(false); } return; }
      }
      raf = requestAnimationFrame(tick);
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((x) => x.stop()); };
  }, [cards, live, light]);
  return (
    <div class="scanner">
      <canvas ref={cv} width={W} height={H} aria-label="Scanner view" role="img" />
      <video ref={vid} playsInline muted hidden />
      <div class="scanbar"><span>{live ? 'Live camera' : 'Simulated classroom, real detector'}</span><span>{ms != null && `${ms} ms a frame`}</span></div>
      {err && <p class="scanerr"><Icon n="eye" s={16} /> {err}</p>}
    </div>
  );
}
export function LiveToggle({ live, setLive }) { return <Btn kind="ghost" class="sm" onClick={() => setLive(!live)}><Icon n={live ? 'users' : 'scan'} s={18} /> {live ? 'Use sample classroom' : 'Use my camera'}</Btn>; }
