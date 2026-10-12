import { playCanvas } from "./play.js";
import type { Hex } from "./splatShader.js";
import { slashPainter, type SlashOptions } from "./tachigami.js";

export interface SlashTextOptions extends SlashOptions {
  /** A CSS font family for the text, loaded before the slash. Default a Mincho stack. */
  readonly font?: string | undefined;
  /** Default 900. */
  readonly weight?: number | undefined;
  /** The text's colour. Default `#161314` (sumi). */
  readonly textColor?: Hex | undefined;
}

const MINCHO = '"Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';

const fontSpec = (options: SlashTextOptions, px: number): string => `${String(options.weight ?? 900)} ${String(Math.round(px))}px ${options.font ?? MINCHO}`;

/** `text` drawn centred on a transparent canvas of `width` by `height`, as large as fits. */
function wordImage(text: string, width: number, height: number, options: SlashTextOptions): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  g.font = fontSpec(options, 100);
  const m = g.measureText(text);
  const w = Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1);
  const h = Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1);
  const s = Math.min((width * 0.86) / w, (height * 0.8) / h);
  g.font = fontSpec(options, 100 * s);
  const fit = g.measureText(text);
  g.fillStyle = options.textColor ?? "#161314";
  g.fillText(text, (width - fit.actualBoundingBoxRight + fit.actualBoundingBoxLeft) / 2, (height + fit.actualBoundingBoxAscent - fit.actualBoundingBoxDescent) / 2);
  return canvas;
}

/**
 * Cuts `text` with one slash of the brush on `canvas` once it scrolls into view. Size the canvas with CSS;
 * the text is drawn from the font as large as fits. The last frame stays, and a resize redraws it.
 * Reduced motion shows the finished cut; no WebGL draws nothing. Returns the cleanup.
 */
export function slashText(canvas: HTMLCanvasElement, text: string, options: SlashTextOptions = {}): () => void {
  let stop = (): void => undefined;
  let cancelled = false;
  // The text is drawn from the font, so it has to be there first.
  void document.fonts
    .load(fontSpec(options, 100), text)
    .catch(() => [])
    .then(() => {
      if (!cancelled) stop = playCanvas(canvas, () => slashPainter(canvas, (w, h) => wordImage(text, w, h, options), options), options.delay ?? 0);
    });
  return () => {
    cancelled = true;
    stop();
  };
}
