# sumi

Brush and ink effects for React. `BrushReveal` paints brush art in the way the stroke was laid. `BrushPaint` writes any SVG's strokes, such as a kanji from KanjiVG, with a brush drawn in code, and `Enso` draws an ensō from a seed. `BrushMark` paints brush marks round words. `Suminagashi` floats ink on water, `InkWipe` brings an image in under blooming ink, `Sansui` paints ink-wash mountains, and `InkSplat` throws an ink splat drawn in code. Each effect is one WebGL canvas that plays once when it scrolls into view. There are no dependencies besides React, and the core works without React too.

Live demos: [sumi.tengubyte.io](https://sumi.tengubyte.io)

Sumi (墨) is the ink of Japanese brush painting. Made by [TenguByte](https://tengubyte.io).

## Install

```sh
npm install github:tengubyte/sumi#v0.3.0
```

## BrushReveal

```tsx
import { BrushReveal } from "@tengubyte/sumi";

// A ring, painted clockwise from 3 o'clock.
<BrushReveal src="/enso.webp" width={560} height={560} sweep="ring" />

// A band, painted left to right and stretched to 56 px tall.
<BrushReveal src="/band.webp" width={1342} height={130} style={{ height: 56 }} />
```

The art must be on a transparent background, and its stroke must travel the way the sweep does:

- `sweep="line"` (default): left to right.
- `sweep="ring"`: clockwise round the centre of the image. Set `startAngle` to where the stroke starts, in degrees clockwise from 3 o'clock.

| Prop | Type | Default | |
|---|---|---|---|
| `src`, `width`, `height` | | required | The art and its own size in px. |
| `sweep` | `"line" \| "ring"` | `"line"` | |
| `startAngle` | `number` | `0` | Ring only. |
| `duration` | `number` | `1.4` | Seconds. |
| `delay` | `number` | `0` | Seconds after it is in view. |
| `ease` | `(t: number) => number` | `joHaKyu` | Pass a stable function. |
| `alt`, `className`, `style` | | | Width alone keeps the art's shape; width and height stretch it. |

## BrushPaint

```tsx
import { BrushPaint } from "@tengubyte/sumi";
import ei from "./06c38.svg?raw"; // 永 from KanjiVG

<BrushPaint svg={ei} label="永" style={{ width: 360, aspectRatio: "1" }} />
```

Paints every path, line, polyline, polygon, circle, ellipse and rect in the SVG, in document order, as one stroke along its centre line. Fills are ignored. No raster art: the brush lands and presses, runs lighter through the middle, shoulders into each sharp turn and dries out toward the end.

How a stroke leaves the paper comes from KanjiVG's `kvg:type` on each stroke. In any other SVG, set `data-brush-end` on a shape to `tome` (press and stop, the default), `harai` (sweep out to a point), `hane` (flick off a hook), `na` (widen, then sweep out), `rise` or `dot`.

KanjiVG's stroke data is CC BY-SA 3.0 (Ulrich Apel, [kanjivg.tagaini.net](https://kanjivg.tagaini.net/)), so it is not bundled. Fetch or import the characters you need and credit KanjiVG.

| Prop | Type | Default | |
|---|---|---|---|
| `svg` | `string` | required | SVG markup made of strokes. |
| `label` | `string` | | What the art says. Without it the canvas is hidden from assistive technology. |
| `weight` | `number` | `0.034` | Brush radius as a share of the art's width. |
| `speed` | `number` | `1` | 2 paints twice as fast. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink. |
| `bleed` | `number` | `0.07` | Ink that bleeds into the paper past the edges, 0 to 0.3. |
| `contrast` | `number` | `0.8` | How much thinner horizontals are than verticals, 0 to 1. |
| `bristles` | `number` | `22` | Bristle lines across the brush. |
| `delay` | `number` | `0` | Seconds after it is in view. |
| `className`, `style` | | | Size the canvas here; the art sits centred without stretching. |

## BrushMark

```tsx
import { BrushMark } from "@tengubyte/sumi";

<h1>
  Paint the <BrushMark type="circle">word</BrushMark> that <BrushMark delay={1}>matters</BrushMark>
</h1>
```

Hand-drawn annotations in the spirit of Rough Notation, with the brush: `underline` (default), `circle` (an ensō round the word), `highlight` (a dry swipe behind the text), `strike` and `box`. The words stay plain text on one line; the mark is measured when it scrolls into view and painted on a canvas round it. Takes `seed` (how far off true the hand is), `color` (default `"#d8001a"`), `speed` and `delay`. Stagger several marks with `delay`.

## Enso

```tsx
import { Enso } from "@tengubyte/sumi";

<Enso seed={42} style={{ width: 360, aspectRatio: "1" }} />
```

The same brush given one stroke made from a seed: where it starts, how far round it goes, its wobble, weight and how dry its tail runs. The same seed always draws the same ensō. Takes `seed` (default `7`), `weight` (default from the seed), and `speed`, `color`, `bleed` and `delay` as for `BrushPaint`.

## Suminagashi

```tsx
import { Suminagashi } from "@tengubyte/sumi";

<Suminagashi pattern="flow" style={{ width: 480, aspectRatio: "4 / 3" }} />
```

Drops of ink and clear water land on one spot in turn, each pushing the last outward into a ring, then a wave, a comb or a slow turn pulls the rings into flowing lines. There is no fluid simulation: each step is an exact, area-preserving map of the water's surface, after Lu, Jaffer et al., "Mathematical Marbling" (2012), so every pixel runs the list backwards to find where its ink came from.

| Prop | Type | Default | |
|---|---|---|---|
| `pattern` | `"flow" \| "rings" \| "comb"` | `"flow"` | A preset, laid out for the canvas's shape. |
| `ops` | `MarbleOp[]` | | Your own drops, ring systems, tines, waves and vortices instead. Positions in tray heights. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink. Pale rings are the same ink, thinner. |
| `accent` | `` `#${string}` `` | `"#d8001a"` | The one accent ring. |
| `delay` | `number` | `0` | Seconds after it is in view. |

## InkWipe

```tsx
import { InkWipe } from "@tengubyte/sumi";

<InkWipe src="/hero.webp" width={1200} height={674} alt="Mountains at dawn" blots={[[0.5, 0.5, 0]]} />
```

The image comes in under ink that blooms from up to three blots. The edge spreads unevenly with feathered fibres, pigment pools dark at the front and the wash thins behind it until the picture shows, then the ink dries away. One shader instead of a sprite sheet.

| Prop | Type | Default | |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | The image and its own size in px. |
| `from` | `string` | | An image in the same box that the ink wipes away. |
| `blots` | `[x, y, start][]` | `[[0.5, 0.5, 0]]` | Where, as shares of the image (y down), and when, 0 to 1. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink at the spreading edge. |
| `seed` | `number` | `1` | Changes the shape of the bloom. |
| `duration`, `delay` | `number` | `1.8`, `0` | Seconds. |
| `className`, `style` | | | Width alone keeps the image's shape. |

Like `BrushReveal`, it ends on the image's own pixels and hands back to a plain image.

## Sansui

```tsx
import { Sansui } from "@tengubyte/sumi";

<Sansui seed={8} style={{ width: "100%", aspectRatio: "16 / 9" }} />
```

An ink-wash landscape drawn in code. Five ridges are brushed in from far to near; each ridge line goes on left to right, then its wash creeps down and thins into mist. The sun bleeds in like vermilion on damp paper and bands of mist drift across it. Takes `seed` (default `3`), `sun` (default `true`), `mist` (0 to 1, default `0.6`), `color`, `sunColor` (default `"#d8001a"`), `speed` and `delay`. It runs about 6.5 seconds at speed 1.

## InkSplat

```tsx
import { InkSplat } from "@tengubyte/sumi";

<InkSplat seed={12} angle={160} style={{ width: 360, aspectRatio: "360 / 396" }} />
```

No art needed. Size the canvas with CSS; the splat scales with its width. With the defaults the pool lands just past the right edge, so only its fingers and drops reach in.

| Prop | Type | Default | |
|---|---|---|---|
| `seed` | `number` | `3.7` | Changes every finger, bead and droplet. |
| `angle` | `number` | `160` | Direction of travel, degrees clockwise from pointing right. |
| `x`, `y` | `number` | `1.04`, `0.3` | Where the pool lands, as a share of the canvas. |
| `size` | `number` | `0.12` | Pool radius as a share of the canvas width. |
| `color` | `` `#${string}` `` | `"#d8001a"` | `#rrggbb`. |
| `underColor` | `` `#${string}` \| null `` | `"#161314"` | A smaller second splat under the first, or `null`. On dark backgrounds use a lighter charcoal. |
| `mist` | `number` | `0.55` | 0 to 1. |
| `duration`, `delay` | `number` | `2.2`, `0` | Seconds. |

## Without React

```ts
import { floatInk, paintEnso, paintIn, paintMark, paintSansui, paintStrokes, throwSplat, wipeIn } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas laid over it.
const stopPaint = paintIn(document.querySelector("img.enso")!, { sweep: "ring" });
const stopWrite = paintStrokes(document.querySelector("canvas.kanji")!, svgMarkup, { weight: 0.03 });
const stopEnso = paintEnso(document.querySelector("canvas.enso")!, { seed: 42 });
const stopFloat = floatInk(document.querySelector("canvas.water")!, { pattern: "rings" });
const stopSplat = throwSplat(document.querySelector("canvas.splat")!, { seed: 12 });
// A positioned, one-line element; the image must fill a positioned parent.
const stopMark = paintMark(document.querySelector<HTMLElement>("span.key")!, "circle");
const stopWipe = wipeIn(document.querySelector("img.hero")!, { blots: [[0.5, 0.5, 0]] });
const stopHills = paintSansui(document.querySelector("canvas.hills")!, { seed: 8 });
```

Each call returns its cleanup.

## What every effect does

- Plays once, when it has scrolled a little way into view.
- With `prefers-reduced-motion: reduce` it shows the last frame: the finished art, the settled water or the landed splat.
- Without WebGL, `BrushReveal` and `InkWipe` show the plain image, `BrushMark` shows the plain words, and the canvas effects show nothing.
- `BrushReveal` and `InkWipe` end on the image's own pixels, hand back to the plain image and release their WebGL context. The canvas effects keep their last frame and redraw it on resize.
- Every component is marked `"use client"` for React Server Components.

## Development

```sh
npm install
npm run dev     # the showcase site, importing the package from src
npm run check   # types, lint, tests, package build and site build
```

The site in `site/` deploys to Cloudflare Pages from `main`: build command `npm run build:site`, output directory `site/dist`.

## License

The code is MIT licensed. The ensō, band and landscape art used on the showcase site belong to TenguByte and are not part of the package. The KanjiVG files in `site/src/kanji` are CC BY-SA 3.0, Ulrich Apel, and are not part of the package either.
