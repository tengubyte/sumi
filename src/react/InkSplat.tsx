"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { throwSplat, type SplatOptions } from "../core/throwSplat.js";

export interface InkSplatProps extends SplatOptions {
  /** Size the canvas here; the splat scales with its width. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/**
 * An ink splat drawn in code, thrown once when it scrolls into view. Every seed gives a different splat.
 * It is decoration: hidden from assistive technology and from the pointer.
 */
export function InkSplat(props: InkSplatProps): JSX.Element {
  const { className, style, seed, angle, x, y, size, color, underColor, mist, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [seed, angle, x, y, size, color, underColor, mist, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return throwSplat(canvas.current, { seed, angle, x, y, size, color, underColor, mist, duration, delay });
  }, [seed, angle, x, y, size, color, underColor, mist, duration, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
