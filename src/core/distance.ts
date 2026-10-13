// Felzenszwalb and Huttenlocher's squared distance transform along one line of `n` cells, from `f` into
// `d`, with `v` and `z` as scratch.
function line(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  const at = (i: number): number => f[i] ?? Infinity;
  for (let q = 1; q < n; q++) {
    let r = v[k] ?? 0;
    let s = (at(q) + q * q - (at(r) + r * r)) / (2 * q - 2 * r);
    while (s <= (z[k] ?? -Infinity)) {
      k--;
      r = v[k] ?? 0;
      s = (at(q) + q * q - (at(r) + r * r)) / (2 * q - 2 * r);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while ((z[k + 1] ?? Infinity) < q) k++;
    const r = v[k] ?? 0;
    d[q] = (q - r) * (q - r) + at(r);
  }
}

/** For each cell of a `width` by `height` grid, its distance in cells to the nearest cell where `solid` holds. */
export function distanceGrid(solid: (index: number) => boolean, width: number, height: number): Float64Array {
  // Far enough to lose to any real cell, near enough that squaring it stays finite.
  const far = (width + height) ** 2;
  const grid = Float64Array.from({ length: width * height }, (_, i) => (solid(i) ? 0 : far));
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = grid[y * width + x] ?? far;
    line(f, height, d, v, z);
    for (let y = 0; y < height; y++) grid[y * width + x] = d[y] ?? far;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = grid[y * width + x] ?? far;
    line(f, width, d, v, z);
    for (let x = 0; x < width; x++) grid[y * width + x] = Math.sqrt(d[x] ?? far);
  }
  return grid;
}
