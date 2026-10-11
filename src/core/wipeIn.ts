import { onceInView, playClock, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { rgb, type Hex } from "./splatShader.js";
import { fitCanvas, linkProgram, uploadTexture } from "./webgl.js";
import { WIPE_FRAGMENT, WIPE_VERTEX } from "./wipeGlsl.js";

/** Where ink lands, as shares of the image (y down), and when, as a share of the run. */
export type Blot = readonly [x: number, y: number, start: number];

export interface WipeOptions {
  /** An image in the same box that the ink wipes away. Without it the image wipes in from nothing. */
  readonly from?: HTMLImageElement | undefined;
  /** Up to three. Default one in the middle. */
  readonly blots?: readonly Blot[] | undefined;
  /** The ink at the spreading edge. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Changes the shape of the bloom. Default 1. */
  readonly seed?: number | undefined;
  /** Seconds. Default 1.8. */
  readonly duration?: number | undefined;
  /** Seconds to wait after the image scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/**
 * Uniforms for the blots on a canvas `aspect` times as wide as high: each front moves fast enough to
 * pass its farthest corner, warp and all, by the end of the run.
 */
export function blotUniforms(blots: readonly Blot[], aspect: number): Float32Array {
  const packed = new Float32Array(12);
  blots.slice(0, 3).forEach(([x, y, start], i) => {
    const corners = [[0, 0], [aspect, 0], [0, 1], [aspect, 1]] as const;
    const reach = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x * aspect, cy - y))) + 0.225;
    packed.set([x, y, start, reach / Math.max(1 - start, 0.05)], i * 4);
  });
  return packed;
}

/** Returns null when WebGL or the shader is unavailable. Both images must have loaded. */
export function wipePainter(canvas: HTMLCanvasElement, to: HTMLImageElement, options: WipeOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const program = linkProgram(gl, WIPE_VERTEX, WIPE_FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  // Premultiplied, so the shader can mix colour and alpha together; flipped, so uv (0, 0) is bottom left.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.activeTexture(gl.TEXTURE1);
  uploadTexture(gl, to, gl.RGBA, true);
  if (options.from) {
    gl.activeTexture(gl.TEXTURE0);
    uploadTexture(gl, options.from, gl.RGBA, true);
  }
  gl.uniform1i(at("from"), 0);
  gl.uniform1i(at("to"), 1);
  gl.uniform1f(at("hasFrom"), options.from ? 1 : 0);
  gl.uniform1f(at("seed"), options.seed ?? 1);
  gl.uniform3fv(at("ink"), rgb(options.color ?? "#161314"));
  const duration = Math.max(options.duration ?? 1.8, 0);
  const blots = options.blots ?? [[0.5, 0.5, 0]];
  return {
    duration,
    draw(seconds) {
      fitCanvas(gl, canvas);
      const aspect = canvas.width / canvas.height;
      gl.uniform1f(at("aspect"), aspect);
      gl.uniform4fv(at("blots"), blotUniforms(blots, aspect));
      const t = duration > 0 ? Math.min(Math.max(seconds / duration, 0), 1) : 1;
      gl.uniform1f(at("progress"), 1 - (1 - t) ** 1.6);
      // The ink dries off the front over the last fifth of the run, leaving only the picture.
      gl.uniform1f(at("fade"), Math.max(0, (t - 0.8) / 0.2) ** 2);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Wipes `image` in under blooming ink once it scrolls into view, over `options.from` if given. The image
 * must fill a positioned parent: the ink runs on a canvas laid over it, which ends on the image's own
 * pixels and is then removed. Reduced motion, no WebGL or an image that fails to load shows the image.
 * Returns the cleanup, which also puts the image back.
 */
export function wipeIn(image: HTMLImageElement, options: WipeOptions = {}): () => void {
  const { from, delay = 0 } = options;
  const swap = (): void => {
    image.style.visibility = "";
    if (from) from.style.visibility = "hidden";
  };
  if (prefersReducedMotion()) {
    swap();
    return () => undefined;
  }
  const surface = document.createElement("canvas");
  surface.setAttribute("aria-hidden", "true");
  surface.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  let painter: CanvasPainter | null = null;
  let cancelled = false;
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page.
  const land = (): void => {
    swap();
    surface.remove();
    painter?.dispose();
    painter = null;
  };

  image.style.visibility = "hidden";
  image.after(surface);
  const stop = onceInView(image, () => {
    let cancelClock = (): void => undefined;
    Promise.all([image.decode(), from?.decode()]).then(() => {
      if (cancelled) return;
      painter = wipePainter(surface, image, options);
      if (!painter) {
        land();
        return;
      }
      // The canvas takes over from the `from` image on its first frame, so nothing flickers.
      painter.draw(0);
      if (from) from.style.visibility = "hidden";
      cancelClock = playClock(painter.duration, delay, (seconds) => painter?.draw(seconds), land);
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
