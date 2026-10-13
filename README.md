# sumi

Twenty-one brush and ink effects for React, listed in the table below. Each one is a WebGL shader. Most play once as they scroll into view; `inkTransition` plays each time it is called, `Hinoko`, `Kaen` and `Shuchusen` run while they are on screen, and `Fude` is a brush the visitor draws with. React is the only dependency, and the core works without it.

Live demos: [sumi.tengubyte.io/effects](https://sumi.tengubyte.io/effects)

Sumi (墨) is the ink of Japanese brush painting. Made by [TenguByte](https://tengubyte.io).

| Effect | What it does | Demo |
| --- | --- | --- |
| [BrushReveal](#brushreveal) | Paints brush art in the way the stroke was laid | [ring](https://sumi.tengubyte.io/effects#ring) |
| [BrushPaint](#brushpaint) | Writes an SVG's strokes with a brush | [kanji](https://sumi.tengubyte.io/effects#brush) |
| [BrushMark](#brushmark) | Paints a mark round words | [marks](https://sumi.tengubyte.io/effects#mark) |
| [Hanko](#hanko) | Presses a seal | [seal](https://sumi.tengubyte.io/effects#hanko) |
| [KanjiStrike](#kanjistrike) | Strikes one character in a single brush sweep | [strike](https://sumi.tengubyte.io/effects#strike) |
| [Enso](#enso) | Draws an ensō from a seed | [ensō](https://sumi.tengubyte.io/effects#enso) |
| [Fude](#fude) | A sumi brush the visitor draws with | [draw](https://sumi.tengubyte.io/effects#fude) |
| [Suminagashi](#suminagashi) | Floats ink on water | [water](https://sumi.tengubyte.io/effects#float) |
| [InkDrop](#inkdrop) | Drops ink into still water | [drop](https://sumi.tengubyte.io/effects#drop) |
| [InkWipe](#inkwipe) | Brings an image in under ink | [image](https://sumi.tengubyte.io/effects#wipe) |
| [inkTransition](#inktransition) | Changes the page under ink | [page](https://sumi.tengubyte.io/effects#transition) |
| [TornEdge](#tornedge) | Tears paper round a picture or across a section | [tear](https://sumi.tengubyte.io/effects#torn) |
| [Irodori](#irodori) | Colours a picture in from wet blooms | [colour](https://sumi.tengubyte.io/effects#irodori) |
| [HakeCut](#hakecut) | Brushes a picture in with a wide flat brush, or drags one stroke | [hake](https://sumi.tengubyte.io/effects#hake) |
| [Tachigami](#tachigami) | Cuts a picture or a word with one slash | [slash](https://sumi.tengubyte.io/effects#slash) |
| [Sansui](#sansui) | Paints ink-wash mountains | [hills](https://sumi.tengubyte.io/effects#sansui) |
| [InkSplat](#inksplat) | Throws an ink splat | [splat](https://sumi.tengubyte.io/effects#splat) |
| [Hinoko](#hinoko) | Sends up embers | [embers](https://sumi.tengubyte.io/effects#embers) |
| [Kaen](#kaen) | Sets fire along an edge, round a character or round a picture | [fire](https://sumi.tengubyte.io/effects#fire) |
| [Shuchusen](#shuchusen) | Draws manga focus lines or speed lines | [lines](https://sumi.tengubyte.io/effects#focus) |
| [Hanasaka](#hanasaka) | Brings a cherry branch into bloom | [bloom](https://sumi.tengubyte.io/effects#bloom) |

The core calls for pages without React are under [Without React](#without-react).

## Install

```sh
npm install github:tengubyte/sumi#v0.9.0
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

## KanjiStrike

```tsx
import { KanjiStrike } from "@tengubyte/sumi";

<KanjiStrike text="死" label="Death" font='"Yuji Syuku"' glow style={{ width: 320, aspectRatio: "1" }} />
```

One character in one sweep of the brush. The front of the sweep is streaky with bristles, the brush runs dry toward the end, and drops fly off where it stops. It lands a little large and shakes, then the ink creeps a short way into the paper. It suits alerts, error pages and title cards.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `text` | `string` | required | One character, or two. |
| `label` | `string` | | What it means. Without it the canvas is hidden from assistive technology. |
| `font`, `weight` | `string`, `number` | a Mincho stack, `700` | A CSS font family you load. The strike waits for it. A brush face such as Yuji Syuku suits it. |
| `color` | `` `#${string}` `` | `"#d8001a"` | The ink. |
| `angle` | `number` | `-20` | Direction of the sweep, degrees clockwise from pointing right. |
| `glow` | `boolean` | `false` | A red halo, for dark pages. |
| `seed` | `number` | `1` | Changes the streaks and the drops. |
| `speed`, `delay` | `number` | `1`, `0` | It takes 1.8 seconds at speed 1. |
| `className`, `style` | | | Size the canvas here; the character takes 92% of its shorter side. |

## Enso

```tsx
import { Enso } from "@tengubyte/sumi";

<Enso seed={42} style={{ width: 360, aspectRatio: "1" }} />
```

The same brush given one stroke made from a seed: where it starts, how far round it goes, its wobble, weight and how dry its tail runs. The same seed always draws the same ensō. Takes `seed` (default `7`), `weight` (default from the seed), and `speed`, `color`, `bleed` and `delay` as for `BrushPaint`.

## Fude

```tsx
import { ensoStroke, Fude, type FudeHandle } from "@tengubyte/sumi";

const brush = useRef<FudeHandle>(null);

<Fude ref={brush} label="Drawing area" onDrawing={setDrawing} style={{ width: "100%", aspectRatio: "4 / 3" }} />

// A hand draws an ensō on it.
await brush.current?.trace(ensoStroke());
```

A sumi brush to draw with, by mouse, finger or pen. The brush goes in thin and presses, runs thinner and greyer when fast, and dries out bristle by bristle into streaks. A slow lift stops round; a quick one flicks off to a dry point. A pen's pressure changes the width. The strokes fade once the hand rests, unless `fadeAfter` is 0.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `color` | `` `#${string}` `` | `"#161314"` | The ink. |
| `size` | `number` | `9` | The brush's half width in CSS px at an even pace. |
| `dryAfter` | `number` | `1200` | CSS px of stroke a loaded brush lasts before it runs dry. |
| `fadeAfter` | `number` | `1.6` | Seconds of rest before the strokes fade; 0 keeps them. |
| `onDrawing` | `(drawing: boolean) => void` | | Told when the brush goes down and comes up, to change the page while drawing. |
| `seed` | `number` | `1` | Changes how much ink each bristle holds. |
| `label` | `string` | | What the drawing area is for. Without it the canvas is hidden from assistive technology. |
| `className`, `style` | | | Size the canvas here. A resize wipes it. |

The ref's `trace(stroke)` draws a stroke as a hand would and resolves when the brush lifts; with reduced motion the stroke lands at once. A stroke is `points` as shares of the canvas (y down), with optional `ms`, `pace(share)` and `pressure(share)`. `ensoStroke(aspect?, radius?)` gives a ready one. `clear()` wipes the paper.

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

## TornEdge

```tsx
import { TornBand, TornEdge } from "@tengubyte/sumi";

// The border tears away to a ragged frame.
<TornEdge src="/scroll.webp" width={1200} height={674} alt="A hanging scroll" />

// A paper cover tears off, leaving the plain image.
<TornEdge tear="cover" src="/scroll.webp" width={1200} height={674} alt="A hanging scroll" />

// A dark band whose bottom edge tears across, for the end of a section.
<TornBand color="#161314" style={{ width: "100%", height: 96 }} />
```

Paper torn by hand. The edge wanders at three scales, a thin white core shows where the tear split the sheet, and long fibres reach past it. The torn sheet throws a soft shadow. The tear is measured in pixels, so a thumbnail and a hero tear alike.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | `TornEdge`: the picture, and its own size in px. |
| `tear` | `"frame" \| "cover"` | `"frame"` | `TornEdge`: tear the border off to a ragged frame, which stays, or tear a cover off and end on the plain image. |
| `side` | `"bottom" \| "top"` | `"bottom"` | `TornBand`: which edge of the band is torn. |
| `color` | `` `#${string}` `` | `"#161314"`, cover `"#dbd1bd"` | The band, or the cover's paper. |
| `edge` | `` `#${string}` `` | `"#fdfcfa"` | The white core along the tear. |
| `seed` | `number` | `1` | Changes the path of the tear. |
| `duration`, `delay` | `number` | `1.4` (band `1.6`), `0` | Seconds the tear takes, and seconds to wait once in view. |
| `className`, `style` | | | `TornEdge`: width alone keeps the image's shape. `TornBand`: full width and 80 to 120 px tall suits a section edge. |

## Irodori

```tsx
import { Irodori } from "@tengubyte/sumi";

<Irodori src="/view.webp" width={1200} height={800} alt="A red bridge in spring" blooms={[[0.3, 0.4, 0], [0.75, 0.6, 0.15]]} />
```

The picture starts as an ink wash on paper, then colour seeps in from a few wet blooms. Each bloom has a ragged, lobed edge and a dark rim where the pigment pools, and grows until it meets its neighbours, so fewer blooms take as long as more. Until the colour starts, the browser greys the image, so it never shows in full colour first.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | The picture and its own size in px. |
| `blooms` | `[x, y, start][]` | three | Up to five: where, as shares of the picture (y down), and when, 0 to 0.9 of the run. Outside 0 to 1 starts past an edge. |
| `paper`, `ink` | `` `#${string}` `` | `"#f5f1eb"`, `"#161314"` | The light and the dark of the wash. |
| `seed` | `number` | `1` | Changes the shape of the blooms. |
| `duration`, `delay` | `number` | `2.6`, `0` | Seconds the colour takes, and seconds to wait once in view. |
| `className`, `style` | | | Width alone keeps the image's shape. |

Like `InkWipe`, it ends on the image's own pixels and hands back to a plain image.

## HakeCut

```tsx
import { HakeCut, HakeStroke } from "@tengubyte/sumi";

// The picture keeps the top, above a brushed edge that falls to the right.
<HakeCut src="/header.webp" width={1200} height={800} alt="Castle walls" />

// The picture inside one brushed band.
<HakeCut shape="band" thickness={0.5} src="/header.webp" width={1200} height={800} alt="Castle walls" />

// One gold stroke, arching as it climbs.
<HakeStroke color="#c99e2b" thickness={0.22} bend={-0.5} angle={20} style={{ width: "100%", aspectRatio: "4 / 3" }} />
```

One pass of a hake, the wide flat brush. Its bristles leave long streaks along the way it travels, the edges break up where the brush runs dry, and the head shows bristle tips as it moves. The bristles are measured in pixels, so they stay fine at any size. The brushed edge stays: the canvas keeps its last frame over the hidden image and redraws it on resize.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | `HakeCut`: the picture and its own size in px. |
| `shape` | `"edge" \| "band"` | `"edge"` | `HakeCut`: keep the picture on one side of a brushed edge, or inside one band. |
| `side` | `"top" \| "bottom"` | `"top"` | `HakeCut`: which side of the edge keeps the picture. |
| `offset` | `number` | `0.2` (band `0`) | `HakeCut`: how far below the middle the edge or band runs, as a share of the height. |
| `thickness` | `number` | `0.6` (stroke `0.3`) | The band's share of the height, or the stroke's share of the canvas's shorter side. |
| `streaks` | `number` | `0` | `HakeCut`: white streaks laid over the picture along its edge, 0 to 1. |
| `color` | `` `#${string}` `` | `"#161314"` | `HakeStroke`: the paint. |
| `bend` | `number` | `0` | `HakeStroke`: positive sags in the middle, negative arches. |
| `angle` | `number` | `-12` (stroke `0`) | The way the brush travels, in degrees. Positive climbs. |
| `seed` | `number` | `1` | Changes the bristles. |
| `duration`, `delay` | `number` | `1.3` (stroke `1`), `0` | Seconds the stroke takes, and seconds to wait once in view. |
| `className`, `style` | | | `HakeCut`: width alone keeps the image's shape. `HakeStroke`: size the canvas; the stroke runs through its middle. |

## Tachigami

```tsx
import { Tachigami, TachigamiText } from "@tengubyte/sumi";

// The top half sticks, slips down the cut and falls away.
<Tachigami src="/duel.webp" width={1200} height={800} alt="Two swordsmen at dawn" mode="fall" />

// A word cut in two with vermilion ink, the halves left apart.
<TachigamiText text="一閃" label="Issen, one flash" mode="apart" font='"Yuji Syuku"' color="#d8001a" style={{ width: "100%", aspectRatio: "4 / 3" }} />
```

One slash of the brush. A dry ink stroke tears across, spraying drops, and the two halves shear apart along it with dark cut faces. By default they close again and the picture hands back to a plain image. `mode="apart"` leaves them parted, and `mode="fall"` lets the top half stick, slip down the cut and tip away; both stay on a canvas over the hidden image. `TachigamiText` draws its text from the font into a canvas and cuts that.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src`, `width`, `height`, `alt` | | required | `Tachigami`: the picture and its own size in px. |
| `text`, `label` | `string` | required, none | `TachigamiText`: the word, and what it says for screen readers. |
| `mode` | `"rejoin" \| "apart" \| "fall"` | `"rejoin"` | Close the cut again, leave the halves parted, or let the top half fall. |
| `through` | `[x, y]` | `[0.5, 0.5]` | A point the cut passes through, as shares of the box (y down). |
| `angle` | `number` | `17` | The slash's direction in degrees. Positive climbs. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink of the stroke, the spray and the cut faces. |
| `glint` | `boolean` | `false` | A white core along the blade, for dark pages. |
| `font`, `weight`, `textColor` | | Mincho, `900`, `"#161314"` | `TachigamiText`: how the word is drawn. The font loads before the cut. |
| `seed` | `number` | `1` | Changes the stroke's streaks and the spray. |
| `duration`, `delay` | `number` | `1.6` (fall `2`), `0` | Seconds the cut takes, and seconds to wait once in view. |
| `className`, `style` | | | `Tachigami`: width alone keeps the image's shape. `TachigamiText`: size the canvas. |

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

## Hinoko

```tsx
import { Hinoko } from "@tengubyte/sumi";

<div style={{ position: "relative", background: "#100d0e" }}>
  <img src="/castle.webp" width={1200} height={674} alt="A castle on fire" />
  <Hinoko wind={0.3} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
</div>
```

Embers off a fire. Each one leaves hot and nearly white, cools to red as it climbs, and sways in the eddies over the heat. A few are flakes of ash that tumble. Embers are light, so they add up on a dark page and vanish on a light one.

Unlike the other effects it keeps going: the fire runs while the canvas is on screen and stops costing anything when it scrolls away. With `burst` it throws one shower once in view and lets it die down. With reduced motion nothing rises.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `count` | `number` | `120` | Embers in the air at once, at most 400. |
| `burst` | `boolean` | `false` | One shower that dies down, instead of a fire that keeps going. |
| `from` | `[x, y]` | `[0.5, 1]` | Where they leave from, as shares of the canvas (y down). |
| `spread` | `number` | `1` (burst `0.1`) | The share of the width they leave across. |
| `wind` | `number` | `0.15` | Sideways drift, -1 to 1. |
| `ash` | `number` | `0.1` | The share that are tumbling flakes of ash. |
| `seed` | `number` | `1` | Changes every ember's path. |
| `speed`, `delay` | `number` | `1`, `0` | 2 runs twice as fast; seconds to wait once in view. |

## Kaen

```tsx
import { Kaen } from "@tengubyte/sumi";

<Kaen style={{ width: "100%", aspectRatio: "2 / 1" }} />
<Kaen text="炎" label="Flame" look="night" style={{ width: 320, aspectRatio: "1" }} />
<Kaen src="/tengu.webp" label="A crow tengu seated on a rock" style={{ width: "100%", aspectRatio: "4 / 3" }} />
```

Fire (火炎) as the Heiji scroll and the Blue Fudo paint it. The flames are one mass: tongues rise to points, sway more the higher they reach and break off at the top while new ones come up from below. Fine pale and dark strands run up each tongue, a pale line runs just inside the outline, and slow whorls turn the flow.

It burns along the bottom edge of the canvas, round a character with `text`, or with `src` round the outline of a picture with a transparent background, and climbs above it. An opaque picture burns round its rectangle, and one from another origin must allow CORS, since the fire reads its pixels. The fire paints its own colours, so pick the `look` for the page: `"shu"` and `"sumi"` for paper, `"night"` for a dark page. Like `Hinoko` it runs while the canvas is on screen; with reduced motion it holds one frame of the grown fire. It needs WebGL's standard derivatives, which nearly every browser has.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `text` | `string` | none | One character, or two, to set alight. Without it, or `src`, the fire burns along the bottom edge. |
| `src` | `string` | none | A picture with a transparent background to set alight round its outline, in place of `text`. |
| `label` | `string` | none | What the character or picture shows. Without it the canvas is hidden from assistive technology. |
| `look` | `"shu" \| "sumi" \| "night"` | `"shu"` | Vermilion on paper, black ink, or brighter for a dark page. |
| `reach` | `number` | `0.6` (`text`, `src` `0.13`) | How high the flames climb, as a share of the canvas's shorter side. |
| `font`, `weight` | `string`, `number` | a Mincho stack, `700` | A CSS font family you load. The fire waits for it. |
| `color` | `` `#${string}` `` | by look | The character: sumi on `"shu"`, vermilion on `"sumi"`, paper white on `"night"`. |
| `seed` | `number` | `1` | Changes every tongue and whorl. |
| `speed`, `delay` | `number` | `1`, `0` | 2 burns twice as fast; seconds to wait once in view. |

## Shuchusen

```tsx
import { Shuchusen } from "@tengubyte/sumi";

<div style={{ position: "relative", aspectRatio: "4 / 3" }}>
  <Shuchusen focus={[0.6, 0.4]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
  <h2>斬</h2>
</div>
```

Manga focus lines (集中線). Spikes shoot in from past the edges, taper to points round a clear oval and are drawn anew ten times a second, so they shiver the way hand-inked frames do. `lines="speed"` streams spindles past side by side instead. Like `Hinoko` it runs while the canvas is on screen; with reduced motion it holds one still drawing.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `lines` | `"focus" \| "speed"` | `"focus"` | Lines that run in toward a point, or stream past side by side. |
| `focus` | `[x, y]` | `[0.5, 0.5]` | The point they run toward, as shares of the canvas (y down). |
| `clear` | `[x, y]` | `[0.32, 0.3]` | Half the width and half the height of the clear oval, as shares of the canvas. |
| `count` | `number` | `150` | How many lines go round, 8 to 600. |
| `weight` | `number` | `1` | Line thickness; 2 is twice as heavy. |
| `color` | `` `#${string}` `` | `"#161314"` | The ink. |
| `fps` | `number` | `10` | How often the lines are drawn anew; 0 keeps one drawing. |
| `angle`, `speed` | `number` | `0`, `1` | Speed lines: their direction in degrees, and how fast they stream. |
| `seed`, `delay` | `number` | `1`, `0` | Changes every line; seconds to wait once in view. |

## Hanasaka

```tsx
import { Hanasaka } from "@tengubyte/sumi";

<Hanasaka from={[1.04, 0.06]} angle={-146} style={{ width: "100%", aspectRatio: "4 / 3" }} />
```

A cherry branch brushed in stroke by stroke, thick at the start and thinning as it forks. Buds swell along it and blossoms burst open one after another, each with an ink outline and a dark heart. Then a few petals let go and tumble away on the wind. The last frame, the branch in full bloom, stays. It is decoration, hidden from assistive technology.

| Prop | Type | Default | What it does |
|---|---|---|---|
| `from` | `[x, y]` | `[-0.04, 0.8]` | Where the branch starts, as shares of the canvas (y down). Past an edge, it grows in from outside. |
| `angle` | `number` | `26` | The way it grows, in degrees. Positive climbs. |
| `reach` | `number` | `1` | How far it grows. |
| `flowers`, `petals` | `number` | `22`, `10` | Blossoms along the branch, up to 28, and petals that fall, up to 16. |
| `wind` | `[x, y]` | `[0.06, 0.02]` | Where the falling petals drift, per second, as shares of the shorter side (y down). |
| `bark`, `outline` | `` `#${string}` `` | `"#291f1c"`, `"#3b1f26"` | The branch's ink, and the line round each petal. |
| `pink`, `heart` | `` `#${string}` `` | `"#f7bfd1"`, `"#db6185"` | The petals, and the deep pink at each flower's heart. |
| `seed` | `number` | `1` | Grows a different branch. |
| `duration`, `delay` | `number` | `5`, `0` | Seconds from the first stroke to the last petal, and seconds to wait once in view. |

## Without React

```ts
import { bloomBranch, colorIn, dropInk, ensoStroke, floatInk, focusLines, fudePad, hakeIn, inkTransition, kindleFire, paintEnso, paintHake, paintIn, paintMark, paintSansui, paintStrokes, pressSeal, riseEmbers, slashIn, slashText, strikeKanji, tearBand, tearIn, throwSplat, wipeIn } from "@tengubyte/sumi/core";

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
const stopStrike = strikeKanji(document.querySelector("canvas.death")!, "死", { glow: true });
// The image must fill a positioned parent; the tear runs on a canvas laid over it.
const stopTear = tearIn(document.querySelector("img.scroll")!, { tear: "frame" });
const stopBand = tearBand(document.querySelector("canvas.edge")!, { side: "top" });
// The image must fill a positioned parent; the colour and the brush run on a canvas laid over it.
const stopColor = colorIn(document.querySelector("img.view")!, { seed: 2 });
const stopCut = hakeIn(document.querySelector("img.header")!, { angle: -16 });
const stopSwash = paintHake(document.querySelector("canvas.swash")!, { color: "#c99e2b", bend: -0.5 });
const stopLines = focusLines(document.querySelector("canvas.lines")!, { focus: [0.6, 0.4] });
const stopEmbers = riseEmbers(document.querySelector("canvas.embers")!, { wind: 0.3 });
const stopFire = kindleFire(document.querySelector("canvas.fire")!, { text: "炎", look: "night" });
// The image must fill a positioned parent; the cut runs on a canvas laid over it.
const stopSlash = slashIn(document.querySelector("img.duel")!, { mode: "fall" });
const stopWord = slashText(document.querySelector("canvas.word")!, "一閃", { color: "#d8001a" });
const stopBloom = bloomBranch(document.querySelector("canvas.branch")!, { seed: 5 });
const pad = fudePad(document.querySelector("canvas.sheet")!, { fadeAfter: 0 });
await pad?.trace(ensoStroke());
await inkTransition(() => showPage("water"), { from: [0.9, 0.1] });
```

Each call returns its cleanup, except `inkTransition`, which returns a promise, and `fudePad`, which returns a pad with `trace`, `clear` and `stop`, or null without WebGL.

## What every effect does

- Plays once, when it has scrolled a little way into view. `inkTransition` plays once per call, `Hinoko`, `Kaen` and `Shuchusen` run while they are on screen, and `Fude` draws when the visitor does.
- With `prefers-reduced-motion: reduce` it shows the last frame: the finished art, the settled water, the pressed seal, the torn frame, the brushed edge, the parted halves, the branch in bloom or the landed splat. `inkTransition` just swaps, a torn cover is already off, `Irodori` and a closed `Tachigami` cut show the plain image, focus lines and fire hold still, no embers rise and a traced `Fude` stroke lands at once.
- Without WebGL, `BrushReveal`, `InkWipe`, `Irodori`, `HakeCut`, `Tachigami` and `TornEdge` show the plain image, `BrushMark` shows the plain words, `inkTransition` just swaps, and the canvas effects show nothing.
- `BrushReveal`, `InkWipe`, `Irodori`, a closed `Tachigami` cut and a torn cover end on the image's own pixels, hand back to the plain image and release their WebGL context, and `inkTransition` removes its canvas once the ink has gone. The canvas effects, a torn frame, `HakeCut` and parted or fallen halves keep their last frame and redraw it on resize. `Fude` keeps its context while it is on the page.
- Each effect holds one WebGL context while it keeps its last frame, and browsers keep about 16 alive per page. Past that the oldest is dropped and its canvas leaves the page, so spread long runs of effects across pages.
- Every component is marked `"use client"` for React Server Components.

## Development

```sh
npm install
npm run dev     # the showcase site, importing the package from src
npm run check   # types, lint, tests, package build and site build
```

The site in `site/` deploys to Cloudflare Pages from `main`: build command `npm run build:site`, output directory `site/dist`.

## License

The code is MIT licensed. The ensō, band, landscape and tengu art used on the showcase site belong to TenguByte and are not part of the package. The KanjiVG files in `site/src/kanji` are CC BY-SA 3.0, Ulrich Apel, and are not part of the package either.
