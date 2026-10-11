# sumi

Brush and ink effects for React. `BrushReveal` paints brush art in the way the stroke was laid, and `InkSplat` throws an ink splat drawn in code. Each effect is one WebGL canvas that plays once when it scrolls into view. There are no dependencies besides React, and the core works without React too.

Live demos: [sumi.tengubyte.io](https://sumi.tengubyte.io)

Sumi (墨) is the ink of Japanese brush painting. Made by [TenguByte](https://tengubyte.io).

## Install

```sh
npm install github:tengubyte/sumi#v0.1.0
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
import { paintIn, throwSplat } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas laid over it.
const stopPaint = paintIn(document.querySelector("img.enso")!, { sweep: "ring" });
const stopSplat = throwSplat(document.querySelector("canvas.splat")!, { seed: 12 });
```

Each call returns its cleanup.

## What every effect does

- Plays once, when it has scrolled a little way into view.
- With `prefers-reduced-motion: reduce` it shows the last frame: the finished art, or the landed splat.
- Without WebGL, `BrushReveal` shows the plain image and `InkSplat` shows nothing.
- `BrushReveal` ends on the image's own pixels, hands back to the plain image and releases its WebGL context. `InkSplat` keeps its last frame and redraws it on resize.
- Both components are marked `"use client"` for React Server Components.

## Development

```sh
npm install
npm run dev     # the showcase site, importing the package from src
npm run check   # types, lint, tests, package build and site build
```

The site in `site/` deploys to Cloudflare Pages from `main`: build command `npm run build:site`, output directory `site/dist`.

## License

The code is MIT licensed. The ensō and band art used on the showcase site belong to TenguByte and are not part of the package.
