import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * A picture shown as an ink wash, then coloured in from up to five `blooms` (x, y with y down, start as a
 * share of the run). Each bloom grows to `reach` with cauliflower lobes; the front pools darker, pigment
 * creeps a little ahead of it, and fresh colour granulates until it dries. At `progress` 1 it is the
 * picture. Distances are in units of the canvas's shorter side; grain is in CSS px, `pixel` device px each.
 */
export const IRODORI_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float pixel;
uniform float progress;
uniform float seed;
uniform sampler2D image;
uniform vec3 paper;
uniform vec3 ink;
uniform vec3 blooms[5];
uniform float count;
uniform float reach;
${NOISE_GLSL}
void main() {
  float m = min(size.x, size.y);
  vec2 p = gl_FragCoord.xy / m;
  vec2 css = gl_FragCoord.xy / pixel;
  vec4 src = texture2D(image, gl_FragCoord.xy / size);
  vec3 rgb = src.a > 0.0 ? src.rgb / src.a : vec3(0.0);
  float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
  vec3 wash = mix(ink, paper, smoothstep(0.03, 0.97, luma) + 0.03 * (noise2(css / 2.2 + seed) - 0.5));

  float cover = -10.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= count) break;
    vec3 b = blooms[i];
    vec2 c = vec2(b.x * size.x, (1.0 - b.y) * size.y) / m;
    // Quick to start, as wet colour is, then slowing as it spreads.
    float r = (1.0 - pow(1.0 - clamp01((progress - b.z) / max(1.0 - b.z, 0.01)), 1.6)) * reach;
    float fi = float(i) * 7.31 + seed;
    float lobes = (fbm(p * 2.4 + fi) - 0.5) * 0.7 * r;
    float fringe = (noise2(p * 22.0 - fi) - 0.5) * 0.06 * min(r, 0.5);
    cover = max(cover, r - length(p - c) + lobes + fringe);
  }
  // Colour runs a little slower through the dark, inked parts of the picture.
  cover -= 0.05 * (1.0 - luma);

  float k = smoothstep(0.0, 0.025, cover);
  float creep = smoothstep(-0.05, 0.0, cover + 0.02 * (noise2(css / 5.0 + seed) - 0.5)) * 0.3;
  k = max(max(k, creep * (1.0 - k)), smoothstep(0.96, 1.0, progress));

  float wet = smoothstep(0.0, 0.012, cover) * (1.0 - smoothstep(0.012, 0.06, cover));
  float age = smoothstep(0.0, 0.25, cover);
  float settle = 1.0 - smoothstep(0.85, 1.0, progress);
  vec3 colour = mix(vec3(luma), rgb, 1.0 + 0.35 * wet * settle) * (1.0 - 0.16 * wet * settle);
  colour *= 1.0 - 0.1 * (1.0 - age) * settle * (noise2(css / 3.0 - seed) - 0.3);
  gl_FragColor = vec4(mix(wash, colour, k) * src.a, src.a);
}`;
