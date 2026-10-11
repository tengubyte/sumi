# sumi

Eleven brush and ink effects for React, listed in the table below. Each one is a WebGL shader that plays once as it scrolls into view; `inkTransition` plays each time it is called. React is the only dependency, and the core works without it.

Live demos: [sumi.tengubyte.io](https://sumi.tengubyte.io)

Sumi (墨) is the ink of Japanese brush painting. Made by [TenguByte](https://tengubyte.io).

| Effect | What it does | Demo |
| --- | --- | --- |
| [BrushReveal](#brushreveal) | Paints brush art in the way the stroke was laid | [ring](https://sumi.tengubyte.io/#ring) |
| [BrushPaint](#brushpaint) | Writes an SVG's strokes with a brush | [kanji](https://sumi.tengubyte.io/#brush) |
| [BrushMark](#brushmark) | Paints a mark round words | [marks](https://sumi.tengubyte.io/#mark) |
| [Hanko](#hanko) | Presses a seal | [seal](https://sumi.tengubyte.io/#hanko) |
| [Enso](#enso) | Draws an ensō from a seed | [ensō](https://sumi.tengubyte.io/#enso) |
| [Suminagashi](#suminagashi) | Floats ink on water | [water](https://sumi.tengubyte.io/#float) |
| [InkDrop](#inkdrop) | Drops ink into still water | [drop](https://sumi.tengubyte.io/#drop) |
| [InkWipe](#inkwipe) | Brings an image in under ink | [image](https://sumi.tengubyte.io/#wipe) |
| [inkTransition](#inktransition) | Changes the page under ink | [page](https://sumi.tengubyte.io/#transition) |
| [Sansui](#sansui) | Paints ink-wash mountains | [hills](https://sumi.tengubyte.io/#sansui) |
| [InkSplat](#inksplat) | Throws an ink splat | [splat](https://sumi.tengubyte.io/#splat) |

The core calls for pages without React are under [Without React](#without-react).

## Install

```sh
npm install github:tengubyte/sumi#v0.4.0
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

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height` | | required | The art and its own size in px. |
| `sweep` | `"line" \| "ring"` | `"line"` | Left to right, or clockwise round the centre. |
| `startAngle` | `number` | `0` | Ring only. Where the stroke starts, in degrees clockwise from 3 o'clock. |
| `duration` | `number` | `1.4` | Seconds the stroke takes. |
| `delay` | `number` | `0` | Seconds after it is in view. |
| `ease` | `(t: number) => number` | `joHaKyu` | Pass a stable function. |
| `alt`, `className`, `style` | | | Width alone keeps the art's shape; width and height stretch it. |

## BrushPaint

```tsx
import { BrushPaint } from "@tengubyte/sumi";
import ei from "./06c38.svg?raw"; // 永 from KanjiVG

<BrushPaint svg={ei} label="永" style={{ width: 360, aspectRatio: "1" }} />
```

Paints every path, line, polyline, polygon, circle, ellipse and rect in the SVG, in document order, as one stroke along its centre line. Fills are ignored. The brush is drawn in code. It lands and presses, runs lighter through the middle, shoulders into each sharp turn and dries out toward the end.

How a stroke leaves the paper comes from KanjiVG's `kvg:type` on each stroke. In any other SVG, set `data-brush-end` on a shape to `tome` (press and stop, the default), `harai` (sweep out to a point), `hane` (flick off a hook), `na` (widen, then sweep out), `rise` or `dot`.

KanjiVG's stroke data is CC BY-SA 3.0 (Ulrich Apel, [kanjivg.tagaini.net](https://kanjivg.tagaini.net/)), so it is not bundled. Fetch or import the characters you need and credit KanjiVG.

| Prop | Type | Default | What it does |
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

## Hanko

```tsx
import { Hanko } from "@tengubyte/sumi";

<Hanko text="天狗" shape="tall" white font='"Yuji Syuku"' style={{ width: 100, aspectRatio: "1 / 1.6" }} />
```

A seal pressed in vermilion paste. It comes down, is rocked once round its face and lifts; the paste only reaches the paper's high points, so the impression keeps white specks, one side comes out lighter and the carved border has a few chips. Mount it when a form is sent to stamp the send.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `text` | `string` | required | One to four characters, read in columns from the right, each top to bottom. |
| `label` | `string` | | What the seal says. Without it the canvas is hidden from assistive technology. |
| `shape` | `"square" \| "tall" \| "round"` | `"square"` | Size the canvas to match: square, or about 1:1.6 for tall. |
| `white` | `boolean` | `false` | White characters cut into a red block (hakubun) instead of red characters in a border (shubun). |
| `font`, `weight` | `string`, `number` | a Mincho stack, `700` | A CSS font family you load. The seal waits for it, and stretches the characters to fill the face. |
| `color` | `` `#${string}` `` | `"#d8001a"` | The seal paste. |
| `seed` | `number` | `1` | Paper grain, chips in the border and which side pressed harder. |
| `speed`, `delay` | `number` | `1`, `0` | It takes 1.6 seconds at speed 1. |

The characters come from the font you pass, so sumi ships no glyph data.

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

Drops of ink and clear water land on one spot in turn, each pushing the last outward into a ring, then a wave, a comb or a slow turn pulls the rings into flowing lines. Each step is an exact, area-preserving map of the water's surface, after Lu, Jaffer et al., "Mathematical Marbling" (2012), so every pixel runs the list backwards to find where its ink came from.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `pattern` | `"flow" \| "rings" \| "comb"` | `"flow"` | A preset, laid out for the canvas's shape. |
| `ops` | `MarbleOp[]` | | Your own drops, ring systems, tines, waves and vortices instead. Positions in tray heights. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink. Pale rings are the same ink, thinner. |
| `accent` | `` `#${string}` `` | `"#d8001a"` | The one accent ring. |
| `delay` | `number` | `0` | Seconds after it is in view. |

## InkDrop

```tsx
import { InkDrop } from "@tengubyte/sumi";

<InkDrop drops={[[0.38, 0.1], [0.64, 0.1, 0.9, "#d8001a"]]} style={{ width: "100%", aspectRatio: "4 / 3" }} />
```

Ink dropped into still water. Each drop sinks as a ring whose rim rolls up into a cap and frays into filaments, with a thin stem behind it, and thins to a grey wash as it slows. The ring is two spinning cores with curled noise on top, and every pixel traces its water back to the moment each drop landed.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `drops` | `[x, y, start?, color?][]` | `[[0.5, 0.1]]` | Up to three: where, as shares of the canvas (y down), when in seconds, and their ink. |
| `color` | `` `#${string}` `` | `"#161314"` | Ink for drops without their own. |
| `swirl` | `number` | `0.6` | How much the water churns, 0 to 2. |
| `seed` | `number` | `1` | How the rims fray. |
| `speed`, `delay` | `number` | `1`, `0` | Each drop takes 4.5 seconds to settle at speed 1. |

Each drop sinks about 60% of the canvas height, so start them near the top. The trace is the costly part, so the canvas renders at no more than half a megapixel; the soft ink does not need more.

## InkWipe

```tsx
import { InkWipe } from "@tengubyte/sumi";

<InkWipe src="/hero.webp" width={1200} height={674} alt="Mountains at dawn" blots={[[0.5, 0.5, 0]]} />
```

The image comes in under ink that blooms from up to three blots. The edge spreads unevenly with feathered fibres, pigment pools dark at the front and the wash thins behind it until the picture shows, then the ink dries away.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | The image and its own size in px. |
| `from` | `string` | | An image in the same box that the ink wipes away. |
| `blots` | `[x, y, start][]` | `[[0.5, 0.5, 0]]` | Where, as shares of the image (y down), and when, 0 to 1. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink at the spreading edge. |
| `seed` | `number` | `1` | Changes the shape of the bloom. |
| `duration`, `delay` | `number` | `1.8`, `0` | Seconds the bloom takes, and seconds to wait once in view. |
| `className`, `style` | | | Width alone keeps the image's shape. |

Like `BrushReveal`, it ends on the image's own pixels and hands back to a plain image.

## inkTransition

```tsx
import { inkTransition } from "@tengubyte/sumi";
import { flushSync } from "react-dom";

<button onClick={(e) => inkTransition(() => flushSync(() => setPage("water")), {
  from: [e.clientX / innerWidth, e.clientY / innerHeight],
})}>
```

Ink floods the window from a point until nothing shows, `swap` runs, then paper opens from the same point and pushes the ink off the edges. Call it with the change to make. It plays once per call and resolves when the ink has gone. If `swap` returns a promise, the ink stays down until it settles, so a route that loads data is covered until it is ready. Make the change synchronous, as `flushSync` does for React state, so the new page is in place before the ink opens.

| Option | Type | Default | What it does |
|---|---|---|---|
| `from` | `[x, y]` | `[0.5, 0.5]` | Where the ink floods from, as shares of the covered box. |
| `to` | `[x, y]` | `from` | Where the paper opens from. Outside 0 to 1 is past an edge. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink. |
| `seed` | `number` | `1` | Changes the shape of the fronts. |
| `duration` | `number` | `1.6` | Seconds for the flood and the opening, not counting the wait for `swap`. |
| `within` | `HTMLElement` | the window | Cover a positioned element instead, such as a carousel. |

Clicks pass through the ink to the page under it. With reduced motion, or without WebGL, it just calls `swap`.

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

The splat is drawn in code from the seed. Size the canvas with CSS; the splat scales with its width. With the defaults the pool lands just past the right edge, so only its fingers and drops reach in.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `seed` | `number` | `3.7` | Changes every finger, bead and droplet. |
| `angle` | `number` | `160` | Direction of travel, degrees clockwise from pointing right. |
| `x`, `y` | `number` | `1.04`, `0.3` | Where the pool lands, as a share of the canvas. |
| `size` | `number` | `0.12` | Pool radius as a share of the canvas width. |
| `color` | `` `#${string}` `` | `"#d8001a"` | The main ink. |
| `underColor` | `` `#${string}` \| null `` | `"#161314"` | A smaller second splat under the first, or `null`. On dark backgrounds use a lighter charcoal. |
| `mist` | `number` | `0.55` | How much mist, 0 to 1. |
| `duration`, `delay` | `number` | `2.2`, `0` | Seconds until the last mist lands, and seconds to wait once in view. |

## Without React

```ts
import { dropInk, floatInk, inkTransition, paintEnso, paintIn, paintMark, paintSansui, paintStrokes, pressSeal, throwSplat, wipeIn } from "@tengubyte/sumi/core";

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
const stopSeal = pressSeal(document.querySelector("canvas.seal")!, "天狗", { shape: "tall", white: true });
const stopDrop = dropInk(document.querySelector("canvas.water")!, { drops: [[0.5, 0.1]] });
await inkTransition(() => showPage("water"), { from: [0.9, 0.1] });
```

Each call returns its cleanup, except `inkTransition`, which returns a promise.

## What every effect does

- Plays once, when it has scrolled a little way into view. `inkTransition` plays once per call.
- With `prefers-reduced-motion: reduce` it shows the last frame: the finished art, the settled water, the pressed seal or the landed splat. `inkTransition` just swaps.
- Without WebGL, `BrushReveal` and `InkWipe` show the plain image, `BrushMark` shows the plain words, `inkTransition` just swaps, and the canvas effects show nothing.
- `BrushReveal` and `InkWipe` end on the image's own pixels, hand back to the plain image and release their WebGL context, and `inkTransition` removes its canvas once the ink has gone. The canvas effects keep their last frame and redraw it on resize.
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
