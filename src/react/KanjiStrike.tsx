"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { strikeKanji, type StrikeOptions } from "../core/kanji.js";

export interface KanjiStrikeProps extends StrikeOptions {
  /** One character, or two. */
  readonly text: string;
  /** What the character means, such as "Danger". Without it the canvas is decoration and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** Size the canvas here; the character takes 92% of its shorter side. */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
}

/** One character struck in a single brush sweep, once, when it scrolls into view. Mount it to strike again. */
export function KanjiStrike(props: KanjiStrikeProps): JSX.Element {
  const { text, label, className, style, font, weight, color, angle, glow, seed, speed, delay } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = [text, font, weight, color, angle, glow, seed, speed, delay].map(String).join(" ");

  useEffect(() => {
    if (!canvas.current) return;
    return strikeKanji(canvas.current, text, { font, weight, color, angle, glow, seed, speed, delay });
  }, [text, font, weight, color, angle, glow, seed, speed, delay]);

  const a11y = label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  // A new canvas per run: a canvas whose WebGL context was released cannot get another.
  return <canvas key={run} ref={canvas} {...a11y} className={className} style={{ pointerEvents: "none", ...style }} />;
}
