import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * One brush slash across `image` along `angle` through `center`, then the halves part along the cut.
 * `mode` 0 closes them again, 1 leaves them apart, 2 lets the top half slip down the cut, tip over and
 * fall away. Lengths are in units of the canvas's shorter side, from its middle, y up. Expects a
 * premultiplied, flipped texture.
 */
export const SLASH_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float progress;
uniform float seconds;
uniform float seed;
uniform float mode;
uniform vec2 center;
uniform float angle;
uniform vec2 span;
uniform vec3 color;
uniform float glint;
uniform sampler2D image;
${NOISE_GLSL}
vec4 picture(vec2 p) {
  float m = min(size.x, size.y);
  vec2 frag = p * m + size * 0.5;
  if (frag.x < 0.0 || frag.y < 0.0 || frag.x > size.x || frag.y > size.y) return vec4(0.0);
  return texture2D(image, frag / size);
}
// A blade's cut is straight to the eye but not ruled: a hair of wander along it.
float cut(float u) {
  return 0.0016 * (noise2(vec2(u * 55.0, seed)) - 0.5);
}
vec4 over(vec4 top, vec4 under) {
  return top + under * (1.0 - top.a);
}
void main() {
  float m = min(size.x, size.y);
  float aa = 1.2 / m;
  vec2 p = (gl_FragCoord.xy - size * 0.5) / m;
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 n = vec2(-dir.y, dir.x);
  vec2 q = p - center;
  float t = clamp01(progress);

  // The slash crosses in the first seventh of the run, fastest at the start.
  float st = clamp01(t / 0.14);
  float head = mix(span.x - 0.08, span.y + 0.08, 1.0 - (1.0 - st) * (1.0 - st));

  float open = smoothstep(0.17, 0.5, t);
  float close = mode < 0.5 ? smoothstep(0.66, 0.94, t) : 0.0;
  float slide = 0.045 * open * (1.0 - close);
  float gap = 0.01 * open * (1.0 - close);
  vec2 offA = slide * dir + gap * n;
  vec2 offB = -slide * dir - gap * n;
  float spin = 0.0;
  vec2 pivot = vec2(0.0);
  float shade = 0.0;
  vec2 lifted = vec2(0.0);
  if (mode > 1.5) {
    // The cut top sticks for a beat, slips down the slope of the cut gathering speed, then, once its
    // weight is past the cut, drops and tips over its leading edge.
    vec2 down = dir.y > 0.0 ? -dir : dir;
    float T = max(t - 0.2, 0.0) * seconds;
    float slip = max(T - 0.08, 0.0);
    float drop = max(T - 0.34, 0.0);
    offA = down * 0.55 * slip * slip + vec2(0.0, -1.7 * drop * drop) + n * 0.006 * open;
    offB = vec2(0.0);
    spin = -sign(down.x) * min(1.5 * drop * drop, 1.2);
    pivot = n * 0.22;
    // It lifts off the page as it goes, so its shadow parts from it.
    shade = 0.3 * smoothstep(0.0, 0.25, slip) * (1.0 - smoothstep(0.4, 1.0, drop));
    lifted = vec2(0.012, -0.02) * smoothstep(0.0, 0.4, slip) + vec2(0.02, -0.03) * smoothstep(0.0, 0.6, drop);
  }

  // The top half turns by spin about pivot and moves by offA; sample it where it came from.
  float cs = cos(spin);
  float sn = sin(spin);
  vec2 qa = q - offA - pivot;
  qa = vec2(cs * qa.x + sn * qa.y, -sn * qa.x + cs * qa.y) + pivot;
  vec2 qb = q - offB;
  float va = dot(qa, n) - cut(dot(qa, dir));
  float vb = dot(qb, n) - cut(dot(qb, dir));
  vec4 a = picture(center + qa) * smoothstep(-aa, aa, va) * (1.0 - smoothstep(0.93, 1.0, t) * step(1.5, mode));
  vec4 b = picture(center + qb) * smoothstep(aa, -aa, vb);
  if (shade > 0.0) {
    // A soft shadow: the falling half's shape, offset and blurred over four taps.
    float sh = 0.0;
    for (int k = 0; k < 4; k++) {
      vec2 o = 0.006 * vec2(k < 2 ? -1.0 : 1.0, mod(float(k), 2.0) < 1.0 ? -1.0 : 1.0);
      vec2 qs = q - lifted - o - offA - pivot;
      qs = vec2(cs * qs.x + sn * qs.y, -sn * qs.x + cs * qs.y) + pivot;
      sh += picture(center + qs).a * smoothstep(-aa, aa, dot(qs, n) - cut(dot(qs, dir)));
    }
    sh *= 0.25 * shade;
    b = vec4(0.0, 0.0, 0.0, sh) + b * (1.0 - sh);
  }
  // Ink soaks into both cut faces once they part, and fades as the seam closes.
  float rimA = (1.0 - smoothstep(0.0, 0.007, va)) * open * (1.0 - close);
  float rimB = (1.0 - smoothstep(0.0, 0.007, -vb)) * open * (1.0 - close);
  a.rgb = mix(a.rgb, color * a.a, 0.75 * rimA);
  b.rgb = mix(b.rgb, color * b.a, 0.75 * rimB);
  // At rest the halves meet with edge weights that sum to one, so they add. A falling half can pass
  // over the one left behind, so then it goes on top.
  vec4 col = mode > 1.5 ? mix(a + b, over(a, b), open) : a + b;

  // The stroke: in to a point, full through the middle, dry and flicking off at the end.
  float u = dot(q, dir);
  float v = dot(q, n) - cut(u);
  float x = (u - span.x) / max(span.y - span.x, 0.001);
  float w = 0.004 + 0.02 * smoothstep(-0.02, 0.18, x) * (1.0 - 0.8 * smoothstep(0.7, 1.02, x));
  float streak = 0.55 * noise2(vec2(u * 3.0, v * m / 2.6) + seed * 5.0) + 0.45 * noise2(vec2(u * 9.0, v * m / 1.4) + seed);
  float dry = smoothstep(0.55, 1.0, x) * 0.55 + smoothstep(0.85, 1.0, abs(v) / w) * 0.4;
  float body = smoothstep(w, w - aa, abs(v)) * smoothstep(dry - 0.05, dry + 0.05, streak);
  float reached = smoothstep(0.0, aa * 2.0, head - u);
  float stroke = body * reached * (1.0 - smoothstep(0.16, 0.34, t));
  col = over(vec4(color * stroke, stroke), col);

  // Ink flung off the blade: drops leave as the head passes, carry on along the cut and slow.
  float drops = 0.0;
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float h1 = hash2(vec2(fi, seed));
    float h2 = hash2(vec2(fi + 7.1, seed));
    float h3 = hash2(vec2(fi + 3.3, seed + 1.0));
    float h4 = hash2(vec2(fi + 9.7, seed + 2.0));
    float x0 = 0.25 + 0.8 * h1;
    float born = 0.14 * (1.0 - sqrt(1.0 - clamp01(x0)));
    float age = (t - born) * seconds;
    if (age < 0.0) continue;
    vec2 vel = dir * (0.25 + 0.6 * h2) + n * (h3 - 0.5) * 0.35;
    vec2 at = dir * mix(span.x, span.y, x0) + vel * (1.0 - exp(-4.0 * age)) / 4.0 + vec2(0.0, -0.05 * age * age);
    float r = (0.0025 + 0.007 * h4 * h4) * (1.0 - 0.4 * clamp01(age));
    drops = max(drops, smoothstep(aa, -aa, length(q - at) - r) * (1.0 - smoothstep(0.45, 0.75, t)));
  }
  col = over(vec4(color * drops, drops), col);

  // A white core along the blade, for dark pages.
  float shine = exp(-abs(v) * m / 1.6) * (smoothstep(0.1, 0.15, t) - smoothstep(0.17, 0.4, t)) * reached * glint;
  col += vec4(vec3(shine), shine);
  gl_FragColor = clamp(col, 0.0, 1.0);
}`;
