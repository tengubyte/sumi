import { NOISE_GLSL } from "./noiseGlsl.js";

/** The divider's timeline in seconds: the second band has settled by 1.4. */
export const BAND_SECONDS = 1.4;
/** The transition's timeline in seconds: every band at rest, the page hidden, at 0.95; all gone by 1.9. */
export const COVERED_AT = 0.95;
export const MIST_SECONDS = 1.9;

const KASUMI_GLSL = `
precision highp float;
uniform vec2 size;
uniform float css;
uniform float time;
uniform float seed;
${NOISE_GLSL}
float easeOut(float x) { x = clamp01(x); return 1.0 - (1.0 - x) * (1.0 - x) * (1.0 - x); }
float easeIn(float x) { x = clamp01(x); return x * x * x; }
float smin(float a, float b, float k) { float h = clamp01(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }

// A flat stroke from x0 to x1 along the line y = cy, rounded at both ends.
float seg(vec2 p, float x0, float x1, float cy, float rr) {
  return length(vec2(max(max(x0 - p.x, p.x - x1), 0.0), p.y - cy)) - rr;
}

// Negative inside one band: three strokes stacked, their ends out of line, so each end steps in as rounded
// lobes. cy is the centre line, hh the half height, xc the centre and len the length.
float band(vec2 p, float cy, float hh, float xc, float len, float s) {
  float rr = hh * 0.45;
  float l = xc - len * 0.5;
  float r = xc + len * 0.5;
  vec4 h = vec4(hash2(vec2(s, 4.0)), hash2(vec2(s, 5.0)), hash2(vec2(s, 6.0)), hash2(vec2(s, 7.0)));
  float d = seg(p, l, r, cy, rr);
  d = smin(d, seg(p, l + hh * (0.8 + 2.4 * h.x), r + hh * (0.9 - 2.6 * h.y), cy - hh * 0.5, rr), rr * 0.6);
  d = smin(d, seg(p, l - hh * (0.9 - 2.6 * h.z), r - hh * (0.8 + 2.4 * h.w), cy + hh * 0.5, rr), rr * 0.6);
  return d + 0.003 * (noise2(p * 26.0 + s) - 0.5);
}

// Gold leaf laid in squares, each a shade apart, brighter where two overlap; fine creases in the leaf;
// sunago dust and kirihaku flakes gather near the edge; a darker rim; a slow sheen.
vec3 gold(vec2 p, float d, float s, float sheenAt) {
  vec2 g = p / 0.11;
  vec2 k = floor(g);
  vec2 f = fract(g);
  vec3 col = mix(vec3(0.76, 0.58, 0.25), vec3(0.9, 0.75, 0.42), 0.45 * hash2(k + s) + 0.55 * fbm(p * 4.0 + s));
  float joint = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * 0.11;
  col *= 1.0 + 0.07 * smoothstep(1.5 * css, 0.0, joint);
  col *= 0.96 + 0.08 * noise2(p * vec2(150.0, 50.0) + s);
  float near = smoothstep(0.07, 0.0, -d);
  vec2 kd = floor(p / (1.2 * css));
  float speck = step(0.985 - 0.12 * near, hash2(kd + s + 2.0));
  col = mix(col, hash2(kd + 9.0) > 0.85 ? vec3(0.55, 0.4, 0.15) : vec3(1.0, 0.9, 0.62), speck * 0.7);
  vec2 kk = floor(p / 0.018);
  vec2 fk = fract(p / 0.018) - 0.5;
  float flake = step(1.0 - 0.18 * near, hash2(kk + s + 5.0)) * step(max(abs(fk.x), abs(fk.y)), 0.22);
  col = mix(col, vec3(0.98, 0.85, 0.52), flake * 0.8);
  float sweep = p.x - p.y * 0.6 - sheenAt;
  col += vec3(1.0, 0.86, 0.55) * 0.18 * exp(-sweep * sweep / 0.05);
  float rim = smoothstep(3.0 * css, 1.0 * css, -d);
  return mix(col, vec3(0.45, 0.31, 0.1), 0.5 * rim);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size.y;
  float aspect = size.x / size.y;
  float px = 1.0 / size.y;
  vec4 acc = vec4(0.0);
#if COVER == 1
  const int N = 5;
#else
  const int N = 2;
#endif
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float s = seed + fi * 3.7;
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
#if COVER == 1
    // Five bands overlap enough to hide the page; their stepped ends only show on the way in and out, even
    // on a tall screen, since each band runs past both edges by more than its steps.
    float cy = (fi + 0.5) / 5.0 + 0.02 * (hash2(vec2(s, 1.0)) - 0.5);
    float hh = 0.15;
    float len = aspect * 1.7 + 8.0 * hh;
    float delay = 0.06 * fi;
    float rest = aspect * 0.5 + dir * 0.1 * (hash2(vec2(s, 2.0)) - 0.5);
    float off = len * 0.5 + aspect * 0.5 + 0.3;
    float inX = rest - dir * off * (1.0 - easeOut((time - delay) / 0.7));
    float xc = inX + dir * off * 1.6 * easeIn((time - ${String(COVERED_AT)} - delay) / 0.7);
#else
    float cy = 0.38 + fi * 0.26;
    float hh = 0.2;
    float len = aspect * 0.62;
    float delay = 0.15 * fi;
    float rest = aspect * 0.5 - dir * aspect * 0.12;
    float off = len * 0.5 + aspect * 0.5 + 0.3;
    float xc = rest - dir * off * (1.0 - easeOut((time - delay) / 1.2));
#endif
    float d = band(p, cy, hh, xc, len, s);
    float a = smoothstep(px, -px, d);
    if (a <= 0.0) continue;
    vec3 col = gold(p - vec2(xc, 0.0), d, s, time * 0.8 - 0.6);
    acc = vec4(col * a, a) + acc * (1.0 - a);
  }
  gl_FragColor = acc;
}`;

/**
 * Suyari-gasumi, the long gold cloud bands of picture scrolls. `cover` 1 lays five bands across the canvas
 * from alternating sides until nothing shows, then drifts them out the far side; 0 slides two bands in to
 * settle as a divider. `time` runs the timelines above. Distances are in units of the canvas height; the
 * dust and the rim in CSS px, `css` of the height each. Premultiplied.
 */
export const kasumiFragment = (cover: 0 | 1): string => `#define COVER ${String(cover)}\n${KASUMI_GLSL}`;
