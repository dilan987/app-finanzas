import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';

interface TourSpotlightProps {
  target: HTMLElement | null;
  padding?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(el: HTMLElement, padding: number): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(r.top - padding, 0),
    left: Math.max(r.left - padding, 0),
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

export default function TourSpotlight({ target, padding = 8 }: TourSpotlightProps) {
  const reduce = useReducedMotion();
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let raf = 0;
    const update = () => {
      setRect(getRect(target, padding));
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [target, padding]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      className="fixed inset-0 z-[1000] pointer-events-none"
      aria-hidden="true"
    >
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect ? (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={8}
                ry={8}
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>
      {rect ? (
        <motion.div
          initial={false}
          animate={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          transition={{ duration: reduce ? 0 : 0.25, ease: 'easeOut' }}
          className="absolute rounded-lg ring-2 ring-primary-500 shadow-[0_0_0_6px_rgba(59,130,246,0.25)]"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}
      {/* Force re-render on viewport change */}
      <span className="hidden">{`${viewport.w}x${viewport.h}`}</span>
    </motion.div>,
    document.body,
  );
}
