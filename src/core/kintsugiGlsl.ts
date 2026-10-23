import { NOISE_GLSL } from "./noiseGlsl.js";

/** The timeline in seconds: cracked by 0.35, red lacquer from 0.75, gold from 1.5, the sheen gone by 3.4. */
export const KINTSUGI_SECONDS = 3.4;

/**
 * A picture cracks from `impact` (shares, y down), the cracks fill with red urushi from the impact
 * outward, then with gold, and a sheen sweeps once. Small shards cluster at the impact, a few long cracks
 * and big shards reach further, and each crack tapers to a point. Seams are measured in CSS px, `css` of
 * the canvas height each, so a thumbnail and a hero get the same line. Only the opaque part of the picture
 * cracks; its pixels come in straight alpha.
 */
export const KINTSUGI_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float css;
uniform float time;
uniform float seed;
uniform vec2 impact;
uniform sampler2D image;
${NOISE_GLSL}
vec2 hash22(vec2 p) { return vec2(hash2(p), hash2(p + 17.31)); }

// Distance, in cells, to the nearest kept border of a Voronoi of shards. A border is kept or dropped by a
// hash of the two cells it parts, so some shards merge and some cracks stop in the glaze.
float cracks(vec2 g, float keep, float s) {
  vec2 n = floor(g);
  vec2 f = fract(g);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 r = o + hash22(n + o + s) - f;
      float d = dot(r, r);
      if (d < md) { md = d; mr = r; mg = o; }
    }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 o = mg + vec2(float(i), float(j));
      vec2 r = o + hash22(n + o + s) - f;
      vec2 e = r - mr;
      if (dot(e, e) < 1e-5) continue;
      vec2 a = n + mg;
      vec2 b = n + o;
      if (hash2((a + b) * 0.5 + abs(a - b) * 13.1 + s * 0.7) > keep) continue;
      md = min(md, dot(0.5 * (mr + r), normalize(e)));
    }
  }
  return md;
}

// How much of a crack's width is left at distance r: all of it inside r0, none by r1.
float left(float r, float r0, float r1) { return 1.0 - smoothstep(r0, r1, r); }

// Cracks are carried as (distance, width left). Of two, the one whose edge is nearer wins.
vec2 nearest(vec2 a, vec2 b, float w) { return a.x - w * a.y < b.x - w * b.y ? a : b; }

// Long cracks run out from the impact, wandering a little, each thinning out at its own length.
vec2 radial(vec2 rel, float s, float reach, float w) {
  float r = length(rel);
  float a = atan(rel.y, rel.x);
  vec2 d = vec2(1e4, 0.0);
  for (int k = 0; k < 6; k++) {
    float fk = float(k);
    float ak = (fk + 0.7 * hash2(vec2(fk, s))) * 6.28318 / 6.0;
    float len = reach * (0.3 + 0.8 * hash2(vec2(s, fk + 3.0)));
    float wob = 0.3 * (noise2(vec2(r * 4.0, fk * 7.0 + s)) - 0.5) + 0.06 * (noise2(vec2(r * 30.0, fk * 3.0 + s)) - 0.5);
    float da = mod(a - ak - wob + 3.14159, 6.28318) - 3.14159;
    float dd = abs(da) > 1.57 ? r : abs(sin(da)) * r;
    d = nearest(d, vec2(dd, left(r, len * 0.45, len)), w);
  }
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size.y;
  float aspect = size.x / size.y;
  float px = 1.0 / size.y;
  vec2 c = vec2(impact.x * aspect, impact.y);
  vec2 rel = p - c;
  float r = length(rel);
  float reach = length(vec2(max(c.x, aspect - c.x), max(c.y, 1.0 - c.y))) + 0.05;

  // Shards are smaller near the impact, so the coordinates are pulled in there; a slow warp makes the
  // cracks wander and a fine one makes them jagged. The gap opens wide at the blow and closes as the
  // pieces are fitted back.
  vec2 q = c + rel * pow(max(r, 1e-4), -0.3) * 0.75;
  q += 0.05 * (vec2(fbm(p * 3.0 + seed), fbm(p * 3.0 + seed + 7.0)) - 0.5);
  vec2 jag = 0.003 * (vec2(noise2(p * 70.0), noise2(p * 70.0 + 3.0)) - 0.5);
  float open = 1.0 + 1.2 * smoothstep(0.0, 0.08, time) * (1.0 - smoothstep(0.15, 0.7, time));
  float w = 1.4 * css * (0.6 + 0.8 * fbm(p * 5.0 + seed + 2.0)) * open;
  float wander = 0.08 * noise2(p * 6.0 + seed);
  vec2 shards = vec2(cracks((q + jag) / 0.18, 0.55, seed) * 0.18, left(r + wander, 0.1, 0.32));
  vec2 big = vec2(cracks((p + jag) / 0.42 + 11.0, 0.3, seed + 9.0) * 0.42, left(r + wander, 0.2, 0.55 * reach));
  vec2 crack = nearest(nearest(shards, big, w), radial(rel + jag, seed, reach, w), w);
  float centre = crack.x;
  float wl = w * crack.y;
  float hairC = cracks((q + jag) / 0.06 + 31.0, 0.22, seed + 5.0) * 0.06;
  float wh = 0.3 * css * open * left(r + wander, 0.04, 0.2);

  float front = reach * (1.0 - pow(2.0, -10.0 * clamp01(time / 0.35)));
  float spread = smoothstep(front, front - 0.04, r + 0.04 * noise2(p * 8.0 + seed));
  // A line thinner than a pixel fades instead of staying a pixel wide.
  float seam = smoothstep(wl + px, wl - px, centre) * clamp01(2.0 * wl / px) * spread;
  float hair = smoothstep(wh + px * 0.8, wh - px * 0.8, hairC) * clamp01(2.0 * wh / px) * spread * (1.0 - seam);

  // Urushi runs along the seams from the impact outward, then the gold is dusted on the same way.
  float t = time + 0.12 * noise2(p * 5.0 + seed);
  float red = smoothstep(0.75 + 0.6 * r / reach, 0.87 + 0.6 * r / reach, t);
  float gold = smoothstep(1.5 + 0.8 * r / reach, 1.65 + 0.8 * r / reach, t);

  vec2 shake = 0.004 * (1.0 - smoothstep(0.0, 0.3, time)) * vec2(sin(time * 90.0), cos(time * 77.0));
  vec4 src = texture2D(image, gl_FragCoord.xy / size + shake);
  vec3 base = src.rgb;

  float prof = 1.0 - clamp01(centre / max(wl, 1e-5));
  float dust = hash2(floor(p / css) + seed);
  vec3 goldC = mix(vec3(0.5, 0.34, 0.11), vec3(0.98, 0.84, 0.5), clamp01(0.25 + 0.55 * prof + 0.3 * (dust - 0.5)));
  float sweep = dot(p, normalize(vec2(1.0, 0.6))) - (time - 2.2) * 1.4;
  float sheen = exp(-sweep * sweep / 0.006);
  goldC += vec3(1.0, 0.88, 0.6) * sheen * 0.55 + step(0.988, dust) * (0.25 + 1.2 * sheen);
  vec3 urushi = vec3(0.42, 0.09, 0.06);
  // A thin red rim stays at the edge of the gold in places.
  float rimKeep = 0.12 + 0.3 * step(0.62, noise2(p * 14.0 + seed));
  vec3 seamC = mix(mix(base * 0.15, urushi, red), goldC, gold * smoothstep(rimKeep, rimKeep + 0.15, prof));
  vec3 hairGold = mix(vec3(0.62, 0.45, 0.16), vec3(0.9, 0.75, 0.4), dust) + sheen * 0.4;
  vec3 hairC3 = mix(mix(base * 0.35, urushi, red * 0.6), hairGold, gold);
  // The raised gold throws a faint shadow just outside the seam.
  float shadow = 0.3 * gold * spread * crack.y * smoothstep(wl + 3.0 * css, wl, centre) * (1.0 - seam);
  vec3 col = base * (1.0 - shadow);
  col = mix(col, hairC3, hair * 0.9);
  col = mix(col, seamC, seam);
  gl_FragColor = vec4(col * src.a, src.a);
}`;
