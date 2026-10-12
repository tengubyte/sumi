import { IRODORI_FRAGMENT } from "./irodoriGlsl.js";
import { onceInView, overlayCanvas, playClock, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { rgb, type Hex } from "./splatShader.js";
import { coverProgram, drawCover, fitCanvas, uploadTexture } from "./webgl.js";
import type { Blot } from "./wipeIn.js";

export interface ColorOptions {
  /** Where colour starts, as shares of the picture (y down), and when, as a share of the run. Up to five. Default three. */
  readonly blooms?: readonly Blot[] | undefined;
  /** The wash's light: the paper. Default `#f5f1eb`. */
  readonly paper?: Hex | undefined;
  /** The wash's dark: the ink. Default `#161314` (sumi). */
  readonly ink?: Hex | undefined;
  /** Changes the shape of the blooms. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds. Default 2.6. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the picture scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

const BLOOMS: readonly Blot[] = [[0.3, 0.4, 0], [0.75, 0.6, 0.15], [0.5, 0.9, 0.3]];

/**
 * How far each bloom must grow on a canvas `aspect` times as wide as high, in units of its shorter side:
 * to the farthest point no other bloom is nearer to, plus the most its lobes pull the edge in.
 */
export function bloomReach(blooms: readonly Blot[], aspect: number): number {
  const [w, h] = aspect >= 1 ? [aspect, 1] : [1, 1 / aspect];
  let far = 0;
  for (let i = 0; i <= 20; i++) {
    for (let j = 0; j <= 20; j++) {
      const [x, y] = [(i / 20) * w, (j / 20) * h];
      far = Math.max(far, Math.min(...blooms.map(([bx, by]) => Math.hypot(x - bx * w, y - by * h))));
    }
  }
  return far / 0.72 + 0.08;
}

/** Returns null when WebGL or the shader is unavailable. The picture must have loaded. */
export function colorPainter(canvas: HTMLCanvasElement, picture: HTMLImageElement, options: ColorOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const at = coverProgram(gl, IRODORI_FRAGMENT);
  if (!at) return null;
  // Premultiplied, so transparent pixels stay clean; flipped, so texture coordinates match gl_FragCoord.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.activeTexture(gl.TEXTURE0);
  uploadTexture(gl, picture, gl.RGBA, true);
  gl.uniform1i(at("image"), 0);
  const blooms = (options.blooms ?? BLOOMS).slice(0, 5);
  const packed = new Float32Array(15);
  blooms.forEach(([x, y, start], i) => {
    packed.set([x, y, Math.min(Math.max(start, 0), 0.9)], i * 3);
  });
  gl.uniform3fv(at("blooms"), packed);
  gl.uniform1f(at("count"), blooms.length);
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.uniform3fv(at("paper"), rgb(options.paper ?? "#f5f1eb"));
  gl.uniform3fv(at("ink"), rgb(options.ink ?? "#161314"));
  const duration = Math.max(options.duration ?? 2.6, 0);
  const uSize = at("size");
  const uPixel = at("pixel");
  const uReach = at("reach");
  const uProgress = at("progress");
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uPixel, canvas.width / Math.max(canvas.clientWidth, 1));
      gl.uniform1f(uReach, bloomReach(blooms.length > 0 ? blooms : BLOOMS, canvas.width / canvas.height));
      gl.uniform1f(uProgress, duration > 0 ? seconds / duration : 1);
      drawCover(gl);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Colours `image` in once it scrolls into view: it shows as an ink wash, then colour seeps out from wet
 * blooms until the picture is whole. The image must fill a positioned parent: the colour runs on a canvas
 * laid over it, which ends on the image's own pixels and is then removed. Until then the browser greys
 * the image. Reduced motion, no WebGL or an image that fails to load shows the image. Returns the
 * cleanup, which also puts the image back.
 */
export function colorIn(image: HTMLImageElement, options: ColorOptions = {}): () => void {
  if (prefersReducedMotion()) return () => undefined;
  const filter = image.style.filter;
  const surface = overlayCanvas(image);
  let painter: CanvasPainter | null = null;
  let cancelled = false;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page.
  const land = (): void => {
    image.style.visibility = "";
    image.style.filter = filter;
    surface.remove();
    painter?.dispose();
    painter = null;
  };
  image.style.filter = `${filter} grayscale(1)`.trim();
  const stop = onceInView(image, () => {
    let cancelClock = (): void => undefined;
    image.decode().then(() => {
      if (cancelled) return;
      painter = colorPainter(surface, image, options);
      if (!painter) {
        land();
        return;
      }
      // The canvas takes over from the greyed image on its first frame, so nothing flickers.
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
