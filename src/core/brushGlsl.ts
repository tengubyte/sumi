/** Places the ribbon from art units into the view box (x, y, width, height), y down. */
export const BRUSH_VERTEX = `
attribute vec2 pos;
attribute float along;
attribute float across;
attribute float radius;
attribute vec2 ends;
uniform vec4 view;
varying float vAlong;
varying float vAcross;
varying float vRadius;
varying vec2 vEnds;
void main() {
  vAlong = along;
  vAcross = across;
  vRadius = radius;
  vEnds = ends;
  vec2 p = (pos - view.xy) / view.zw;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

/**
 * One stroke up to the brush head at `front`. Along the stroke: a frayed, rounded head, dry gaps that
 * grow toward the end, and a little bleed into the paper. Across it: bristle lines that converge where
 * the stroke tapers. Lengths are in art units; `base` is the brush radius and `px` one device pixel.
 */
export const BRUSH_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float front;
uniform float total;
uniform float base;
uniform float px;
uniform float seed;
uniform float dryness;
uniform float dryGrow;
uniform float bristles;
uniform float bleed;
uniform vec3 ink;
varying float vAlong;
varying float vAcross;
varying float vRadius;
varying vec2 vEnds;

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
  // Past either end of a piece the shape is a round cap, which the reveal counts as part of that end.
  float over = min(vEnds.x, 0.0) + min(vEnds.y, 0.0);
  float a = vAlong - min(vEnds.x, 0.0) + min(vEnds.y, 0.0);
  float r = length(vec2(over, vAcross));
  float A = a / base;
  float side = step(0.0, vAcross) * 17.0;
  float w = vRadius * (1.0 + 0.08 * (noise(A * 0.7 + seed + side) - 0.5) + 0.06 * (noise(A * 4.0 + seed * 3.0 + side) - 0.5));
  float v = clamp(vAcross / max(vRadius, 1e-3), -1.0, 1.0);

  // Bristle lines reach their own distance past the head, so it frays instead of cutting straight.
  float b = 0.65 * noise(v * bristles + seed * 7.0) + 0.35 * noise(v * bristles * 0.31 + seed * 13.0);
  float f = front + (b - 0.5) * base * 0.9;
  float head = f - vRadius + vRadius * sqrt(max(1.0 - v * v, 0.0));
  float shown = 1.0 - smoothstep(head - px, head + px, a);

  float t = clamp(a / total, 0.0, 1.0);
  float dry = dryness + dryGrow * t * t;
  dry += 0.35 * dry * smoothstep(0.5, 1.0, abs(v));
  // Dry gaps are streaks a couple of radii long, not lines the whole length of the stroke.
  float g = 0.5 * noise(v * bristles * 1.7 + seed * 5.0) + 0.5 * noise(A * 0.5 + v * bristles * 0.6 + seed);
  float kasure = smoothstep(dry - 0.05, dry + 0.05, g);
  // Ink pools at the edges as the water soaks in, and the body is never one flat tone.
  float tone = (0.94 + 0.06 * smoothstep(0.6, 1.0, abs(v))) * (0.94 + 0.06 * noise(A * 1.6 + v * 23.0 + seed));

  float body = smoothstep(w + px, w - px, r) * kasure * tone;
  // Bleed only in patches, where the paper took up more water.
  float halo = bleed * smoothstep(w * 1.3 + px, w, r) * smoothstep(0.3, 0.75, noise(A * 0.6 + seed * 2.0 + side)) * (1.0 - min(dry, 1.0));
  float alpha = max(body, halo) * shown;
  if (alpha <= 0.002) discard;
  gl_FragColor = vec4(ink * alpha, alpha);
}`;
