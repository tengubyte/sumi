"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { paintStrokes, type StrokeOptions } from "../core/paintStrokes.js";

export interface BrushPaintProps extends StrokeOptions {
  /** SVG markup made of strokes, such as a KanjiVG file, painted in document order. */
  readonly svg: string;
  /** What the art says, such as the character. Without it the canvas is decoration and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here; the art sits centred in it without stretching. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** Paints an SVG's strokes one by one with a brush drawn in code, once, when it scrolls into view. */
export function BrushPaint(props: BrushPaintProps): JSX.Element {
  const { svg, label, className, style, weight, speed, color, bleed, contrast, bristles, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [svg, weight, speed, color, bleed, contrast, bristles, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return paintStrokes(canvas.current, svg, { weight, speed, color, bleed, contrast, bristles, delay });
  }, [svg, weight, speed, color, bleed, contrast, bristles, delay]);

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ pointerEvents: "none", ...style }} />;
}
