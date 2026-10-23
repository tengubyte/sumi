"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { dyeShibori, type ShiboriOptions } from "../core/shibori.js";

export interface ShiboriProps extends ShiboriOptions {
  /** Size the canvas here. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Cloth tie-dyed in indigo dip by dip, once, when it scrolls into view. It is decoration. */
export function Shibori(props: ShiboriProps): JSX.Element {
  const { className, style, pattern, dips, color, cloth, seed, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [pattern, dips, color, cloth, seed, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return dyeShibori(canvas.current, { pattern, dips, color, cloth, seed, speed, delay });
  }, [pattern, dips, color, cloth, seed, speed, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
