import { NOISE_GLSL } from "./noiseGlsl.js";

/** The strike's own clock: the sweep crosses by 0.3 s, the drops land by 0.6 s, the ink has bled by 1.8 s. */
export const KANJI_SECONDS = 1.8;

/**
 * One character struck in a single sweep, centred in the canvas at 92% of its shorter side (y down). `glyph`
 * holds the character in r, a few px of blur in g (its edge) and a wide blur in b (how near it is). The
 * sweep's front is streaky with bristles, gaps open where the brush runs dry, drops fly off where the sweep
 * ends, and afterwards the ink creeps a little into the paper. `glow` adds a soft halo for dark pages.
 */
export const KANJI_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float time;
uniform float seed;
uniform float angle;
uniform float glow;
uniform vec3 color;
uniform sampler2D glyph;
${NOISE_GLSL}
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}
float easeOut(float t) {
  t = clamp01(t);
  return 1.0 - pow(1.0 - t, 3.0);
}
vec4 sampleGlyph(vec2 q) {
  vec2 uv = q / 0.92 + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(glyph, uv);
}
// Drops flung off the sweep: at most one per cell near the character, stretched along the throw.
float drops(vec2 q, vec2 dir, float sweep) {
  float found = 0.0;
  vec2 base = floor(q * 30.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = base + vec2(float(i), float(j));
      float h1 = hash2(c + seed);
      float h2 = hash2(c * 1.7 + 3.1 + seed);
      vec2 at = (c + 0.2 + 0.6 * vec2(h1, h2)) / 30.0;
      vec4 near = sampleGlyph(at);
      float along = (rot(-angle) * at).x;
      // Most fly off where the sweep ends; a few land along the way.
      float chance = smoothstep(0.05, 0.3, near.b) * (1.0 - smoothstep(0.1, 0.4, near.g)) * mix(0.06, 0.4, smoothstep(-0.1, 0.45, along));
      if (hash2(c * 2.3 - 1.9 + seed) > chance || along > sweep) continue;
      float fly = easeOut((time - 0.3 * (along + 0.75) / 1.5) / 0.3);
      // Small drops fly further than big ones.
      float big = h2 * h2 * h2 * h2;
      vec2 centre = at + dir * (0.01 + 0.07 * h1 * (1.0 - big)) * fly;
      vec2 d = rot(-angle) * (q - centre);
      float r = 0.002 + 0.016 * big;
      found = max(found, smoothstep(r, r * 0.6, length(d * vec2(1.0 / (1.0 + 1.5 * h1), 1.0))));
    }
  }
  return found;
}
void main() {
  vec2 p = (gl_FragCoord.xy - size * 0.5) / min(size.x, size.y);
  p.y = -p.y;
  // It lands a little large and settles, with a short shake.
  float zoom = 1.0 + 0.2 * pow(1.0 - clamp01(time / 0.18), 3.0);
  vec2 shake = vec2(sin(time * 83.0 + seed), cos(time * 71.0)) * 0.01 * exp(-time * 10.0) * step(0.0, time);
  vec2 q = (p - shake) / zoom;
  vec4 g = sampleGlyph(q);
  vec2 r = rot(-angle) * q;
  float streak = noise2(vec2(r.x * 5.0, r.y * 150.0) + seed * 7.0);
  float streak2 = noise2(vec2(r.x * 2.0, r.y * 60.0) - seed * 3.0);
  float st = clamp01(time / 0.3);
  float sweep = mix(-0.75, 0.75, 1.0 - (1.0 - st) * (1.0 - st));
  float shown = smoothstep(0.02, -0.02, r.x - sweep - (streak - 0.5) * 0.18);
  // The brush runs dry toward the end of the sweep and along the edges; the gaps follow the bristles.
  float dryness = (1.0 - smoothstep(0.6, 0.98, g.g)) * 0.55 + smoothstep(-0.25, 0.55, r.x) * 0.45;
  float body = g.r * smoothstep(dryness - 0.06, dryness + 0.06, 0.6 * streak + 0.4 * streak2 + 0.18);
  float bleed = 1.0 - exp(-max(time - 0.15, 0.0) * 2.2);
  float creep = 0.5 - bleed * (0.08 + 0.12 * fbm(q * 22.0 + seed));
  float wet = smoothstep(creep + 0.03, creep - 0.03, 1.0 - g.g) * smoothstep(0.2, 0.5, g.g);
  float ink = clamp01(max(max(body, wet * 0.9) * shown, drops(q, vec2(cos(angle), sin(angle)), sweep)));
  // A thin wash stays close to the strokes and breaks up, as water carries ink into the fibres.
  float wash = 0.22 * bleed * smoothstep(0.04, 0.4, g.g) * (1.0 - g.r) * smoothstep(0.35, 0.7, fbm(q * 14.0 - seed)) * shown;
  float flare = (exp(-max(time - 0.1, 0.0) * 3.0) * 0.6 + 0.25) * step(0.05, time);
  float halo = glow * flare * smoothstep(0.0, 0.6, g.b) * 0.55 * shown;
  float a = ink + wash * (1.0 - ink);
  a += halo * (1.0 - a);
  gl_FragColor = vec4(color * a, a);
}`;
