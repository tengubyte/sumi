"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintHake, type HakeStrokeOptions } from "../core/hake.js";

export interface HakeStrokeProps extends HakeStrokeOptions {
  /** Size the canvas here; the stroke runs through its middle. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** One stroke of a wide flat brush, dragged across once when it scrolls into view. It is decoration. */
export function HakeStroke(props: HakeStrokeProps): JSX.Element {
  const { className, style, color, thickness, bend, angle, seed, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [color, thickness, bend, angle, seed, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return paintHake(canvas.current, { color, thickness, bend, angle, seed, duration, delay });
  }, [color, thickness, bend, angle, seed, duration, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
