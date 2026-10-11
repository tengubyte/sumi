import { HINOKO_FRAGMENT, HINOKO_VERTEX } from "./hinokoGlsl.js";
import { playCanvas, prefersReducedMotion, type CanvasPainter } from "./play.js";
import { random } from "./random.js";
import { fitCanvas, linkProgram } from "./webgl.js";

export interface EmberOptions {
  /** How many embers are in the air at once. Default 120, at most 400. */
  readonly count?: number | undefined;
  /** One burst from `from` that dies down, instead of a fire that keeps going. Default false. */
  readonly burst?: boolean | undefined;
  /** Where the embers leave from, as shares of the canvas (y down). Default `[0.5, 1]`, the bottom edge. */
  readonly from?: readonly [x: number, y: number] | undefined;
  /** The share of the width they leave across. Default 1, or 0.1 for a burst. */
  readonly spread?: number | undefined;
  /** Sideways drift, -1 (left) to 1 (right). Default 0.15. */
  readonly wind?: number | undefined;
  /** The share that are flakes of ash. Default 0.1. */
  readonly ash?: number | undefined;
  /** Changes every ember's path. Default 1. */
  readonly seed?: number | undefined;
  /** 2 runs twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Seconds a burst takes at speed 1: the last ember leaves by 0.7 s and is gone 5 s later. */
export const BURST_SECONDS = 6;

const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]] as const;

/** Six vertices per ember, each its index and a quad corner. */
export function emberVertices(count: number): Float32Array {
  const n = Math.min(Math.max(Math.floor(count), 0), 400);
  return Float32Array.from({ length: n * 18 }, (_, i) => {
    const [x, y] = CORNERS[Math.floor(i / 3) % 6] ?? [0, 0];
    return [Math.floor(i / 18), x, y][i % 3] ?? 0;
  });
}

/** Returns null when WebGL or the shaders are unavailable. Light adds up, so it suits a dark page. */
export function emberPainter(canvas: HTMLCanvasElement, options: EmberOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const program = linkProgram(gl, HINOKO_VERTEX, HINOKO_FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  const vertices = emberVertices(options.count ?? 120);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const vert = gl.getAttribLocation(program, "vert");
  gl.enableVertexAttribArray(vert);
  gl.vertexAttribPointer(vert, 3, gl.FLOAT, false, 0, 0);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  const burst = options.burst === true;
  const [x, y] = options.from ?? [0.5, 1];
  gl.uniform1f(at("burst"), burst ? 1 : 0);
  gl.uniform2f(at("source"), x, 1 - y);
  gl.uniform1f(at("spread"), options.spread ?? (burst ? 0.1 : 1));
  gl.uniform1f(at("wind"), Math.min(Math.max(options.wind ?? 0.15, -1), 1) * 0.15);
  gl.uniform1f(at("ashShare"), Math.min(Math.max(options.ash ?? 0.1, 0), 1));
  gl.uniform1f(at("seed"), random(options.seed ?? 1)() * 50);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uPixel = at("pixel");
  const uTime = at("time");
  return {
    duration: burst ? BURST_SECONDS / speed : Infinity,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uPixel, canvas.width / Math.max(canvas.clientWidth, 1));
      gl.uniform1f(uTime, seconds * speed);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * Runs a painter from `create` only while the canvas is on screen, so a fire off screen costs nothing. The
 * WebGL context opens the first time the canvas shows. Returns the cleanup, which releases it.
 */
function loopInView(canvas: HTMLCanvasElement, create: () => CanvasPainter | null, delay: number): () => void {
  let painter: CanvasPainter | null = null;
  let request = 0;
  let last = 0;
  let seconds = -delay;
  let running = false;
  const tick = (now: number): void => {
    // A long gap, such as a background tab, moves the clock on by a frame, not by the whole gap.
    seconds += Math.min((now - last) / 1000, 0.1);
    last = now;
    painter?.draw(Math.max(seconds, 0));
    request = requestAnimationFrame(tick);
  };
  // Chrome paints a canvas whose WebGL context was released as a white box, so the canvas leaves the page too.
  const stop = (): void => {
    observer.disconnect();
    cancelAnimationFrame(request);
    canvas.hidden = true;
    painter?.dispose();
    painter = null;
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    if (visible && !running) {
      painter ??= create();
      if (!painter) {
        stop();
        return;
      }
      last = performance.now();
      request = requestAnimationFrame(tick);
    }
    if (!visible) cancelAnimationFrame(request);
    running = visible;
  });
  canvas.hidden = false;
  canvas.addEventListener("webglcontextlost", stop);
  observer.observe(canvas);
  return () => {
    canvas.removeEventListener("webglcontextlost", stop);
    stop();
  };
}

/**
 * Sends embers up `canvas`, for a dark page: a fire that keeps going while the canvas is on screen, or with
 * `burst` a single burst once it scrolls into view. Size the canvas with CSS and lay it over whatever burns.
 * Reduced motion shows nothing, and so does no WebGL. Returns the cleanup.
 */
export function riseEmbers(canvas: HTMLCanvasElement, options: EmberOptions = {}): () => void {
  if (options.burst === true) return playCanvas(canvas, () => emberPainter(canvas, options), options.delay ?? 0);
  if (prefersReducedMotion()) return () => undefined;
  return loopInView(canvas, () => emberPainter(canvas, options), options.delay ?? 0);
}
