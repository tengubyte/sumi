"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintEnso, type EnsoOptions } from "../core/enso.js";

export interface EnsoProps extends EnsoOptions {
  /** Size the canvas here; the ensō sits centred in it. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** An ensō drawn in code from a seed, painted once when it scrolls into view. It is decoration. */
export function Enso(props: EnsoProps): JSX.Element {
  const { className, style, seed, weight, speed, color, bleed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [seed, weight, speed, color, bleed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return paintEnso(canvas.current, { seed, weight, speed, color, bleed, delay });
  }, [seed, weight, speed, color, bleed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
