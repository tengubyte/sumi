"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintSansui, type SansuiOptions } from "../core/sansui.js";

export interface SansuiProps extends SansuiOptions {
  /** Size the canvas here; wide shapes suit it. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** An ink-wash landscape drawn in code, painted once when it scrolls into view. It is decoration. */
export function Sansui(props: SansuiProps): JSX.Element {
  const { className, style, seed, sun, mist, color, sunColor, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [seed, sun, mist, color, sunColor, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return paintSansui(canvas.current, { seed, sun, mist, color, sunColor, speed, delay });
  }, [seed, sun, mist, color, sunColor, speed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
