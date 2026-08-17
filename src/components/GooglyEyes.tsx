'use client';

import { useEffect, useRef } from 'react';

/** Cursor-tracking googly eyes — look only, no blink. */
export default function GooglyEyes({ size = 28, className = '' }: { size?: number; className?: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const max = Math.max(3, size * 0.26);
    const pupil = Math.max(9, Math.round(size * 0.38));
    const nodes = Array.from(wrap.querySelectorAll<HTMLElement>('[data-pupil="true"]'));

    nodes.forEach((p) => {
      p.style.width = `${pupil}px`;
      p.style.height = `${pupil}px`;
      p.style.transform = 'translate3d(-50%, -50%, 0)';
    });

    wrap.dataset.eyesReady = reduce ? 'reduced' : 'tracking';
    if (reduce) return undefined;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = true;

    const place = (x: number, y: number) => {
      const tr = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0)`;
      nodes.forEach((p) => {
        p.style.transform = tr;
      });
    };

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, dist / 140);
      tx = (dx / dist) * max * pull;
      ty = (dy / dist) * max * pull;
    };

    const tick = () => {
      if (!running) return;
      cx += (tx - cx) * 0.28;
      cy += (ty - cy) * 0.28;
      place(cx, cy);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  const pupil = Math.max(9, Math.round(size * 0.38));

  return (
    <span
      ref={wrapRef}
      data-googly-eyes="true"
      className={`inline-flex items-center gap-[3px] pointer-events-none ${className}`}
      aria-hidden
      style={{ lineHeight: 0 }}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          className="relative inline-block overflow-hidden rounded-full bg-white border-2 border-ink shadow-hard-sm"
          style={{ width: size, height: size }}
        >
          <span
            data-pupil="true"
            className="absolute left-1/2 top-1/2 block rounded-full bg-ink"
            style={{
              width: pupil,
              height: pupil,
              transform: 'translate3d(-50%, -50%, 0)',
              willChange: 'transform',
            }}
          />
        </span>
      ))}
    </span>
  );
}
