import { describe, expect, it } from "vitest";
import { kasumiPainter } from "./kasumi";
import { mendPainter } from "./kintsugi";
import { shiboriPainter, shiboriSeconds } from "./shibori";

describe("shiboriSeconds", () => {
  it("runs longer the more dips the cloth takes, and shorter the faster it is dyed", () => {
    expect(shiboriSeconds(1)).toBeCloseTo(1.7);
    expect(shiboriSeconds(3)).toBeCloseTo(4.5);
    expect(shiboriSeconds(3, 2)).toBeCloseTo(2.25);
  });

  it("keeps the dips between one and six, in whole dips", () => {
    expect(shiboriSeconds(0)).toBe(shiboriSeconds(1));
    expect(shiboriSeconds(40)).toBe(shiboriSeconds(6));
    expect(shiboriSeconds(2.4)).toBe(shiboriSeconds(2));
  });
});

describe("without WebGL", () => {
  it("returns no painter", () => {
    const noWebGL = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(mendPainter(noWebGL, {} as HTMLImageElement)).toBeNull();
    expect(kasumiPainter(noWebGL)).toBeNull();
    expect(shiboriPainter(noWebGL)).toBeNull();
  });
});
