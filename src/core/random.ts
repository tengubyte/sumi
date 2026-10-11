/** Numbers from 0 to 1 that a seed always repeats, so a seed always draws the same shape. */
export function random(seed: number): () => number {
  let a = Math.floor(seed * 1000) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
