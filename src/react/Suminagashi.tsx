"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { floatInk, type FloatOptions } from "../core/floatInk.js";
import type { MarbleOp } from "../core/marble.js";

export interface SuminagashiProps extends FloatOptions {
  /** Size the canvas here; a preset is laid out for its shape. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Ink floated on water in rings, then pulled into flowing lines, once, when it scrolls into view. It is decoration. */
export function Suminagashi(props: SuminagashiProps): JSX.Element {
  const { className, style, pattern, ops, color, accent, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Compared by content, so an inline array does not restart the run on every render.
  const plan = ops === undefined ? "" : JSON.stringify(ops);
  const run = [pattern, plan, color, accent, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const steps = plan === "" ? undefined : (JSON.parse(plan) as MarbleOp[]);
    return floatInk(canvas.current, { pattern, ops: steps, color, accent, delay });
  }, [pattern, plan, color, accent, delay]);

  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} aria-hidden="true" className={className} style={{ pointerEvents: "none", ...style }} />;
}
