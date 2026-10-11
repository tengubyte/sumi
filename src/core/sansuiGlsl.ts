export const SANSUI_VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/** The landscape's own clock runs for this many seconds at speed 1. */
export const SANSUI_SECONDS = 6.5;

/**
 * Five ridges, far to near, in a canvas one unit high (y down). Each is brushed left to right, then its
 * wash creeps down from the ridge and thins into mist; the mist drifts and settles by SANSUI_SECONDS.
 * Far ridges are pale soft silhouettes, near ones dark with a hard brush line. The sun spreads like
 * vermilion on damp paper, then bands of mist (kasumi) drift across it.
 */
export const SANSUI_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float sun;
uniform float mist;
uniform vec3 ink;
uniform vec3 sunColor;

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
float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = p * 2.07 + vec2(3.1, 7.7);
    a *= 0.5;
  }
  return v;
}
// Folded noise makes sharp crests and soft valleys, the shape a brush gives a ridge.
float ridge(float x, float s) {
  float v = 0.0;
  float a = 0.55;
  float f = 1.0;
  for (int i = 0; i < 5; i++) {
    float n = noise(x * f + s * 17.0 + float(i) * 3.1);
    v += a * pow(1.0 - abs(n * 2.0 - 1.0), 1.6);
    f *= 2.1;
    a *= 0.48;
  }
  return v;
}
float clamp01(float x) {
  return clamp(x, 0.0, 1.0);
}
float ease(float t) {
  return 1.0 - pow(1.0 - clamp01(t), 2.0);
}
// A mist band with rounded ends and frayed edges: 1 inside, 0 outside.
float band(vec2 p, float y, float xc, float halfLen, float h) {
  vec2 q = vec2(max(abs(p.x - xc) - halfLen, 0.0) / h, (p.y - y) / h);
  float d = length(q) + (fbm2(vec2(p.x * 7.0, p.y * 22.0) + y * 50.0) - 0.5) * 0.9;
  return smoothstep(1.1, 0.0, d);
}
// Vermilion on damp paper: it spreads from the middle to a feathered edge with soft pooling inside, then
// two mist bands drift across its lower half and veil it.
vec4 kasumiSun(vec2 p, vec2 c) {
  vec2 d = p - c;
  float r = length(d);
  float edge = 0.09 * (1.0 + 0.05 * (fbm2(d / max(r, 1e-4) * 1.6 + seed) - 0.5));
  float front = edge * ease(time / 1.4);
  float field = r + (fbm2(p * 55.0 + seed) - 0.5) * 0.01;
  float body = smoothstep(front + 0.009, front - 0.006, field);
  float fringe = smoothstep(front + 0.022, front, field) * 0.22 * fbm2(p * 90.0 + seed * 2.0);
  float pool = 0.8 + 0.2 * fbm2(p * 8.0 + seed * 3.0) - 0.1 * (fbm2(p * 26.0 + seed) - 0.5);
  float drift = 0.04 * ease((time - 0.8) / 4.0);
  float veil = max(band(p, c.y + 0.05, c.x - 0.05 + drift, 0.17, 0.045),
                   0.7 * band(p, c.y - 0.015, c.x + 0.1 + drift * 0.5, 0.06, 0.02));
  float a = clamp01(max(body * pool, fringe)) * 0.95 * (1.0 - 0.8 * veil * ease((time - 0.6) / 1.6));
  return vec4(sunColor * a, a);
}

void main() {
  float aspect = size.x / size.y;
  vec2 p = vec2(gl_FragCoord.x / size.y, 1.0 - gl_FragCoord.y / size.y);
  vec4 col = vec4(0.0);
  if (sun > 0.5) col = kasumiSun(p, vec2(aspect * 0.7, 0.27));
  float drift = 0.3 * ease(time / 6.5);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float depth = fi / 4.0;
    float y = 0.5 + 0.11 * fi - (0.3 - 0.035 * fi) * ridge(p.x * (1.1 + 0.55 * fi) / aspect * 1.6, seed + fi);
    float below = p.y - y;
    if (below < -0.02) continue;
    float t0 = 0.5 + fi * 0.5;
    // The ridge is brushed left to right first, then the wash creeps down from it.
    float drawn = clamp01((time - t0) / 0.9) * (aspect + 0.1) + (noise(p.y * 90.0 + fi * 13.0) - 0.5) * 0.04;
    float washed = clamp01((time - t0 - 0.35) / 1.5);
    float tone = mix(0.2, 0.9, depth);
    float lineW = mix(0.0018, 0.0055, depth) * (0.7 + 0.6 * noise(p.x * 12.0 + fi * 5.0));
    float dry = smoothstep(0.3, 0.5, fbm2(vec2(p.x * 26.0, fi * 7.0 + p.y * 40.0)));
    float stroke = smoothstep(lineW + 0.0012, lineW, abs(below)) * step(p.x, drawn) * mix(0.55, 1.0, dry);
    // Wash: darkest under the ridge and thinning downward, textured across the slope.
    float wash = exp(-max(below, 0.0) * mix(15.0, 6.0, depth));
    wash *= 0.8 + 0.35 * (fbm2(vec2(p.x * 24.0 - below * 16.0, below * 7.0) + fi * 11.0) - 0.5);
    wash *= step(0.0, below) * smoothstep(washed * 0.55, washed * 0.55 - 0.06, below) * step(p.x, drawn);
    float a = max(stroke * min(tone * 1.15, 1.0) * mix(0.3, 1.0, depth), wash * tone);
    float m = smoothstep(0.38, 0.72, fbm2(vec2(p.x * 1.6 + drift + fi * 3.0, p.y * 6.0)));
    a = clamp01(a * (1.0 - mist * m * smoothstep(0.015, 0.1, below)));
    col = vec4(ink * a, a) + col * (1.0 - a);
  }
  gl_FragColor = col;
}`;
