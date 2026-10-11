export const WIPE_VERTEX = `
attribute vec2 corner;
varying vec2 uv;
void main() {
  uv = corner * 0.5 + 0.5;
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/**
 * Ink blooms from up to three blots and leaves `to` behind it, over `from` or over nothing. Each front is
 * a distance plus domain-warped noise, so it spreads unevenly with feathered fibres. Pigment rides the
 * water to the edge: the front is darkest and the wash thins behind it, then `fade` dries the ink away.
 */
export const WIPE_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D from;
uniform sampler2D to;
uniform float hasFrom;
uniform float progress;
uniform float fade;
uniform float aspect;
uniform float seed;
uniform vec3 ink;
// Each blot: x, y (shares of the image, y down), when it starts (0 to 1), how fast its front moves.
uniform vec4 blots[3];
varying vec2 uv;

float hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise2(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(uv.x * aspect, 1.0 - uv.y);
  vec2 q = p * 2.6 + seed;
  vec2 w = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
  float warp = fbm(q + 2.4 * w);
  float fibre = fbm(p * 22.0 + seed * 3.0);
  float wet = 0.0;
  float rim = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 b = blots[i];
    if (b.w <= 0.0) continue;
    float field = length(p - vec2(b.x * aspect, b.y)) + (warp - 0.5) * 0.35 + (fibre - 0.5) * 0.05;
    float front = max(progress - b.z, 0.0) * b.w;
    float inside = smoothstep(front + 0.004, front - 0.004, field);
    float depth = max(front - field, 0.0);
    wet = max(wet, inside);
    rim = max(rim, inside * (0.9 * exp(-depth / 0.035) + 0.25 * exp(-depth / 0.175)));
  }
  vec4 before = hasFrom > 0.5 ? texture2D(from, uv) : vec4(0.0);
  vec4 c = mix(before, texture2D(to, uv), wet);
  float a = clamp(rim, 0.0, 1.0) * (1.0 - fade);
  gl_FragColor = vec4(c.rgb * (1.0 - a) + ink * a, c.a * (1.0 - a) + a);
}`;
