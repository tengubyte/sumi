import { describe, expect, it } from "vitest";
import { distanceGrid } from "./distance";

describe("distanceGrid", () => {
  it("measures straight-line distance to a single solid cell", () => {
    const side = 11;
    const grid = distanceGrid((i) => i === 5 * side + 5, side, side);
    for (const [x, y] of [[5, 5], [0, 0], [10, 5], [2, 9], [7, 1]] as const) {
      expect(grid[y * side + x]).toBeCloseTo(Math.hypot(x - 5, y - 5), 6);
    }
  });

  it("takes the nearest of several solid cells", () => {
    const width = 20;
    const grid = distanceGrid((i) => i === 0 || i === 19, width, 1);
    expect(grid[4]).toBeCloseTo(4, 6);
    expect(grid[15]).toBeCloseTo(4, 6);
    expect(grid[10]).toBeCloseTo(9, 6);
  });

  it("is zero everywhere on a solid grid", () => {
    const grid = distanceGrid(() => true, 8, 6);
    expect(Math.max(...grid)).toBe(0);
  });

  it("counts rows up from a solid bottom edge", () => {
    const width = 9;
    const height = 7;
    const grid = distanceGrid((i) => Math.floor(i / width) === height - 1, width, height);
    for (let y = 0; y < height; y++) expect(grid[y * width + 4]).toBeCloseTo(height - 1 - y, 6);
  });
});
