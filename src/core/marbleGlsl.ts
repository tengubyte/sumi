export const MARBLE_VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

/**
 * Suminagashi from the closed-form marbling maps of Lu, Jaffer et al. (2012). Every operation is an
 * exact, area-preserving map of the water's surface, so each pixel runs the list backwards to find where
 * its ink came from. Positions are in tray heights, y down. Operations come newest first.
 */
const MARBLE_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 size;
uniform int count;
// A: kind and three numbers. B: four more numbers.
uniform vec4 opA[MAX_OPS];
uniform vec4 opB[MAX_OPS];
// Clear water, ink, pale ink, accent: rgb and density.
uniform vec4 colors[4];

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

// WebGL 1 only promises constant indices into uniform arrays in a fragment shader.
vec4 colorOf(float index) {
  if (index < 0.5) return colors[0];
  if (index < 1.5) return colors[1];
  if (index < 2.5) return colors[2];
  return colors[3];
}

// Ink is never one flat tone; the mottling rides with the water because p is where the ink started.
vec4 inked(float index, vec2 p, float salt, float feather) {
  vec4 c = colorOf(index);
  float a = c.a * (0.84 + 0.16 * noise2(p * 46.0 + salt)) * feather;
  return vec4(c.rgb * a, a);
}

vec4 inkAt(vec2 p) {
  for (int i = 0; i < MAX_OPS; i++) {
    if (i >= count) break;
    vec4 A = opA[i];
    vec4 B = opB[i];
    if (A.x < 0.5) {
      // Drop at A.yz, radius A.w, colour B.x: everything already on the water was pushed out by it.
      vec2 d = p - A.yz;
      float d2 = dot(d, d);
      float r2 = A.w * A.w;
      if (d2 < r2) return inked(B.x, p, B.x * 7.0 + float(i), 1.0);
      p = A.yz + d * sqrt(1.0 - r2 / d2);
    } else if (A.x < 1.5) {
      // Tine drawn through A.yz at angle A.w: shifted B.x along it, falling off with distance as B.y sets.
      vec2 m = vec2(cos(A.w), sin(A.w));
      float dist = abs(dot(p - A.yz, vec2(-m.y, m.x)));
      p -= m * B.x * B.y / (dist + B.y);
    } else if (A.x < 2.5) {
      // Wave at angle A.y: a sideways shear of A.z that varies as a sine of wavelength A.w across it.
      vec2 m = vec2(cos(A.y), sin(A.y));
      p -= m * A.z * sin(6.2831853 * dot(p, vec2(-m.y, m.x)) / A.w + B.x);
    } else if (A.x < 3.5) {
      // Vortex round A.yz turning A.w, falling off with distance as B.x sets.
      vec2 d = p - A.yz;
      float turn = -A.w * B.x / (length(d) + B.x);
      p = A.yz + vec2(cos(turn) * d.x - sin(turn) * d.y, sin(turn) * d.x + cos(turn) * d.y);
    } else {
      // Ring system: B.x equal drops of radius A.w landed in turn at A.yz, ink and clear water by turns,
      // with drop B.y in the accent. Band edges sit at A.w * sqrt(k), newest in the middle.
      vec2 d = p - A.yz;
      float q = dot(d, d) / (A.w * A.w);
      if (q < B.x) {
        float m = floor(B.x - q);
        if (mod(m, 2.0) > 0.5) return vec4(0.0);
        // Each band feathers toward its edges, where the ink film is thinnest.
        float f = fract(B.x - q);
        float feather = mix(0.72, 1.0, smoothstep(0.0, 0.3, f) * smoothstep(1.0, 0.7, f));
        return inked(abs(m - B.y) < 0.5 ? 3.0 : mod(m, 4.0) < 1.0 ? 1.0 : 2.0, p, m * 7.0, feather);
      }
      p = A.yz + d * sqrt(1.0 - B.x / q);
    }
  }
  return vec4(0.0);
}

void main() {
  // Four samples per pixel: outer rings get finer than a pixel and should go grey, not alias.
  vec4 sum = vec4(0.0);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    vec2 o = vec2(mod(fk, 2.0) - 0.5, floor(fk / 2.0) - 0.5) * 0.5 + vec2(0.125, -0.125) * (mod(fk, 2.0) * 2.0 - 1.0);
    vec2 frag = gl_FragCoord.xy + o;
    sum += inkAt(vec2(frag.x, size.y - frag.y) / size.y);
  }
  gl_FragColor = sum * 0.25;
}`;

/** The fragment shader with room for `max` operations, which WebGL 1 needs fixed when it compiles. */
export const marbleFragment = (max: number): string => `#define MAX_OPS ${String(max)}
${MARBLE_FRAGMENT}`;
