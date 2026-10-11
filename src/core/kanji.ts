import { KANJI_FRAGMENT, KANJI_SECONDS } from "./kanjiGlsl.js";
import { playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export interface StrikeOptions {
  /** A CSS font family for the character, loaded before the strike. A brush face such as Yuji Syuku suits it. Default a Mincho stack. */
  readonly font?: string | undefined;
  /** Default 700. */
  readonly weight?: number | undefined;
  /** Default `#d8001a` (vermilion). */
  readonly color?: Hex | undefined;
  /** Direction of the sweep, degrees clockwise from pointing right. Default -20, rising to the right. */
  readonly angle?: number | undefined;
  /** A soft halo round the character, for dark pages. Default false. */
  readonly glow?: boolean | undefined;
  /** Changes the streaks and the drops. Default 1. */
  readonly seed?: number | undefined;
  /** 2 strikes twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

const SIDE = 512;
const MINCHO = '"Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const fontSpec = (options: StrikeOptions): string => `${String(options.weight ?? 700)} ${String(SIDE * 0.8)}px ${options.font ?? MINCHO}`;

/**
 * Blurs a square of `side` values in place with three box passes each way, close to a Gaussian with a
 * standard deviation of about `radius` px. Canvas filters would do it, but older Safari ignores them.
 */
export function boxBlur(values: Float32Array, side: number, radius: number): Float32Array {
  // Three passes of a box r each side spread like a Gaussian of sqrt(r * (r + 1)).
  const r = Math.max(Math.round(radius), 1);
  const line = new Float32Array(side);
  for (let pass = 0; pass < 6; pass++) {
    const across = pass % 2 === 0;
    for (let row = 0; row < side; row++) {
      const at = (i: number): number => (across ? row * side + i : i * side + row);
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += values[at(Math.min(Math.max(i, 0), side - 1))] ?? 0;
      for (let i = 0; i < side; i++) {
        line[i] = sum / (2 * r + 1);
        sum += (values[at(Math.min(i + r + 1, side - 1))] ?? 0) - (values[at(Math.max(i - r, 0))] ?? 0);
      }
      for (let i = 0; i < side; i++) values[at(i)] = line[i] ?? 0;
    }
  }
  return values;
}

/** The character in r, its edge in g (a small blur) and its surroundings in b (a wide blur, boosted). */
function glyphImage(text: string, options: StrikeOptions): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  const out = new ImageData(SIDE, SIDE);
  const g = canvas.getContext("2d");
  if (!g) return out;
  g.fillStyle = "#fff";
  g.font = fontSpec(options);
  const m = g.measureText(text);
  const w = Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1);
  const h = Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1);
  const s = Math.min((SIDE * 0.86) / w, (SIDE * 0.86) / h, 1.2);
  g.setTransform(s, 0, 0, s, (SIDE - w * s) / 2 + m.actualBoundingBoxLeft * s, (SIDE - h * s) / 2 + m.actualBoundingBoxAscent * s);
  g.fillText(text, 0, 0);
  const pixels = g.getImageData(0, 0, SIDE, SIDE).data;
  const shape = Float32Array.from({ length: SIDE * SIDE }, (_, i) => (pixels[i * 4 + 3] ?? 0) / 255);
  const edge = boxBlur(shape.slice(), SIDE, 5);
  const near = boxBlur(shape.slice(), SIDE, 28);
  for (let i = 0; i < SIDE * SIDE; i++) {
    out.data[i * 4] = (shape[i] ?? 0) * 255;
    out.data[i * 4 + 1] = (edge[i] ?? 0) * 255;
    out.data[i * 4 + 2] = Math.min((near[i] ?? 0) * 2.2, 1) * 255;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

/** Returns null when WebGL or the shader is unavailable. The font should have loaded. */
export function strikePainter(canvas: HTMLCanvasElement, text: string, options: StrikeOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, KANJI_FRAGMENT);
  if (!at) return null;
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, glyphImage(text, options), gl.RGBA, false);
  gl.uniform1i(at("glyph"), 0);
  gl.uniform3fv(at("color"), rgb(options.color ?? "#d8001a"));
  gl.uniform1f(at("angle"), ((options.angle ?? -20) * Math.PI) / 180);
  gl.uniform1f(at("glow"), options.glow === true ? 1 : 0);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uTime = at("time");
  return {
    duration: KANJI_SECONDS / speed,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uTime, Math.min(seconds * speed, KANJI_SECONDS));
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Strikes `text` (one character, or two) onto `canvas` in one brush sweep once it scrolls into view. Size
 * the canvas with CSS; the character takes 92% of its shorter side. The last frame stays, and a resize
 * redraws it. Reduced motion shows the struck character; no WebGL draws nothing. Returns the cleanup.
 */
export function strikeKanji(canvas: HTMLCanvasElement, text: string, options: StrikeOptions = {}): () => void {
  let stop = (): void => undefined;
  let cancelled = false;
  // The character is drawn from the font once, so it has to be there first.
  void document.fonts
    .load(fontSpec(options), text)
    .catch(() => [])
    .then(() => {
      if (!cancelled) stop = playCanvas(canvas, () => strikePainter(canvas, text, options), options.delay ?? 0);
    });
  return () => {
    cancelled = true;
    stop();
  };
}
