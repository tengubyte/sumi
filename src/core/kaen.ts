import { distanceGrid } from "./distance.js";
import { KAEN_FRAGMENT } from "./kaenGlsl.js";
import { MINCHO } from "./kanji.js";
import { loopInView, playCanvas, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

/** `"shu"` burns vermilion on paper, `"sumi"` in black ink, `"night"` brighter for a dark page. */
export type FireLook = "shu" | "sumi" | "night";

export interface FireOptions {
  /** One character, or two, to set alight. Without it the fire burns along the bottom edge. */
  readonly text?: string | undefined;
  /** Default `"shu"`. */
  readonly look?: FireLook | undefined;
  /** How high the flames climb, as a share of the canvas's shorter side. Default 0.6 along the edge, 0.13 round a character. */
  readonly reach?: number | undefined;
  /** A CSS font family for the character, loaded before the fire starts. Default a Mincho stack. */
  readonly font?: string | undefined;
  /** Default 700. */
  readonly weight?: number | undefined;
  /** The character's colour. Default sumi on `"shu"`, vermilion on `"sumi"` and paper white on `"night"`. */
  readonly color?: Hex | undefined;
  /** Changes every tongue and whorl. Default 1. */
  readonly seed?: number | undefined;
  /** 2 burns twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

// The outline, the body and the pale strands of the fire, and the character's colour in that look.
const LOOKS = {
  shu: { edge: "#5e0a08", body: "#c42a16", hot: "#ffc67a", ink: "#161314" },
  sumi: { edge: "#0d0a0b", body: "#2b2527", hot: "#e8e1da", ink: "#c40018" },
  night: { edge: "#8f150d", body: "#f2541e", hot: "#fff0b8", ink: "#f5f0ef" },
} as const satisfies Record<FireLook, Record<string, Hex>>;

/** Seconds the fire takes to climb to its full height at speed 1. */
const IGNITE = 1.4;
const SIDE = 1024;
const fontSpec = (options: FireOptions): string => `${String(options.weight ?? 700)} ${String(SIDE * 0.3)}px ${options.font ?? MINCHO}`;

/** The character in r, and in g the distance out from it in shares of the side, over `fieldReach`. */
function glyphImage(text: string, options: FireOptions, fieldReach: number): ImageData {
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
  // Small and a little low, so the flames have room to climb above it.
  const s = Math.min((SIDE * 0.5) / w, (SIDE * 0.26) / h);
  g.setTransform(s, 0, 0, s, (SIDE - w * s) / 2 + m.actualBoundingBoxLeft * s, SIDE * 0.58 - (h * s) / 2 + m.actualBoundingBoxAscent * s);
  g.fillText(text, 0, 0);
  const pixels = g.getImageData(0, 0, SIDE, SIDE).data;
  const far = distanceGrid((i) => (pixels[i * 4 + 3] ?? 0) > 110, SIDE, SIDE);
  for (let i = 0; i < SIDE * SIDE; i++) {
    out.data[i * 4] = pixels[i * 4 + 3] ?? 0;
    out.data[i * 4 + 1] = ((far[i] ?? 0) / SIDE / fieldReach) * 255;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

/** Returns null when WebGL, its derivatives or the shader are unavailable. A `still` painter keeps one grown frame. */
export function firePainter(canvas: HTMLCanvasElement, options: FireOptions = {}, still = false): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl?.getExtension("OES_standard_derivatives")) return null;
  const at = coverProgram(gl, KAEN_FRAGMENT);
  if (!at) return null;
  const text = options.text ?? "";
  const look = LOOKS[options.look ?? "shu"];
  const reach = Math.max(options.reach ?? (text === "" ? 0.6 : 0.13), 0.02);
  // Straight above a character the flames climb past twice their reach, so its field has to reach further.
  const fieldReach = reach * 4;
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, text === "" ? new ImageData(1, 1) : glyphImage(text, options, fieldReach), gl.RGBA, false);
  gl.uniform1i(at("art"), 0);
  gl.uniform1f(at("glyph"), text === "" ? 0 : 1);
  gl.uniform1f(at("reach"), reach);
  gl.uniform1f(at("fieldReach"), fieldReach);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("cEdge"), rgb(look.edge));
  gl.uniform3fv(at("cBody"), rgb(look.body));
  gl.uniform3fv(at("cHot"), rgb(look.hot));
  gl.uniform3fv(at("ink"), rgb(options.color ?? look.ink));
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uPixel = at("pixel");
  const uWhorls = at("whorlBox");
  const uTime = at("time");
  const uGrow = at("grow");
  return {
    duration: still ? 0 : Infinity,
    draw(seconds) {
      fitCanvas(gl, canvas);
      const m = Math.min(canvas.width, canvas.height);
      const [w, h] = [canvas.width / m, canvas.height / m];
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uPixel, canvas.width / Math.max(canvas.clientWidth, 1));
      // Whorls only turn where there is fire to turn.
      if (text === "") gl.uniform4f(uWhorls, 0, 0.02, w, 0.02 + reach * 0.75);
      else gl.uniform4f(uWhorls, (w - 1) / 2 + 0.15, (h - 1) / 2 + 0.15, (w + 1) / 2 - 0.15, (h - 1) / 2 + 0.9);
      // A still frame is the fire fully grown, at one moment of its burning.
      const t = still ? 4 : seconds * speed;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uGrow, still ? 1 : Math.min(t / IGNITE, 1) ** 0.6);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Sets `canvas` alight along its bottom edge, or with `text` round a character, burning while the canvas is
 * on screen. Size the canvas with CSS. The fire paints its own colours, so it suits paper and dark pages
 * alike. Reduced motion shows one still frame of the grown fire; no WebGL draws nothing. Returns the cleanup.
 */
export function kindleFire(canvas: HTMLCanvasElement, options: FireOptions = {}): () => void {
  const start = (): (() => void) =>
    prefersReducedMotion()
      ? playCanvas(canvas, () => firePainter(canvas, options, true), options.delay ?? 0)
      : loopInView(canvas, () => firePainter(canvas, options), options.delay ?? 0);
  const text = options.text ?? "";
  if (text === "") return start();
  let stop = (): void => undefined;
  let cancelled = false;
  // The character is drawn from the font once, so it has to be there first.
  void document.fonts
    .load(fontSpec(options), text)
    .catch(() => [])
    .then(() => {
      if (!cancelled) stop = start();
    });
  return () => {
    cancelled = true;
    stop();
  };
}
