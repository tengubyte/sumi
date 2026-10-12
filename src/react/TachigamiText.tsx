"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { slashText, type SlashTextOptions } from "../core/tachigamiText.js";

export interface TachigamiTextProps extends SlashTextOptions {
  /** A word or a few characters, drawn from the font as large as the canvas allows. */
  readonly text: string;
  /** What it says. Without it the canvas is decoration and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** A word cut by one slash of the brush, once, when it scrolls into view. */
export function TachigamiText(props: TachigamiTextProps): JSX.Element {
  const { text, label, className, style, font, weight, textColor, mode, through, angle, color, glint, seed, duration, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const point = through === undefined ? "" : through.join(" ");
  const run = [text, font, weight, textColor, mode, point, angle, color, glint, seed, duration, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    const [x = 0.5, y = 0.5] = point === "" ? [] : point.split(" ").map(Number);
    return slashText(canvas.current, text, { font, weight, textColor, mode, through: point === "" ? undefined : [x, y], angle, color, glint, seed, duration, delay });
  }, [text, font, weight, textColor, mode, point, angle, color, glint, seed, duration, delay]);

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ pointerEvents: "none", ...style }} />;
}
