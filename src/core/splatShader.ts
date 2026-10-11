import { SPLAT_FRAGMENT, SPLAT_VERTEX } from "./splatGlsl.js";
import { fitCanvas, linkProgram } from "./webgl.js";

/** A colour as `#rrggbb`. */
export type Hex = `#${string}`;

export interface SplatShape {
  /** Changes every finger, bead and droplet. Default 3.7. */
  readonly seed?: number | undefined;
  /** Direction the ink travels, in degrees clockwise from pointing right. Default 160 (left and a little down). */
  readonly angle?: number | undefined;
  /** Where the pool lands, as a share of the canvas width. Above 1 puts it past the right edge. Default 1.04. */
  readonly x?: number | undefined;
  /** Where the pool lands, as a share of the canvas height. Default 0.3. */
  readonly y?: number | undefined;
  /** Pool radius as a share of the canvas width. Default 0.12. */
  readonly size?: number | undefined;
  /** The splat's ink. Default `#d8001a`. */
  readonly color?: Hex | undefined;
  /** A smaller splat under the first, or null for none. Default `#161314` (sumi). */
  readonly underColor?: Hex | null | undefined;
  /** How much mist the throw leaves, 0 to 1. Default 0.55. */
  readonly mist?: number | undefined;
}

/** Draws the splat `time` seconds after it hits; it has fully landed by SPLAT_SECONDS. */
export interface SplatPainter {
  draw(time: number): void;
  dispose(): void;
}

export const SPLAT_SECONDS = 2.2;

const rad = (deg: number): number => (deg * Math.PI) / 180;

/** `#rrggbb` as 0 to 1 channels; anything else reads as black. */
export function rgb(hex: Hex): [number, number, number] {
  const n = /^#[0-9a-f]{6}$/i.test(hex) ? parseInt(hex.slice(1), 16) : 0;
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// The shapes were tuned with a 44 px pool; everything scales from that.
export function splatUniforms(width: number, height: number, shape: SplatShape): Record<string, number[]> {
  const { seed = 3.7, angle = 160, x = 1.04, y = 0.3, size = 0.12, underColor = "#161314", mist = 0.55 } = shape;
  const radius = size * width;
  const unit = radius / 44;
  const turn = rad(angle);
  const cx = x * width;
  const cy = y * height;
  // The second splat lands a little behind the first and turns a little further.
  const back = rad(angle - 160);
  const bx = 10 * unit * Math.cos(back) + 8 * unit * Math.sin(back);
  const by = 10 * unit * Math.sin(back) - 8 * unit * Math.cos(back);
  return {
    R0: [cx, cy, turn, radius],
    R1: [seed, 2.4, 12],
    R2: [16, 0.9, 1.3, 0.06],
    K0: underColor === null ? [0, 0, 0, 0] : [cx + bx, cy + by, turn + rad(6), unit * 26],
    K1: [seed * 2.19, 2, 8],
    K2: [6, 0.7, 1.1, 0],
    M0: [cx, cy, turn, 0.55],
    M1: [330 * unit, 9, Math.min(Math.max(mist, 0), 1), 0.05],
  };
}

/** Returns null when WebGL or the shader is unavailable. */
export function splatPainter(canvas: HTMLCanvasElement, shape: SplatShape = {}): SplatPainter | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;
  const program = linkProgram(gl, SPLAT_VERTEX, SPLAT_FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  // One triangle covering the viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  const ink = rgb(shape.color ?? "#d8001a");
  gl.uniform3fv(at("ink"), ink);
  // Single-colour mist specks fall back to the main ink.
  gl.uniform3fv(at("under"), shape.underColor === null ? ink : rgb(shape.underColor ?? "#161314"));
  return {
    draw(time) {
      fitCanvas(gl, canvas);
      gl.uniform2f(at("res"), canvas.width, canvas.height);
      gl.uniform2f(at("size"), canvas.clientWidth, canvas.clientHeight);
      gl.uniform1f(at("time"), time);
      for (const [name, value] of Object.entries(splatUniforms(canvas.clientWidth, canvas.clientHeight, shape))) {
        if (value.length === 3) gl.uniform3fv(at(name), value);
        else gl.uniform4fv(at(name), value);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
