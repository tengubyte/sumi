import { describe, expect, it } from "vitest";
import { emberPainter, emberVertices } from "./hinoko";
import { boxBlur, strikePainter } from "./kanji";
import { tornPainter } from "./torn";

describe("boxBlur", () => {
  it("spreads a point without losing ink", () => {
    const side = 41;
    const values = new Float32Array(side * side);
    values[20 * side + 20] = 1;
    boxBlur(values, side, 4);
    const total = values.reduce((sum, v) => sum + v, 0);
    expect(total).toBeCloseTo(1, 4);
    expect(values[20 * side + 20]).toBeLessThan(0.05);
    // Symmetric: as much ink left of the point as right of it, and as much above as below.
    expect(values[20 * side + 15]).toBeCloseTo(values[20 * side + 25] ?? 0, 6);
    expect(values[15 * side + 20]).toBeCloseTo(values[25 * side + 20] ?? 0, 6);
  });

  it("leaves an even field as it is", () => {
    const values = new Float32Array(16 * 16).fill(0.5);
    boxBlur(values, 16, 3);
    expect(Math.min(...values)).toBeCloseTo(0.5, 6);
    expect(Math.max(...values)).toBeCloseTo(0.5, 6);
  });
});

describe("emberVertices", () => {
  it("gives every ember a quad of two triangles, tagged with its index", () => {
    const v = emberVertices(2);
    expect(v).toHaveLength(2 * 6 * 3);
    expect(Array.from(v.slice(0, 18).filter((_, i) => i % 3 === 0))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(Array.from(v.slice(18, 36).filter((_, i) => i % 3 === 0))).toEqual([1, 1, 1, 1, 1, 1]);
    expect(Array.from(v.slice(0, 9))).toEqual([0, -1, -1, 0, 1, -1, 0, 1, 1]);
  });

  it("caps the count", () => {
    expect(emberVertices(10_000)).toHaveLength(400 * 18);
    expect(emberVertices(-3)).toHaveLength(0);
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(tornPainter(noWebGL, "band")).toBeNull();
    expect(strikePainter(noWebGL, "死")).toBeNull();
    expect(emberPainter(noWebGL)).toBeNull();
  });
});
