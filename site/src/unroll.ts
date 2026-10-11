import { fitCanvas, linkProgram, uploadTexture } from "../../src/core/webgl";

/** Draws the ensō bent by `bend`: 1 is the ring as painted, 0 the stroke laid straight. */
export interface Unroller {
  draw(bend: number): void;
  dispose(): void;
}

// The stroke's start, sweep and radii in the 560 px ensō art, as scripts/brush-band.py on tengubyte.io cuts it.
const START = -0.0698;
const SPAN = 6.2134;
const R_IN = 140;
const R_OUT = 292;
const MID = (R_IN + R_OUT) / 2;
// The ensō's stroke is centred on 9 o'clock; straight, it lies level.
const TURN = -1.6755;

// The stroke keeps its length while it straightens: an arc whose angle shrinks from the ring's to zero.
// s runs along it, t across it (0 on the outer edge). Shared by the shader and the fitting below.
const ARC = `
vec2 arc(float s, float t, float bend) {
  float theta = max(${String(SPAN)} * bend, 1e-4);
  float rho = ${String(MID)}.0 * ${String(SPAN)} / theta;
  float phi = (s - 0.5) * theta;
  float r = rho + ${String(R_OUT)}.0 - t * ${String(R_OUT - R_IN)}.0 - ${String(MID)}.0;
  vec2 p = vec2(r * sin(phi), rho - r * cos(phi));
  float a = ${String(TURN)} * bend;
  return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
}`;

function arc(s: number, t: number, bend: number): [number, number] {
  const theta = Math.max(SPAN * bend, 1e-4);
  const rho = (MID * SPAN) / theta;
  const phi = (s - 0.5) * theta;
  const r = rho + R_OUT - t * (R_OUT - R_IN) - MID;
  const [x, y] = [r * Math.sin(phi), rho - r * Math.cos(phi)];
  const a = TURN * bend;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** The centre and size of the bent stroke, sampled along both edges. */
function bounds(bend: number): { cx: number; cy: number; w: number; h: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= 90; i++) {
    for (const t of [0, 1]) {
      const [x, y] = arc(i / 90, t, bend);
      xs.push(x);
      ys.push(y);
    }
  }
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

const VERTEX = `
attribute vec2 st;
uniform float bend;
uniform vec2 centre;
uniform vec2 scale;
varying vec2 vst;
${ARC}
void main() {
  vst = st;
  gl_Position = vec4((arc(st.x, st.y, bend) - centre) * scale * vec2(1.0, -1.0), 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D art;
varying vec2 vst;
void main() {
  float a = ${String(START)} + vst.x * ${String(SPAN)};
  float r = ${String(R_OUT)}.0 - vst.y * ${String(R_OUT - R_IN)}.0;
  gl_FragColor = texture2D(art, 0.5 + vec2(cos(a), sin(a)) * r / 560.0);
}`;

const SEGMENTS = 240;

export function unroller(canvas: HTMLCanvasElement, art: HTMLImageElement): Unroller | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false });
  if (!gl) return null;
  const program = linkProgram(gl, VERTEX, FRAGMENT);
  if (!program) return null;
  gl.useProgram(program);
  const strip: number[] = [];
  for (let i = 0; i <= SEGMENTS; i++) strip.push(i / SEGMENTS, 0, i / SEGMENTS, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(strip), gl.STATIC_DRAW);
  const st = gl.getAttribLocation(program, "st");
  gl.enableVertexAttribArray(st);
  gl.vertexAttribPointer(st, 2, gl.FLOAT, false, 0, 0);
  uploadTexture(gl, art, gl.RGBA, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const at = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  return {
    draw(bend) {
      fitCanvas(gl, canvas);
      // Follows the stroke as it changes shape, so it always fills the stage with a margin.
      const { cx, cy, w, h } = bounds(bend);
      const k = 0.9 * Math.min(canvas.clientWidth / w, canvas.clientHeight / h);
      gl.uniform1f(at("bend"), bend);
      gl.uniform2f(at("centre"), cx, cy);
      gl.uniform2f(at("scale"), (2 * k) / canvas.clientWidth, (2 * k) / canvas.clientHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, (SEGMENTS + 1) * 2);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
