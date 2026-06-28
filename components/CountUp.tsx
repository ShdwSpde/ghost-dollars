"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Raw dollar value (e.g. 116_300_000_000) */
  target: number;
  /** Exact pre-formatted string shown at animation end and to assistive tech */
  finalLabel: string;
  /** Animation duration in ms. Default: 1600. */
  duration?: number;
}

/**
 * Format as billions throughout the animation so the chip width stays stable
 * (avoids the layout-thrash of cycling through $K → $M → $B units).
 */
function fmtB(n: number): string {
  return `$${(n / 1e9).toFixed(1)}B`;
}

/**
 * Counts up from $0.0B to `finalLabel` on mount using requestAnimationFrame
 * with an ease-out cubic curve.
 *
 * Accessibility: the parent element should carry `aria-label` with the full
 * final text so assistive tech reads the correct value immediately. This span
 * is aria-hidden so screen readers don't announce every intermediate value.
 *
 * Reduced motion: when `prefers-reduced-motion: reduce` is active the final
 * value is shown immediately — no animation fires.
 */
export function CountUp({ target, finalLabel, duration = 1600 }: CountUpProps) {
  const [display, setDisplay] = useState(fmtB(0)); // "$0.0B" — matches SSR
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Guard: jsdom / unusual environments may not implement matchMedia
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplay(finalLabel);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic: fast ramp, decelerates into the final value
      const eased = 1 - Math.pow(1 - t, 3);

      if (t >= 1) {
        setDisplay(finalLabel);
        return; // no further rAF needed
      }

      setDisplay(fmtB(target * eased));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, finalLabel, duration]);

  return (
    /*
     * display: inline-block + minWidth reserves space for the widest form
     * ($116.3B = 7 chars) so the chip doesn't reflow as digits grow.
     * font-variant-numeric: tabular-nums keeps digit widths uniform
     * (Space Mono is already monospaced, but this is belt-and-suspenders).
     */
    <span
      aria-hidden="true"
      style={{ display: "inline-block", minWidth: "7.5ch", fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}
