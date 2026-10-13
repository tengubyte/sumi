import { distanceGrid } from "./distance.js";
import { boxBlur } from "./kanji.js";
import type { Hex } from "./splatShader.js";

/** The side of the square the fire's character or picture is drawn into, in px. */
export const SIDE = 1024;

/** What burns: the character or picture to draw over the fire, and the distance out from its shape. */
export interface FireArt {
  readonly front: HTMLCanvasElement;
  readonly field: ImageData;
}

/**
 * Where a `width` by `height` piece of art sits in the square: scaled to fit a box `wide` by `high` shares of
 * the side, centred across and a little low, so the flames have room to climb above it. Returns its top left
 * corner in px and its scale.
 */
export function placeArt(width: number, height: number, wide: number, high: number): [x: number, y: number, scale: number] {
  const s = Math.min((SIDE * wide) / Math.max(width, 1), (SIDE * high) / Math.max(height, 1));
  return [(SIDE - width * s) / 2, SIDE * 0.58 - (height * s) / 2, s];
}

const blank = (): HTMLCanvasElement => Object.assign(document.createElement("canvas"), { width: SIDE, height: SIDE });

/** `text` in `color`, set in `font`, a CSS font shorthand. */
export function textArt(text: string, font: string, color: Hex): HTMLCanvasElement {
  const canvas = blank();
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  g.fillStyle = color;
  g.font = font;
  const m = g.measureText(text);
  const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const [x, y, s] = placeArt(width, height, 0.5, 0.26);
  g.setTransform(s, 0, 0, s, x + m.actualBoundingBoxLeft * s, y + m.actualBoundingBoxAscent * s);
  g.fillText(text, 0, 0);
  return canvas;
}

/** The picture, larger than a character since most pictures leave space round their subject. */
export function pictureArt(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = blank();
  const [x, y, s] = placeArt(image.naturalWidth, image.naturalHeight, 0.6, 0.46);
  canvas.getContext("2d")?.drawImage(image, x, y, image.naturalWidth * s, image.naturalHeight * s);
  return canvas;
}

/**
 * The art, with the distance out from its shape in the red channel of `field`, in shares of the side over
 * `fieldReach`. Throws when the art came from another origin without CORS, since its pixels cannot be read.
 */
export function withField(front: HTMLCanvasElement, fieldReach: number): FireArt {
  const field = new ImageData(SIDE, SIDE);
  const pixels = front.getContext("2d")?.getImageData(0, 0, SIDE, SIDE).data;
  if (!pixels) return { front, field };
  const alpha = Float32Array.from({ length: SIDE * SIDE }, (_, i) => (pixels[i * 4 + 3] ?? 0) / 255);
  // Specks of splatter would each grow their own fire. Under a small blur they fade well below anything a few
  // px across, while cutting on the blur itself would wear thin brush strokes away, so the blur only vetoes.
  const near = boxBlur(alpha.slice(), SIDE, 4);
  const far = distanceGrid((i) => (alpha[i] ?? 0) > 0.43 && (near[i] ?? 0) > 0.25, SIDE, SIDE);
  for (let i = 0; i < SIDE * SIDE; i++) {
    field.data[i * 4] = ((far[i] ?? 0) / SIDE / fieldReach) * 255;
    field.data[i * 4 + 3] = 255;
  }
  return { front, field };
}
