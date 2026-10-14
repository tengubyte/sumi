import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * Uniforms, washi fibres and the shapes InkDrop's top view draws ink with, in a canvas one unit high (y
 * down). Grounded in how ink lands: a drop that skids leaves its tail on the far side; spikes break into
 * beads about nine radii apart; the small satellites land first and furthest out; water wicks into the
 * fibres as roughly t^0.45 and carries a grey halo past the black.
 */
export const SPLATTER_GLSL = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform vec4 drops[3];
uniform vec3 colors[3];
// Radius as a share of the height, the way of travel in radians, and the seed.
uniform vec3 look;
${NOISE_GLSL}
const float TAU = 6.28318;

float expoOut(float x) { x = clamp01(x); return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x); }
float segment(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp01(dot(pa, ba) / max(dot(ba, ba), 1e-9));
  return length(pa - ba * h) - mix(ra, rb, h);
}
float smin(float a, float b, float k) {
  float h = clamp01(0.5 + 0.5 * (b - a) / k);
  return mix(b, a, h) - k * h * (1.0 - h);
}
vec2 turn(vec2 u, float a) { return vec2(u.x * cos(a) - u.y * sin(a), u.x * sin(a) + u.y * cos(a)); }
// The angle of v from dirA, -pi to pi.
float around(vec2 v, float dirA) { return mod(atan(v.y, v.x) - dirA + 3.14159, TAU) - 3.14159; }

// Washi fibres: fine streaks in two directions that trade places across the sheet.
float streaks(vec2 p, vec2 d) {
  vec2 q = vec2(dot(p, d), dot(p, vec2(-d.y, d.x)));
  return noise2(vec2(q.x * 25.0, q.y * 260.0));
}
float fibres(vec2 p) {
  float w = smoothstep(0.3, 0.7, noise2(p * 4.0 + 13.0));
  return 0.7 * mix(streaks(p, vec2(0.8, 0.6)), streaks(p + 3.1, vec2(-0.5, 0.87)), w) + 0.3 * noise2(p * 120.0);
}

// A blot round a circle of radius R: broad lobes and finer scallops.
float blot(vec2 v, float R, float s, float lobes, float scallop) {
  float r = length(v);
  vec2 n = v / max(r, 1e-6);
  return r - R * (1.0 + lobes * (noise2(n * 1.7 + s) - 0.5) + scallop * (noise2(n * 6.0 + s * 3.1) - 0.5));
}

// Drops thrown within a cone round dirA, up to two per sector, so a pixel only checks the sectors round its
// own direction. Most are small and a few big; the small ones land first and furthest out, and each skids
// outward, so its tail is on the far side.
float satellites(vec2 v, float R, float s, float sectors, float keep, float nearR, float farR, float big, float age, float dirA, float cone, float px) {
  if (length(v) > R * (farR + 0.8)) return 1e4;
  float width = cone / sectors;
  float k0 = floor((around(v, dirA) + cone * 0.5) / width);
  bool full = cone > 6.2;
  float d = 1e4;
  for (int j = -1; j <= 1; j++) {
    float k = k0 + float(j);
    if (full) k = mod(k + sectors, sectors);
    else if (k < 0.0 || k >= sectors) continue;
    for (int m = 0; m < 2; m++) {
      vec2 id = vec2(k * 1.31 + float(m) * 17.7, s);
      if (hash2(id + 0.71) > keep) continue;
      float ha = hash2(id + 0.13);
      float hd = hash2(id + 0.37);
      float hr = hash2(id + 0.59) * hash2(id + 0.83);
      float land = 0.02 + 0.14 * hr;
      if (age < land) continue;
      float a = dirA - cone * 0.5 + (k + 0.15 + 0.7 * ha) * width;
      vec2 u = vec2(cos(a), sin(a));
      float dist = R * mix(nearR, farR, pow(hd, 1.3));
      float r = max(R * big * (0.15 + hr) * mix(1.0, 0.45, hd), px * 0.7);
      float skid = (0.1 + 2.4 * hd * hd * hd) * smoothstep(land, land + 0.08, age);
      d = min(d, segment(v, u * dist, u * (dist + r * skid), r, r * 0.3));
    }
  }
  return d;
}

// At most one speck per cell, landing at random in the first fifth of a second.
float specks(vec2 p, float cell, float density, float age, float s, float px) {
  vec2 k = floor(p / cell);
  if (hash2(k + s * 0.37 + 0.5) > density) return 1e4;
  if (age < 0.02 + 0.18 * hash2(k + 2.0)) return 1e4;
  // Anywhere in the cell, or the specks line up in rows; one near the edge loses a sliver.
  vec2 at = (k + 0.1 + 0.8 * vec2(hash2(k + s), hash2(k + s + 8.7))) * cell;
  float h = hash2(k + 1.3);
  return length(p - at) - max(cell * (0.06 + 0.32 * h * h * h), px * 0.75);
}

// Spikes round the rim of a splash, one to a sector. The long ones pinch off a bead past the tip.
float rays(vec2 v, float d, float R, float s, float count, float age, float px) {
  float width = TAU / count;
  float k0 = floor(around(v, 0.0) / width);
  float grow = expoOut((age - 0.03) / 0.16);
  float pinch = smoothstep(0.1, 0.22, age);
  for (int j = -1; j <= 1; j++) {
    float k = mod(k0 + float(j) + count, count);
    vec2 id = vec2(k * 2.17, s);
    float ha = hash2(id + 0.21);
    float hl = hash2(id + 0.47);
    float hw = hash2(id + 0.73);
    float a = (k + 0.2 + 0.6 * ha) * width;
    vec2 u = vec2(cos(a), sin(a));
    float len = R * (0.25 + 2.3 * pow(hl, 1.6)) * grow;
    float w = R * (0.03 + 0.07 * hw);
    vec2 tip = u * (R * 0.8 + len);
    d = smin(d, segment(v, u * R * 0.5, tip, w, max(w * 0.15, px * 0.5)), R * 0.1);
    if (hl > 0.5) d = min(d, length(v - tip - u * 2.7 * w) - 0.57 * w * pinch);
  }
  return d;
}

// Ink at a pixel. dAll is the distance to any ink (negative inside) and dBody to the main body, which alone
// wicks a grey halo into the fibres. The ink is near black with a little grain and some paler wet patches,
// and its rim darkens as it dries.
float shade(vec2 p, float dAll, float dBody, float halo, float age, float fib, float aa) {
  float grain = 0.93 + 0.07 * noise2(p * 140.0) - 0.1 * smoothstep(0.55, 0.85, noise2(p * 7.0));
  float dry = smoothstep(0.5, 1.8, age);
  float rim = 1.0 - smoothstep(0.0, 0.006, -dAll);
  float body = min(grain + 0.1 * rim * dry, 1.0) * smoothstep(aa, -aa, dAll);
  float wick = halo * pow(clamp01((age - 0.1) / 1.2), 0.45) * (0.25 + 1.5 * fib);
  float wet = 0.2 * exp(-max(dBody, 0.0) / max(halo * 0.4, 1e-5)) * smoothstep(wick, wick - 2.0 * aa, dBody) * (0.6 + 0.8 * fib);
  return max(body, dBody > 0.0 ? wet : 0.0);
}
`;

/** Lands each drop and lays its ink over what is already on the paper. */
export const SPLATTER_MAIN = `
void main() {
  vec2 p = vec2(gl_FragCoord.x / size.y, 1.0 - gl_FragCoord.y / size.y);
  float aspect = size.x / size.y;
  float px = 1.0 / size.y;
  float fib = fibres(p);
  vec4 col = vec4(0.0);
  for (int j = 0; j < 3; j++) {
    vec4 d = drops[j];
    if (d.w < 0.5 || time < d.z) continue;
    float a = inkAt(p, vec2(d.x * aspect, d.y), look.x, look.y, look.z + float(j) * 7.3, time - d.z, fib, px);
    col = vec4(colors[j] * a, a) + col * (1.0 - a);
  }
  gl_FragColor = col;
}`;
