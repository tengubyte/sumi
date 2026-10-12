import { HAKE_FRAGMENT } from "./hakeGlsl.js";
import { overlayCanvas, playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export interface HakeOptions {
  /** The way the brush travels, in degrees: 0 left to right, positive climbing. Default -12 for a cut, 0 for a stroke. */
  readonly angle?: number | undefined;
  /** Changes the bristles. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds the stroke takes. */
  readonly duration?: number | undefined;
  /** Seconds to wait after it scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

export interface HakeCutOptions extends HakeOptions {
  /** `"edge"` (default) keeps the picture on one side of a brushed edge; `"band"` keeps it inside one stroke. */
  readonly shape?: "edge" | "band" | undefined;
  /** Which side of the edge keeps the picture. Default `"top"`. */
  readonly side?: "top" | "bottom" | undefined;
  /** How far below the middle the edge, or the band's middle, runs, as a share of the height. Default 0.2 for an edge, 0 for a band. */
  readonly offset?: number | undefined;
  /** The band's thickness as a share of the height. Default 0.6. */
  readonly thickness?: number | undefined;
  /** White streaks laid over the picture along its edge, 0 to 1. Default 0. */
  readonly streaks?: number | undefined;
}

export interface HakeStrokeOptions extends HakeOptions {
  /** Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** The stroke's thickness as a share of the canvas's shorter side. Default 0.3. */
  readonly thickness?: number | undefined;
  /** Curves the stroke: positive sags in the middle, negative arches. Default 0. */
  readonly bend?: number | undefined;
}

export const HAKE_KIND = { edge: 0, band: 1, stroke: 2 } as const;
export type HakeKind = keyof typeof HAKE_KIND;

/** Returns null when WebGL or the shader is unavailable. A picture must have loaded. */
export function hakePainter(canvas: HTMLCanvasElement, kind: HakeKind, options: HakeCutOptions & HakeStrokeOptions = {}, picture?: HTMLImageElement): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, HAKE_FRAGMENT);
  if (!at) return null;
  if (picture) {
    // Premultiplied, so the shader can scale colour and alpha together; flipped to match gl_FragCoord.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE0);
    uploadTexture(gl, picture, gl.RGBA, true);
  }
  gl.uniform1i(at("image"), 0);
  gl.uniform1f(at("kind"), HAKE_KIND[kind]);
  gl.uniform1f(at("flip"), options.side === "bottom" ? -1 : 1);
  gl.uniform1f(at("angle"), ((options.angle ?? (kind === "stroke" ? 0 : -12)) * Math.PI) / 180);
  gl.uniform1f(at("bend"), options.bend ?? 0);
  gl.uniform1f(at("streaks"), Math.min(Math.max(options.streaks ?? 0, 0), 1));
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("color"), rgb(options.color ?? "#161314"));
  const duration = Math.max(options.duration ?? (kind === "stroke" ? 1 : 1.3), 0);
  const uSize = at("size");
  const uPixel = at("pixel");
  const uLine = at("line");
  const uWidth = at("width");
  const uProgress = at("progress");
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uPixel, canvas.width / Math.max(canvas.clientWidth, 1));
      // Shares of the height become units of the shorter side; y runs up in the shader.
      const tall = canvas.height / Math.min(canvas.width, canvas.height);
      if (kind === "stroke") {
        gl.uniform1f(uLine, 0);
        gl.uniform1f(uWidth, options.thickness ?? 0.3);
      } else {
        gl.uniform1f(uLine, -(options.offset ?? (kind === "edge" ? 0.2 : 0)) * tall);
        gl.uniform1f(uWidth, (options.thickness ?? 0.6) * tall);
      }
      gl.uniform1f(uProgress, duration > 0 ? seconds / duration : 1);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Paints `image` in with a wide flat brush once it scrolls into view, leaving a brushed edge, or a
 * single brushed band, that stays. The image must fill a positioned parent: the brush runs on a canvas
 * laid over it, which keeps the last frame and redraws on a resize. Reduced motion shows the finished
 * cut; without WebGL, or if the image fails to load, the image shows as it is. Returns the cleanup,
 * which also puts the image back.
 */
export function hakeIn(image: HTMLImageElement, options: HakeCutOptions = {}): () => void {
  const surface = overlayCanvas(image);
  const show = (): void => {
    image.style.visibility = "";
  };
  let stop = (): void => undefined;
  let cancelled = false;
  surface.addEventListener("webglcontextlost", show);
  // Hidden from the start: the brush paints the picture in, so it must not show whole first.
  image.style.visibility = "hidden";
  image.decode().then(
    () => {
      if (cancelled) return;
      stop = playCanvas(
        surface,
        () => {
          const painter = hakePainter(surface, options.shape === "band" ? "band" : "edge", options, image);
          if (!painter) show();
          return painter;
        },
        options.delay ?? 0,
      );
    },
    show,
  );
  return () => {
    cancelled = true;
    stop();
    surface.remove();
    show();
  };
}

/**
 * Drags a wide flat brush loaded with `options.color` across `canvas` once it scrolls into view. Size the
 * canvas with CSS; the stroke runs through its middle. The last frame stays, and a resize redraws it.
 * Reduced motion shows the finished stroke; no WebGL draws nothing. Returns the cleanup.
 */
export function paintHake(canvas: HTMLCanvasElement, options: HakeStrokeOptions = {}): () => void {
  return playCanvas(canvas, () => hakePainter(canvas, "stroke", options), options.delay ?? 0);
}
