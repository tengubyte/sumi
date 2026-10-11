import { marblePattern, marbleRows, marbleSeconds, type MarbleOp, type MarblePattern } from "./marble.js";
import { MARBLE_VERTEX, marbleFragment } from "./marbleGlsl.js";
import { playCanvas, type CanvasPainter } from "./play.js";
import { rgb, type Hex } from "./splatShader.js";
import { fitCanvas, linkProgram } from "./webgl.js";

export interface FloatOptions {
  /** A preset, laid out for the canvas's shape. Default "flow". */
  readonly pattern?: MarblePattern | undefined;
  /** Your own operations instead of a preset. The first 32 are drawn, or 28 on the smallest devices. */
  readonly ops?: readonly MarbleOp[] | undefined;
  /** The ink. Pale ink is the same colour, thinner. Default `#161314` (sumi). */
  readonly color?: Hex | undefined;
  /** The accent ring. Default `#d8001a`. */
  readonly accent?: Hex | undefined;
  /** Seconds to wait after the canvas scrolls into view. Default 0. */
  readonly delay?: number | undefined;
}

/** Floats ink on `canvas`'s water. Returns null when WebGL or the shader is unavailable. */
export function marblePainter(canvas: HTMLCanvasElement, options: FloatOptions = {}): CanvasPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  // Each operation takes two uniform vectors; the smallest devices allow 64 in a fragment shader.
  const limit = Number(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
  const max = Math.max(1, Math.min(32, Math.floor((limit - 8) / 2)));
  const program = linkProgram(gl, MARBLE_VERTEX, marbleFragment(max));
  if (!program) return null;
  gl.useProgram(program);
  // One triangle covering the viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  const ink = rgb(options.color ?? "#161314");
  gl.uniform4fv(at("colors"), [0, 0, 0, 0, ...ink, 0.9, ...ink, 0.42, ...rgb(options.accent ?? "#d8001a"), 0.9]);
  const ops = options.ops ?? marblePattern(options.pattern ?? "flow", canvas.clientWidth / canvas.clientHeight || 4 / 3);
  const uSize = at("size"), uCount = at("count"), uA = at("opA"), uB = at("opB");
  return {
    duration: marbleSeconds(ops) + 0.3,
    draw(seconds) {
      fitCanvas(gl, canvas);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      const { count, a, b } = marbleRows(ops, seconds, max);
      gl.uniform1i(uCount, count);
      gl.uniform4fv(uA, a);
      gl.uniform4fv(uB, b);
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
 * Suminagashi: ink dropped on water in rings, then pulled into flowing lines, once `canvas` scrolls into
 * view. Size the canvas with CSS. The last frame stays, and a resize redraws it. Reduced motion draws the
 * finished sheet; no WebGL draws nothing. Returns the cleanup, which releases the WebGL context.
 */
export function floatInk(canvas: HTMLCanvasElement, options: FloatOptions = {}): () => void {
  return playCanvas(canvas, () => marblePainter(canvas, options), options.delay ?? 0);
}
