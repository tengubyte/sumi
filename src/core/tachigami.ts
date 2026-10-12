import { onceInView, overlayCanvas, playCanvas, playClock, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { SLASH_FRAGMENT } from "./tachigamiGlsl.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export interface SlashOptions {
  /**
   * `"rejoin"` (default): the halves part and close again, ending on the plain picture. `"apart"` leaves
   * them parted; `"fall"` lets the top half slip down the cut and fall away.
   */
  readonly mode?: "rejoin" | "apart" | "fall" | undefined;
  /** A point the cut passes through, as shares of the box (y down). Default the middle. */
  readonly through?: readonly [x: number, y: number] | undefined;
  /** The slash's direction in degrees: 0 left to right, positive climbs. Default 17. */
  readonly angle?: number | undefined;
  /** The ink of the stroke, the spray and the cut faces. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** A white core along the blade, for dark pages. Default false. */
  readonly glint?: boolean | undefined;
  /** Changes the stroke's streaks and the spray. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds. Default 1.6, or 2 for a fall. */
  readonly duration?: number | undefined;
  /** Seconds to wait after it scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

const MODES = { rejoin: 0, apart: 1, fall: 2 } as const;

/**
 * Returns null when WebGL or the shader is unavailable. `paint` gives the picture for a canvas of the
 * size it is passed, and is asked again when the canvas changes shape. It must have loaded.
 */
export function slashPainter(canvas: HTMLCanvasElement, paint: (width: number, height: number) => TexImageSource, options: SlashOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, SLASH_FRAGMENT);
  if (!at) return null;
  // Premultiplied, so the halves' edges blend cleanly; flipped, so texture coordinates match gl_FragCoord.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(at("image"), 0);
  const mode = options.mode ?? "rejoin";
  const angle = ((options.angle ?? 17) * Math.PI) / 180;
  const [tx, ty] = options.through ?? [0.5, 0.5];
  gl.uniform1f(at("mode"), MODES[mode]);
  gl.uniform1f(at("angle"), angle);
  gl.uniform3fv(at("color"), rgb(options.color ?? "#161314"));
  gl.uniform1f(at("glint"), options.glint === true ? 1 : 0);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  const duration = Math.max(options.duration ?? (mode === "fall" ? 2 : 1.6), 0.1);
  gl.uniform1f(at("seconds"), duration);
  const uSize = at("size");
  const uCenter = at("center");
  const uSpan = at("span");
  const uProgress = at("progress");
  let texture: WebGLTexture | null = null;
  return {
    duration,
    draw(seconds) {
      if (fitCanvas(gl, canvas) || !texture) {
        const [w, h] = [canvas.width, canvas.height];
        if (texture) gl.deleteTexture(texture);
        texture = uploadTexture(gl, paint(w, h), gl.RGBA, true);
        // The cut's point and its ends where it enters and leaves the canvas, in units of the shorter side.
        const m = Math.min(w, h);
        const [hx, hy] = [w / 2 / m, h / 2 / m];
        const c = [(tx - 0.5) * 2 * hx, (0.5 - ty) * 2 * hy] as const;
        const ends = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => (sx * hx - c[0]) * Math.cos(angle) + (sy * hy - c[1]) * Math.sin(angle)));
        gl.uniform2f(uSize, w, h);
        gl.uniform2f(uCenter, c[0], c[1]);
        gl.uniform2f(uSpan, Math.min(...ends), Math.max(...ends));
      }
      gl.uniform1f(uProgress, seconds / duration);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** A rejoined cut ends on the plain picture, so the canvas leaves and the image comes back. */
function slashOnce(image: HTMLImageElement, options: SlashOptions): () => void {
  if (prefersReducedMotion()) return () => undefined;
  const surface = overlayCanvas(image);
  let painter: CanvasPainter | null = null;
  let cancelled = false;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page.
  const land = (): void => {
    image.style.visibility = "";
    surface.remove();
    painter?.dispose();
    painter = null;
  };
  const stop = onceInView(image, () => {
    let cancelClock = (): void => undefined;
    image.decode().then(() => {
      if (cancelled) return;
      painter = slashPainter(surface, () => image, options);
      if (!painter) {
        land();
        return;
      }
      // The canvas takes over from the image on its first frame, which is the same picture.
      painter.draw(0);
      image.style.visibility = "hidden";
      cancelClock = playClock(painter.duration, options.delay ?? 0, (seconds) => painter?.draw(seconds), land);
    }, land);
    return () => {
      cancelClock();
    };
  });
  return () => {
    cancelled = true;
    stop();
    land();
  };
}

/** Parted or fallen halves are the finished look, so the canvas stays over the hidden image. */
function slashStays(image: HTMLImageElement, options: SlashOptions): () => void {
  const surface = overlayCanvas(image);
  const show = (): void => {
    image.style.visibility = "";
  };
  let stop = (): void => undefined;
  let cancelled = false;
  surface.addEventListener("webglcontextlost", show);
  image.decode().then(
    () => {
      if (cancelled) return;
      stop = playCanvas(
        surface,
        () => {
          const painter = slashPainter(surface, () => image, options);
          if (painter) image.style.visibility = "hidden";
          return painter;
        },
        options.delay ?? 0,
      );
    },
    () => undefined,
  );
  return () => {
    cancelled = true;
    stop();
    surface.remove();
    show();
  };
}

/**
 * Cuts `image` with one slash of the brush once it scrolls into view. The image must fill a positioned
 * parent: the cut runs on a canvas laid over it. Rejoined halves end on the plain image, which reduced
 * motion shows at once; parted or fallen halves stay, with reduced motion too. Without WebGL the image
 * shows as it is. Returns the cleanup, which also puts the image back.
 */
export function slashIn(image: HTMLImageElement, options: SlashOptions = {}): () => void {
  return (options.mode ?? "rejoin") === "rejoin" ? slashOnce(image, options) : slashStays(image, options);
}
