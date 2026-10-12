"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type ForwardedRef, type JSX } from "react";
import { fudePad, type FudeOptions, type FudePad, type FudeStroke } from "../core/fude.js";

export interface FudeProps extends FudeOptions {
  /** What the drawing area is for. Without it the canvas is hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Draws a stroke as a hand would, and wipes the paper. */
export interface FudeHandle {
  trace(stroke: FudeStroke): Promise<void>;
  clear(): void;
}

/**
 * A sheet the visitor draws on with a sumi brush. Strokes fade once the hand rests, unless `fadeAfter`
 * is 0. A ref gives `trace` and `clear`.
 */
export const Fude = forwardRef(function Fude(props: FudeProps, ref: ForwardedRef<FudeHandle>): JSX.Element {
  const { label, className, style, color, size, dryAfter, fadeAfter, onDrawing, seed } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<FudePad | null>(null);
  // Read when the brush moves, so a new function each render does not wipe the paper.
  const drawing = useRef(onDrawing);
  drawing.current = onDrawing;
  const run = [color, size, dryAfter, fadeAfter, seed].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    pad.current = fudePad(canvas.current, { color, size, dryAfter, fadeAfter, seed, onDrawing: (down) => drawing.current?.(down) });
    return () => {
      pad.current?.stop();
      pad.current = null;
    };
  }, [color, size, dryAfter, fadeAfter, seed]);

  useImperativeHandle(ref, () => ({
    trace: async (stroke) => pad.current?.trace(stroke),
    clear: () => pad.current?.clear(),
  }));

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ touchAction: "none", cursor: "crosshair", ...style }} />;
});
