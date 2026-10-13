import { pictureArt, SIDE, textArt, withField, type FireArt } from "./kaenArt.js";
import { KAEN_FRAGMENT } from "./kaenGlsl.js";
import { MINCHO } from "./kanji.js";
import { loopInView, playCanvas, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

/** `"shu"` burns vermilion on paper, `"sumi"` in black ink, `"night"` brighter for a dark page. */
export type FireLook = "shu" | "sumi" | "night";

export interface FireOptions {
  /** One character, or two, to set alight. Without it, or `src`, the fire burns along the bottom edge. */
  readonly text?: string | undefined;
  /** A picture with a transparent background to set alight round its outline, instead of `text`. Another origin must allow CORS. */
  readonly src?: string | undefined;
  /** Default `"shu"`. */
  readonly look?: FireLook | undefined;
  /** How high the flames climb, as a share of the canvas's shorter side. Default 0.6 along the edge, 0.13 round a character or picture. */
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
const fontSpec = (options: FireOptions): string => `${String(options.weight ?? 700)} ${String(SIDE * 0.3)}px ${options.font ?? MINCHO}`;
const shaped = (options: FireOptions): boolean => options.src !== undefined || (options.text ?? "") !== "";
const reachOf = (options: FireOptions): number => Math.max(options.reach ?? (shaped(options) ? 0.13 : 0.6), 0.02);

/** Returns null when WebGL, its derivatives or the shader are unavailable. A `still` painter keeps one grown frame. */
export function firePainter(canvas: HTMLCanvasElement, options: FireOptions, art: FireArt | null, still = false): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl?.getExtension("OES_standard_derivatives")) return null;
  const at = coverProgram(gl, KAEN_FRAGMENT);
  if (!at) return null;
  const look = LOOKS[options.look ?? "shu"];
  const reach = reachOf(options);
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, art?.front ?? new ImageData(1, 1), gl.RGBA, true);
  gl.activeTexture(gl.TEXTURE1);
  uploadTexture(gl, art?.field ?? new ImageData(1, 1), gl.RGBA, false);
  gl.uniform1i(at("front"), 0);
  gl.uniform1i(at("field"), 1);
  gl.uniform1f(at("shaped"), art ? 1 : 0);
  gl.uniform1f(at("reach"), reach);
  gl.uniform1f(at("fieldReach"), reach * 4);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("cEdge"), rgb(look.edge));
  gl.uniform3fv(at("cBody"), rgb(look.body));
  gl.uniform3fv(at("cHot"), rgb(look.hot));
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
      if (art) gl.uniform4f(uWhorls, (w - 1) / 2 + 0.15, (h - 1) / 2 + 0.15, (w + 1) / 2 - 0.15, (h - 1) / 2 + 0.9);
      else gl.uniform4f(uWhorls, 0, 0.02, w, 0.02 + reach * 0.75);
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

/** The picture or the character to burn round, once it has loaded, or null to burn along the edge. */
async function artFor(options: FireOptions): Promise<FireArt | null> {
  // Straight above the art the flames climb past twice their reach, so its field has to reach further.
  const fieldReach = reachOf(options) * 4;
  if (options.src !== undefined) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = options.src;
    await image.decode();
    return withField(pictureArt(image), fieldReach);
  }
  const text = options.text ?? "";
  if (text === "") return null;
  // The character is drawn from the font once, so it has to be there first.
  await document.fonts.load(fontSpec(options), text).catch(() => []);
  return withField(textArt(text, fontSpec(options), options.color ?? LOOKS[options.look ?? "shu"].ink), fieldReach);
}

/**
 * Sets `canvas` alight along its bottom edge, or round a character with `text` or a picture's outline with
 * `src`, burning while the canvas is on screen. Size the canvas with CSS. The fire paints its own colours, so
 * pick the look for the page. Reduced motion shows one still frame of the grown fire. No WebGL, or a picture
 * that fails to load, draws nothing. Returns the cleanup.
 */
export function kindleFire(canvas: HTMLCanvasElement, options: FireOptions = {}): () => void {
  let stop = (): void => undefined;
  let cancelled = false;
  void artFor(options).then(
    (art) => {
      if (cancelled) return;
      stop = prefersReducedMotion()
        ? playCanvas(canvas, () => firePainter(canvas, options, art, true), options.delay ?? 0)
        : loopInView(canvas, () => firePainter(canvas, options, art), options.delay ?? 0);
    },
    () => undefined,
  );
  return () => {
    cancelled = true;
    stop();
  };
}
