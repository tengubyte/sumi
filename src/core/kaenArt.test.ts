import { describe, expect, it } from "vitest";
import { placeArt, SIDE } from "./kaenArt";

describe("placeArt", () => {
  it("fits a wide picture to the box's width, centred across", () => {
    const [x, , s] = placeArt(720, 480, 0.6, 0.46);
    expect(720 * s).toBeCloseTo(SIDE * 0.6, 6);
    expect(x + (720 * s) / 2).toBeCloseTo(SIDE / 2, 6);
  });

  it("fits a tall picture to the box's height, its middle a little below the square's", () => {
    const [, y, s] = placeArt(300, 900, 0.6, 0.46);
    expect(900 * s).toBeCloseTo(SIDE * 0.46, 6);
    expect(y + (900 * s) / 2).toBeCloseTo(SIDE * 0.58, 6);
  });

  it("keeps a picture with no size finite", () => {
    expect(placeArt(0, 0, 0.6, 0.46).every(Number.isFinite)).toBe(true);
  });
});
