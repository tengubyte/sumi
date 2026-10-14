import { describe, expect, it } from "vitest";
import { Fluid } from "./fluid";
import { dropPainter, dropSeconds } from "./inkDrop";
import { floodReach } from "./inkTransition";
import { sealCells, sealPainter } from "./seal";

describe("sealCells", () => {
  it("reads columns from the right, each top to bottom", () => {
    const [first, second, third, fourth] = sealCells(4, 1);
    expect(first).toEqual([0.5, 0, 0.5, 0.5]);
    expect(second).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(third).toEqual([0, 0, 0.5, 0.5]);
    expect(fourth).toEqual([0, 0.5, 0.5, 0.5]);
  });

  it("stacks two characters on a tall or square face and sets them side by side on a wide one", () => {
    expect(sealCells(2, 0.55)).toEqual([[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]]);
    expect(sealCells(2, 2)).toEqual([[0.5, 0, 0.5, 1], [0, 0, 0.5, 1]]);
  });

  it("cuts one to four characters", () => {
    expect(sealCells(0, 1)).toEqual([[0, 0, 1, 1]]);
    expect(sealCells(7, 1)).toHaveLength(4);
  });
});

describe("dropSeconds", () => {
  it("runs until the last drop has sunk", () => {
    expect(dropSeconds([[0.5, 0.1]])).toBe(4.5);
    expect(dropSeconds([[0.3, 0.1, 0], [0.7, 0.1, 1.2]])).toBeCloseTo(5.7);
  });

  it("runs until the last drop has settled on paper", () => {
    expect(dropSeconds([[0.3, 0.5, 0], [0.7, 0.5, 0.8]], 3)).toBeCloseTo(3.8);
  });
});

describe("floodReach", () => {
  it("passes the farthest corner with room for the warped edge", () => {
    // From the middle of a 2:1 box, the corners are sqrt(1 + 0.25) away.
    expect(floodReach([0.5, 0.5], 2)).toBeGreaterThan(Math.hypot(1, 0.5) + 0.15);
    // From the bottom left, the top right corner is farthest.
    expect(floodReach([0, 1], 2)).toBeGreaterThan(Math.hypot(2, 1));
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(sealPainter(noWebGL, "墨")).toBeNull();
    expect(dropPainter(noWebGL)).toBeNull();
    expect(dropPainter(noWebGL, { view: "top" })).toBeNull();
  });

  it("opens no fluid without half-float textures, so the side view can fall back to the ring", () => {
    const noHalfFloat = { getExtension: () => null } as unknown as WebGLRenderingContext;
    expect(Fluid.open(noHalfFloat, 4 / 3)).toBeNull();
  });
});
