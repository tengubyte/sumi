import { NOISE_GLSL } from "./noiseGlsl.js";

/**
 * Ink floods a canvas one unit high (y down) from `origin` until nothing shows, then paper opens from
 * `exit` and pushes the ink out. Each front is a distance plus domain-warped noise, so it spreads
 * unevenly with feathered fibres; a pale bleed runs ahead of the flood and a grey wash rims the opening.
 * A front below zero has not started.
 */
export const FLOOD_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float seed;
uniform vec3 ink;
uniform vec2 origin;
uniform vec2 exit;
uniform float inFront;
uniform float outFront;
uniform float warpAmount;
${NOISE_GLSL}
void main() {
  float aspect = size.x / size.y;
  vec2 p = vec2(gl_FragCoord.x / size.y, 1.0 - gl_FragCoord.y / size.y);
  float aa = 1.5 / size.y;
  vec2 q = p * 2.4 + seed;
  vec2 w = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
  float warp = fbm(q + 2.4 * w) - 0.5;
  float fibre = fbm(p * 26.0 + seed * 3.0) - 0.5;

  float fieldIn = length(p - vec2(origin.x * aspect, origin.y)) + warp * warpAmount + fibre * 0.05;
  float wet = smoothstep(inFront + aa, inFront - aa, fieldIn);
  float bleed = 0.35 * smoothstep(inFront + 0.05, inFront, fieldIn) * clamp01(0.5 + fibre * 3.0) * step(0.0, inFront);

  float kept = 1.0;
  if (outFront >= 0.0) {
    float depth = length(p - vec2(exit.x * aspect, exit.y)) - warp * warpAmount - fibre * 0.05 - outFront;
    float fringe = 0.3 * smoothstep(-0.03, 0.0, depth) * clamp01(0.5 + fibre * 3.0);
    kept = mix(fringe, mix(0.55, 1.0, smoothstep(0.0, 0.06, depth)), smoothstep(-aa, aa, depth));
  }

  float a = clamp01(max(wet, bleed) * kept);
  // Not a flat fill: the wash is a touch lighter in places and darker where it pooled at the front.
  float tone = 0.12 * (fbm(p * 3.0 + seed * 5.0) - 0.5) - 0.1 * exp(-max(inFront - fieldIn, 0.0) / 0.04);
  vec3 c = clamp(ink * (1.0 + tone * 2.0) + vec3(max(tone, 0.0) * 0.4), 0.0, 1.0);
  gl_FragColor = vec4(c * a, a);
}`;
