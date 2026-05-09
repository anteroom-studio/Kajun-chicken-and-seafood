/**
 * SmoothScroll — Lenis-powered desktop wheel smoothing.
 * Mirrors the engineering-portfolio pattern: ease-out-quart, ~1.6s duration,
 * disabled on touch/reduced-motion so native iOS/Android momentum stays untouched.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(hover: none)').matches
    || ('ontouchstart' in window)
    || (navigator.maxTouchPoints > 0);
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion() || isTouchDevice()) {
      // native scroll on touch + reduced motion. Lenis stays off.
      lenisRef.current?.destroy?.();
      lenisRef.current = null;
      return;
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const instance = new Lenis({
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: false,
      autoRaf: false,
    });
    lenisRef.current = instance;

    let frame = 0;
    const raf = (time) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset scroll on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

  return children;
}
