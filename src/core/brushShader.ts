import { fitCanvas, linkProgram, uploadTexture } from "./webgl.js";

/** Paints brush art onto a canvas up to `progress` (0 to 1) of its sweep. */
export interface InkBrush {
  draw(progress: number): void;
  dispose(): void;
}

const VERTEX = `
attribute vec2 corner;
varying vec2 uv;
void main() {
  uv = corner * 0.5 + 0.5;
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/**
 * Which way the stroke in the art travels, as a position along it (0 to 1) and a coordinate across it that
 * the bristle noise varies with.
 */
const SWEEPS = {
  // Clockwise on screen from the start angle (in turns past 3 o'clock), round the centre of the art.
  ring: `
  vec2 d = uv - 0.5;
  float along = fract(atan(-d.y, d.x) / 6.2831853 - start + 1.0);
  float across = length(d);`,
  // Left to right. Scaled so a band's bristle lines are about as fine as the ring's.
  line: `
  float along = uv.x;
  float across = uv.y * 0.2;`,
} as const;

export type Sweep = keyof typeof SWEEPS;

const fragment = (sweep: Sweep): string => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D art;
uniform float progress;
uniform float start;
varying vec2 uv;

// Sine-free hash: sin() of large numbers loses precision on some phone GPUs.
float hash(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

void main() {
  vec4 ink = texture2D(art, uv);
  ${SWEEPS[sweep]}
  // Noise that changes across the stroke but not along it, so each bristle line reaches its own
  // distance and the front frays like a brush instead of cutting straight.
  float bristle = 0.65 * noise(across * 420.0) + 0.35 * noise(across * 90.0 + 7.0);
  // The front runs past the end of the stroke, so by progress 1 the wet band has left the art and
  // the canvas matches the plain image the page swaps back to.
  float front = progress * 1.16 - 0.03 + (bristle - 0.5) * 0.05;
  float shown = 1.0 - smoothstep(front - 0.01, front, along);
  // Ink just laid down at the front is still wet, so it reads darker.
  float wet = smoothstep(front - 0.09, front, along) * shown;
  gl_FragColor = vec4(ink.rgb * (1.0 - 0.45 * wet), ink.a) * shown;
}`;

/**
 * Sets up the shader for a loaded `art` image. `startAngle` is where a ring's stroke starts, in degrees
 * clockwise from 3 o'clock. Returns null when WebGL or the shader is unavailable, so the caller keeps
 * showing the finished art instead.
 */
export function inkBrush(canvas: HTMLCanvasElement, art: HTMLImageElement, sweep: Sweep, startAngle = 0): InkBrush | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;

  const program = linkProgram(gl, VERTEX, fragment(sweep));
  if (!program) return null;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "corner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

  // Premultiplied, so the shader can fade colour and alpha together; flipped, so uv (0, 0) is bottom left.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const texture = uploadTexture(gl, art, gl.RGBA, true);
  const progress = gl.getUniformLocation(program, "progress");
  gl.uniform1f(gl.getUniformLocation(program, "start"), startAngle / 360);

  return {
    draw(value) {
      fitCanvas(gl, canvas);
      gl.uniform1f(progress, value);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    // Hands the GPU memory back as soon as the stroke has landed; the plain image shows after.
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
