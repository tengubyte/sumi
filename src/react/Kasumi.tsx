"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintKasumi, type KasumiOptions } from "../core/kasumi.js";

export interface KasumiProps extends KasumiOptions {
  /** Size the canvas here: full width and 80 to 160 px tall suits a divider. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Two gold cloud bands that slide in and settle, once, when they scroll into view. It is decoration. */
export function Kasumi(props: KasumiProps): JSX.Element {
  const { className, style, seed, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [seed, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return paintKasumi(canvas.current, { seed, duration, delay });
  }, [seed, duration, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ display: "block", pointerEvents: "none", ...style }} />;
}
