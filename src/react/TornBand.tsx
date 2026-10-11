"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { tearBand, type BandOptions } from "../core/torn.js";

export interface TornBandProps extends BandOptions {
  /** Size the canvas here: full width and 80 to 120 px tall suits the edge of a section. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** A band torn across from left to right, once, when it scrolls into view. It is decoration. */
export function TornBand(props: TornBandProps): JSX.Element {
  const { className, style, side, color, edge, seed, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [side, color, edge, seed, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return tearBand(canvas.current, { side, color, edge, seed, duration, delay });
  }, [side, color, edge, seed, duration, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ display: "block", pointerEvents: "none", ...style }} />;
}
