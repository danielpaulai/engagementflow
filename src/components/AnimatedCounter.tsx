'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Find the nearest scrollable ancestor card to observe instead of the span itself
  // This avoids issues where the span is in viewport but parent has opacity: 0
  const getObserveTarget = useCallback(() => {
    if (!ref.current) return null;
    // Walk up to find a reveal-on-scroll parent, fall back to the span
    let el: HTMLElement | null = ref.current;
    while (el) {
      if (el.classList.contains('reveal-on-scroll') || el.classList.contains('reveal')) {
        return el;
      }
      el = el.parentElement;
    }
    return ref.current;
  }, []);

  useEffect(() => {
    if (hasAnimated || !ref.current) return;

    const target = getObserveTarget();
    if (!target) return;

    // If the target has a reveal class, wait for is-visible before starting
    const hasReveal = target.classList.contains('reveal-on-scroll') || target.classList.contains('reveal');

    if (hasReveal && target.classList.contains('is-visible')) {
      // Already visible
      setHasAnimated(true);
      return;
    }

    if (hasReveal) {
      // Watch for the is-visible class being added
      const mo = new MutationObserver(() => {
        if (target.classList.contains('is-visible')) {
          setHasAnimated(true);
          mo.disconnect();
        }
      });
      mo.observe(target, { attributes: true, attributeFilter: ['class'] });
      return () => mo.disconnect();
    }

    // No reveal parent — use standard IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasAnimated, getObserveTarget]);

  useEffect(() => {
    if (!hasAnimated) return;
    if (value === 0) { setDisplay(0); return; }

    let start: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [hasAnimated, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
