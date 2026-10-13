import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * Fire as the Heiji scroll and the Blue Fudo paint it. One mass, not separate flames: tongues rise to points,
 * sway more the higher they reach and whip at the tip, while pieces break off above and new tongues come up
 * from below. Inside, fine pale and dark strands run up each tongue in dashes that stream upward, a pale line
 * runs just inside the outline, a few slow whorls turn the flow, and every edge feathers into the paper.
 *
 * Positions are in shares of the shorter side, y up. The fuel is the bottom edge, or with `shaped` a character
 * or picture, drawn in the `front` texture, whose distance field sits in the `field` texture's red channel.
 */
export const KAEN_FRAGMENT = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 size;
uniform float pixel;
uniform float time;
uniform float grow;
uniform float shaped;
uniform float reach;
uniform float fieldReach;
uniform float seed;
uniform vec4 whorlBox;
uniform vec3 cEdge;
uniform vec3 cBody;
uniform vec3 cHot;
uniform sampler2D front;
uniform sampler2D field;
${NOISE_GLSL}

// Where p falls in the art's square, which is centred on the canvas with the shorter side as its side. The
// textures' first row is the square's top.
vec2 inSquare(vec2 p) {
  vec2 uv = p - (size / min(size.x, size.y) - 1.0) * 0.5;
  return vec2(uv.x, 1.0 - uv.y);
}

float source(vec2 p) {
  if (shaped < 0.5) return max(p.y - 0.02, 0.0);
  vec2 uv = inSquare(p);
  // Past the square's sides the field keeps growing with the distance to them, instead of repeating its edge.
  return texture2D(field, uv).r * fieldReach + length(uv - clamp(uv, 0.0, 1.0));
}

// Fire climbs: fuel straight below counts at under half its distance, fuel beside or above at more than
// its distance. The direction comes from the field's gradient, taken over a wide step so the field's 8-bit
// levels do not shake it, and fades out toward the field's reach, where it flattens.
float lifted(vec2 p) {
  if (shaped < 0.5) return source(p);
  float d = source(p);
  float h = 0.015;
  vec2 g = vec2(source(p + vec2(h, 0.0)) - source(p - vec2(h, 0.0)), source(p + vec2(0.0, h)) - source(p - vec2(0.0, h)));
  float below = smoothstep(0.0, 1.0, g.y / max(length(g), 1e-4));
  below *= 1.0 - smoothstep(0.7, 0.95, d / fieldReach);
  return d * mix(1.7, 0.45, below);
}

// Whorls rise through the fire and turn the flow round them for a while, as the curls in a painted flame do.
vec2 swirl(vec2 p, float t) {
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float cyc = t * 0.16 + fi * 0.25 + seed * 0.37;
    float n = floor(cyc);
    float f = fract(cyc);
    vec2 c = vec2(mix(whorlBox.x, whorlBox.z, hash2(vec2(n * 1.7, fi + seed))), mix(whorlBox.y, whorlBox.w, f));
    vec2 q = p - c;
    float r = (0.06 + 0.04 * hash2(vec2(fi, n + seed))) * min(1.0, reach / 0.5);
    float a = (hash2(vec2(n, fi * 3.1)) < 0.5 ? -1.0 : 1.0) * 3.2 * sin(3.14159 * f) * exp(-dot(q, q) / (r * r));
    p = c + vec2(cos(a) * q.x - sin(a) * q.y, sin(a) * q.x + cos(a) * q.y);
  }
  return p;
}

void main() {
  float m = min(size.x, size.y);
  vec2 p = gl_FragCoord.xy / m;
  float t = time;
  float R = max(reach * grow, 1e-3);
  float d = lifted(p);
  vec2 w = swirl(p, t);
  float up = clamp01(d / R);
  // A lower fire has narrower tongues and sways less, so tongues keep their proportions.
  float k = clamp(0.55 / reach, 0.8, 4.0);
  float x = w.x * k + (0.03 + 0.09 * pow(up, 1.4)) * (2.0 * noise2(vec2(w.x * k * 2.2 + seed, w.y * k * 1.6 - t * 1.1)) - 1.0) + 0.035 * pow(up, 1.3) * sin(w.y * k * 11.0 - t * 4.2 + w.x * k * 5.0);
  // Ridged noise, so the tongues rise to points and part between.
  float r1 = 1.0 - abs(2.0 * noise2(vec2(x * 5.5, t * 0.8 + seed)) - 1.0);
  float r2 = 1.0 - abs(2.0 * noise2(vec2(x * 12.0 + 3.0, t * 1.5 + seed * 2.0)) - 1.0);
  float top = R * (0.2 + 0.7 * pow(r1, 2.4) + 0.3 * pow(r2, 2.4));
  float e = (top - d) / R;
  // Pieces only above the tips: inside the body one would show its own rim.
  float piece = noise2(vec2(x * 8.0, (w.y * k - t * 0.42) * 4.5 + seed));
  e = max(e, (piece - 0.74) * 0.8 - abs(d - top) / R * 0.9 - 2.0 * max(top - d, 0.0) / R);
  float slope = max(fwidth(e), 1e-4);

  float s = x * 34.0 / sqrt(k) + 0.35 * noise2(vec2(x * 30.0, w.y * k * 9.0 - t * 2.0));
  float f = fract(s);
  float rs = hash2(vec2(floor(s), seed + 4.0));
  float fibre = noise2(gl_FragCoord.xy / pixel * vec2(0.9, 0.35));
  float edge = e + 0.008 * (fibre - 0.5);
  float aa = max(fwidth(edge), 1e-4);
  float a = smoothstep(-aa, aa, edge);

  // Pixels in from the outline, measured before the fibre and the pieces whose grain and seams would
  // speckle it, so the rim lines keep one width on a steep tongue and in a flat valley alike.
  float px = edge / slope / pixel;
  float core = smoothstep(0.05, 0.7, edge) * (1.0 - 0.6 * up);
  vec3 col = mix(cEdge, cBody, smoothstep(1.5, 3.5, px));
  col = mix(col, cHot, core * 0.4);
  vec3 pale = mix(cHot, vec3(1.0), 0.15);
  col = mix(col, pale, smoothstep(3.5, 4.5, px) * (1.0 - smoothstep(5.5, 6.5, px)) * 0.8);
  float hair = 1.0 - smoothstep(0.06 + 0.08 * rs, 0.06 + 0.08 * rs + fwidth(s) * 1.5, abs(f - 0.5));
  float run = smoothstep(0.38, 0.55, noise2(vec2(floor(s) * 1.7 + seed, (w.y - t * 0.9) * 7.0)));
  float shown = hair * run * smoothstep(0.08, 0.14, edge);
  col = mix(col, pale, shown * step(0.5, rs) * (0.45 + 0.55 * core));
  col = mix(col, cEdge, shown * step(rs, 0.5) * 0.6);
  vec4 fire = vec4(col * a, a);

  vec4 art = shaped > 0.5 ? texture2D(front, inSquare(p)) : vec4(0.0);
  gl_FragColor = art + fire * (1.0 - art.a);
}`;
