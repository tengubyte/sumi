import { KINTSUGI_FRAGMENT, KINTSUGI_SECONDS } from "./kintsugiGlsl.js";
import { overlayCanvas, playCanvas, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";

export interface MendOptions {
  /** Where the blow lands, as shares of the picture (y down). Default `[0.45, 0.45]`. */
  readonly impact?: readonly [x: number, y: number] | undefined;
  /** Changes the cracks. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds from the blow until the sheen has crossed. Default 3.4. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the picture scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Returns null when WebGL or the shader is unavailable. The picture must have loaded. */
export function mendPainter(canvas: HTMLCanvasElement, picture: HTMLImageElement, options: MendOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, KINTSUGI_FRAGMENT);
  if (!at) return null;
  // Flipped, so texture coordinates match gl_FragCoord with (0, 0) at the bottom left.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, picture, gl.RGBA, false);
  gl.uniform1i(at("image"), 0);
  const [x, y] = options.impact ?? [0.45, 0.45];
  gl.uniform2f(at("impact"), x, y);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  const duration = Math.max(options.duration ?? KINTSUGI_SECONDS, 0);
  const [uSize, uCss, uTime] = [at("size"), at("css"), at("time")];
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uCss, canvas.width / Math.max(canvas.clientWidth, 1) / canvas.height);
      gl.uniform1f(uTime, duration > 0 ? (seconds / duration) * KINTSUGI_SECONDS : KINTSUGI_SECONDS);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Breaks `image` and mends it with gold once it scrolls into view: cracks run out from the blow, fill with
 * red lacquer, then gold, and a sheen crosses them. The image must fill a positioned parent: the mended
 * picture stays on a canvas laid over the hidden image, and a resize redraws it. Reduced motion shows it
 * mended; without WebGL the image shows as it is. Returns the cleanup, which also puts the image back.
 */
export function mendIn(image: HTMLImageElement, options: MendOptions = {}): () => void {
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
          const painter = mendPainter(surface, image, options);
          if (!painter) return null;
          // The whole picture is the first frame, so the canvas takes over from the image during a delay too.
          painter.draw(0);
          image.style.visibility = "hidden";
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
