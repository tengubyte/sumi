import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * A wide flat brush (hake) dragged along `angle`. `kind` 0 keeps `image` on one side of a brushed edge
 * at `line`, 1 keeps it inside a band `width` wide, and 2 lays a band of `color`. Bristles leave streaks
 * along the travel, the edges break into dry gaps, each bristle tip ends at its own length at the head,
 * and the brush runs dry toward the end. Lengths are in units of the canvas's shorter side; single hairs
 * are in CSS px, `pixel` device px each, so they never alias into dotted lines.
 */
export const HAKE_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float pixel;
uniform float progress;
uniform float seed;
uniform float kind;
uniform float flip;
uniform float angle;
uniform float line;
uniform float width;
uniform float bend;
uniform float streaks;
uniform vec3 color;
uniform sampler2D image;
${NOISE_GLSL}
float fbm3(vec2 p) {
  return 0.57 * noise2(p) + 0.29 * noise2(p * 2.03 + 1.7) + 0.14 * noise2(p * 4.1 + 9.2);
}
void main() {
  float m = min(size.x, size.y);
  vec2 p = (gl_FragCoord.xy - size * 0.5) / m;
  vec2 dir = vec2(cos(angle), sin(angle));
  float u = dot(p, dir);
  float v = dot(p, vec2(-dir.y, dir.x)) + bend * u * u;
  vec2 h = size * 0.5 / m;
  float span = abs(h.x * dir.x) + abs(h.y * dir.y);

  // Depth into the paint from its nearest edge; the whole brush wavers a little as the hand drags it.
  float d = kind < 0.5 ? flip * (v - line) : width * 0.5 - abs(v - line);
  float de = d + 0.03 * (fbm3(vec2(u * 1.4, seed * 2.0)) - 0.5);
  // 0 at the edge, 1 at the solid middle: an edge stays broken a long way in, a band across most of its width.
  float th = smoothstep(-0.01, kind < 0.5 ? 0.2 : width * 0.45, de);

  // Streaks: long along the travel, a few px across, so each bristle leaves runs that break off and
  // start again. Clumps of bristles across the stroke carry more or less paint.
  float vp = v * m / pixel;
  float s = 0.5 * noise2(vec2(u * 2.5, vp / 3.5) + seed * 7.0) + 0.2 * noise2(vec2(u * 7.0, vp / 1.8) + seed) + 0.3 * noise2(vec2(v * 40.0, seed));
  float dry = smoothstep(-span * 0.2, span + 0.15, u);
  float need = mix(0.8, 0.0, th) + 0.35 * dry * dry;
  float paint = smoothstep(need - 0.025, need + 0.025, s) * smoothstep(-0.012, 0.0, de);

  // A few bristles splay out past the edge and drag long thin lines.
  float stray = smoothstep(0.84, 0.9, noise2(vec2(vp / 2.2, seed + 9.0))) * step(-0.035 * noise2(vec2(v * 70.0, seed)), de) * step(de, 0.0);
  // Each stray hair runs for a stretch and lifts off, rather than the whole length of the stroke.
  stray *= smoothstep(0.5, 0.62, noise2(vec2(u * 7.0 + seed * 3.0, vp / 2.2)));
  paint = max(paint, stray * smoothstep(0.4, 0.48, s));

  float t = clamp01(progress);
  float head = mix(-span - 0.3, span + 0.3, t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0);
  float tip = 0.16 * noise2(vec2(v * 40.0, seed)) + 0.05 * noise2(vec2(vp / 2.0, seed + 6.0));
  float reached = smoothstep(0.0, 1.5 / m, head - tip - u);
  // The stroke starts ragged too, where the brush first touched down.
  float start = -span - 0.06 + 0.12 * noise2(vec2(vp / 6.0, seed + 8.0));
  reached *= smoothstep(start, start + 1.5 / m, u);
  float a = paint * reached;

  if (kind < 1.5) {
    vec4 picture = texture2D(image, gl_FragCoord.xy / size);
    // White streaks laid over the picture near its edge, as from a second brush loaded with white.
    float white = smoothstep(0.66, 0.74, 0.55 * noise2(vec2(u * 2.2 + 21.0, vp / 4.0 + seed)) + 0.45 * noise2(vec2(v * 38.0, seed + 30.0)));
    white *= (1.0 - smoothstep(0.02, 0.32, de)) * streaks;
    gl_FragColor = vec4(mix(picture.rgb, vec3(picture.a), white * 0.92), picture.a) * a;
  } else {
    // Bristles carrying more paint lay it on darker, and it pools along the edges.
    float shade = 0.82 + 0.3 * (s - 0.6) - 0.12 * (1.0 - smoothstep(0.0, 0.05, de));
    gl_FragColor = vec4(color * shade, 1.0) * a;
  }
}`;
