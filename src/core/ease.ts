type Point = readonly [number, number];
type Segment = readonly [Point, Point, Point, Point];

// Three cubic Bézier segments; x is time and y is how far the stroke has got.
const JO_HA_KYU: readonly [Segment, Segment, Segment] = [
  [[0, 0], [0.12, 0], [0.2, 0.03], [0.28, 0.06]],
  [[0.28, 0.06], [0.42, 0.12], [0.55, 0.3], [0.7, 0.55]],
  [[0.7, 0.55], [0.82, 0.76], [0.92, 0.94], [1, 1]],
];

const cubic = (a: number, b: number, c: number, d: number, t: number): number => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/**
 * Jo-ha-kyu, the pacing of a brush stroke: the brush presses and the ink spreads (jo), sweeps faster and
 * faster (ha), and leaves the paper still moving (kyu), which is what leaves dry streaks at the tail.
 * Maps time (0 to 1) to progress (0 to 1).
 */
export function joHaKyu(time: number): number {
  if (time <= 0) return 0;
  if (time >= 1) return 1;
  const [p0, p1, p2, p3] = JO_HA_KYU.find((segment) => time <= segment[3][0]) ?? JO_HA_KYU[2];
  // x grows with t inside a segment, so bisection finds t far below a pixel in 24 steps.
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (cubic(p0[0], p1[0], p2[0], p3[0], mid) < time) low = mid;
    else high = mid;
  }
  return cubic(p0[1], p1[1], p2[1], p3[1], (low + high) / 2);
}
