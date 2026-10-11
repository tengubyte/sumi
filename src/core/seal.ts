import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { SEAL_FRAGMENT, SEAL_SECONDS } from "./sealGlsl.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export type SealShape = "square" | "tall" | "round";

export interface SealOptions {
  /** Default `"square"`. Tall suits two or three characters in a column. */
  readonly shape?: SealShape | undefined;
  /** White characters cut into a red block (hakubun). Default false: red characters in a red border (shubun). */
  readonly white?: boolean | undefined;
  /** A CSS font family for the characters. It is loaded before the seal is cut. Default a Mincho stack. */
  readonly font?: string | undefined;
  /** Default 700. */
  readonly weight?: number | undefined;
  /** The seal paste. Default `#d8001a` (vermilion). */
  readonly color?: Hex | undefined;
  /** Changes the paper grain, the chips in the border and which side pressed harder. Default 1. */
  readonly seed?: number | undefined;
  /** 2 presses twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** A character's box on the seal face, as shares of the face inside its margin. */
export type Cell = readonly [x: number, y: number, width: number, height: number];

/**
 * Lays out up to four characters on a face `aspect` times as wide as high, the way seals are read:
 * columns from the right, each top to bottom. Four make a square of two columns.
 */
export function sealCells(count: number, aspect: number): Cell[] {
  const n = Math.min(Math.max(Math.floor(count), 1), 4);
  const cols = n === 4 || (n === 2 && aspect > 1) ? 2 : 1;
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i): Cell => [(cols - 1 - Math.floor(i / rows)) / cols, (i % rows) / rows, 1 / cols, 1 / rows]);
}

const MINCHO = '"Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const fontSpec = (options: SealOptions): string => `${String(options.weight ?? 700)} 200px ${options.font ?? MINCHO}`;

/** The characters in white on a canvas shaped like the face: stretched to fill their cells, as carvers do. */
function glyphCanvas(text: string, [hx, hy]: readonly [number, number], round: boolean, options: SealOptions): HTMLCanvasElement {
  const chars = Array.from(text).slice(0, 4);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(512 * hx);
  canvas.height = Math.round(512 * hy);
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  // 256 px per seal unit. A round seal keeps its characters inside the square that fits the circle.
  const margin = round ? (1 - 0.86 * 0.72) * 256 : (0.09 * Math.min(hx, hy) + 0.07) * 256;
  const faceW = canvas.width - 2 * margin;
  const faceH = canvas.height - 2 * margin;
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineWidth = 3;
  g.font = fontSpec(options);
  sealCells(chars.length, hx / hy).forEach(([x, y, w, h], i) => {
    const ch = chars[i] ?? "";
    const m = g.measureText(ch);
    const bw = Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1);
    const bh = Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1);
    const cellW = w * faceW;
    const cellH = h * faceH;
    const pad = 0.05 * Math.min(cellW, cellH);
    // Stretch to fill, but only so far: a flat character like 一 stays a line, not a block.
    const fit = Math.min((cellW - 2 * pad) / bw, (cellH - 2 * pad) / bh);
    const sx = Math.min((cellW - 2 * pad) / bw, fit * 1.3);
    const sy = Math.min((cellH - 2 * pad) / bh, fit * 1.3);
    const left = margin + x * faceW + (cellW - bw * sx) / 2;
    const top = margin + y * faceH + (cellH - bh * sy) / 2;
    g.setTransform(sx, 0, 0, sy, left + m.actualBoundingBoxLeft * sx, top + m.actualBoundingBoxAscent * sy);
    g.fillText(ch, 0, 0);
    g.strokeText(ch, 0, 0);
  });
  return canvas;
}

/** Returns null when WebGL or the shader is unavailable. The font should have loaded. */
export function sealPainter(canvas: HTMLCanvasElement, text: string, options: SealOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, SEAL_FRAGMENT);
  if (!at) return null;
  const shape = options.shape ?? "square";
  const half = shape === "tall" ? ([0.55, 1] as const) : ([1, 1] as const);
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, glyphCanvas(text, half, shape === "round", options), gl.RGBA, false);
  const next = random(options.seed ?? 1);
  gl.uniform1i(at("glyph"), 0);
  gl.uniform2f(at("halfSize"), half[0], half[1]);
  gl.uniform1f(at("white"), options.white === true ? 1 : 0);
  gl.uniform1f(at("roundSeal"), shape === "round" ? 1 : 0);
  gl.uniform3fv(at("color"), rgb(options.color ?? "#d8001a"));
  gl.uniform1f(at("turn"), next());
  gl.uniform1f(at("seed"), next() * 50);
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uScale = at("scale");
  const uTime = at("time");
  return {
    duration: SEAL_SECONDS / speed,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      // The face takes 72% of the canvas, leaving room round it for the shadow.
      gl.uniform1f(uScale, 0.36 * Math.min(canvas.width / half[0], canvas.height / half[1]));
      gl.uniform1f(uTime, Math.min(seconds * speed, SEAL_SECONDS));
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Presses a seal of `text` (one to four characters) onto `canvas` once it scrolls into view. Size the
 * canvas with CSS: square for square and round seals, about 1:1.6 for tall ones. The last frame stays,
 * and a resize redraws it. Reduced motion shows the impression; no WebGL draws nothing. Returns the cleanup.
 */
export function pressSeal(canvas: HTMLCanvasElement, text: string, options: SealOptions = {}): () => void {
  let stop = (): void => undefined;
  let cancelled = false;
  // The characters are cut from the font once, so it has to be there first.
  void document.fonts
    .load(fontSpec(options), text)
    .catch(() => [])
    .then(() => {
      if (!cancelled) stop = playCanvas(canvas, () => sealPainter(canvas, text, options), options.delay ?? 0);
    });
  return () => {
    cancelled = true;
    stop();
  };
}
