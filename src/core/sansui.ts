import { playCanvas, type CanvasPainter } from "./play.js";
import { SANSUI_FRAGMENT, SANSUI_SECONDS, SANSUI_VERTEX } from "./sansuiGlsl.js";
import { rgb, type Hex } from "./splatShader.js";
import { fitCanvas, linkProgram } from "./webgl.js";

export interface SansuiOptions {
  /** Changes every ridge. Default 3. */
  readonly seed?: number | undefined;
  /** A vermilion sun behind the far ridges, half veiled by mist bands. Default true. */
  readonly sun?: boolean | undefined;
  /** How much mist lies between the ridges, 0 to 1. Default 0.6. */
  readonly mist?: number | undefined;
  /** The ink. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** Default `#d8001a`. */
  readonly sunColor?: Hex | undefined;
  /** 2 paints twice as fast. Default 1. */
  readonly speed?: number | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Returns null when WebGL or the shader is unavailable. */
export function sansuiPainter(canvas: HTMLCanvasElement, options: SansuiOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const program = linkProgram(gl, SANSUI_VERTEX, SANSUI_FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  gl.uniform1f(at("seed"), options.seed ?? 3);
  gl.uniform1f(at("sun"), options.sun === false ? 0 : 1);
  gl.uniform1f(at("mist"), Math.min(Math.max(options.mist ?? 0.6, 0), 1));
  gl.uniform3fv(at("ink"), rgb(options.color ?? "#161314"));
  gl.uniform3fv(at("sunColor"), rgb(options.sunColor ?? "#d8001a"));
  const speed = Math.max(options.speed ?? 1, 0.05);
  const uSize = at("size");
  const uTime = at("time");
  return {
    duration: SANSUI_SECONDS / speed,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.uniform1f(uTime, Math.min(seconds * speed, SANSUI_SECONDS));
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
 * Paints an ink-wash landscape on `canvas` once it scrolls into view: ridges brushed in from far to near,
 * then the mist settles. Size the canvas with CSS; wide shapes suit it. The last frame stays, and a
 * resize redraws it. Reduced motion draws the finished landscape; no WebGL draws nothing. Returns the cleanup.
 */
export function paintSansui(canvas: HTMLCanvasElement, options: SansuiOptions = {}): () => void {
  return playCanvas(canvas, () => sansuiPainter(canvas, options), options.delay ?? 0);
}
