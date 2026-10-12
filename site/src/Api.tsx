import type { JSX } from "react";
import { Code } from "./parts";

/** What applies to every effect, and the core calls for pages without React. Each effect's props sit under its demo. */
export function Api(): JSX.Element {
  return (
    <section id="api" className="study" aria-labelledby="api-title">
      <h2 id="api-title">Without React</h2>
      <p>
        The same effects work on plain elements. Each call returns its cleanup, except inkTransition, which returns
        a promise that resolves when the ink has gone.
      </p>
      <Code>{`import { colorIn, dropInk, floatInk, focusLines, hakeIn, inkTransition, paintEnso, paintHake, paintIn, paintMark, paintSansui, paintStrokes, pressSeal, riseEmbers, strikeKanji, tearBand, tearIn, throwSplat, wipeIn } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas over it.
const stopPaint = paintIn(document.querySelector("img.enso"), { sweep: "ring" });
const stopWrite = paintStrokes(document.querySelector("canvas.kanji"), svgMarkup, { weight: 0.03 });
const stopEnso = paintEnso(document.querySelector("canvas.enso"), { seed: 42 });
const stopFloat = floatInk(document.querySelector("canvas.water"), { pattern: "rings" });
const stopSplat = throwSplat(document.querySelector("canvas.splat"), { seed: 12 });
// A positioned, one-line element; the image must fill a positioned parent.
const stopMark = paintMark(document.querySelector("span.key"), "circle");
const stopWipe = wipeIn(document.querySelector("img.hero"), { blots: [[0.5, 0.5, 0]] });
const stopHills = paintSansui(document.querySelector("canvas.hills"), { seed: 8 });
const stopSeal = pressSeal(document.querySelector("canvas.seal"), "天狗", { shape: "tall", white: true });
const stopDrop = dropInk(document.querySelector("canvas.water"), { drops: [[0.5, 0.1]] });
const stopStrike = strikeKanji(document.querySelector("canvas.death"), "死", { glow: true });
// The image must fill a positioned parent; the tear runs on a canvas over it.
const stopTear = tearIn(document.querySelector("img.scroll"), { tear: "frame" });
const stopBand = tearBand(document.querySelector("canvas.edge"), { side: "top" });
// The image must fill a positioned parent; the colour and the brush run on a canvas over it.
const stopColor = colorIn(document.querySelector("img.view"), { seed: 2 });
const stopCut = hakeIn(document.querySelector("img.header"), { angle: -16 });
const stopSwash = paintHake(document.querySelector("canvas.swash"), { color: "#c99e2b", bend: -0.5 });
const stopLines = focusLines(document.querySelector("canvas.lines"), { focus: [0.6, 0.4] });
const stopFire = riseEmbers(document.querySelector("canvas.fire"), { wind: 0.3 });
await inkTransition(() => showPage("water"), { from: [0.9, 0.1] });`}</Code>
      <h3>What every effect does</h3>
      <ul className="facts">
        <li>Plays once, when it has scrolled a little way into view. inkTransition plays once per call, and Hinoko and Shuchusen run while they are on screen.</li>
        <li>With reduced motion it shows the last frame: the finished art, the settled water, the torn frame or the landed splat. inkTransition just swaps, a torn cover is already off, Irodori shows the plain image, focus lines hold still and no embers rise.</li>
        <li>Without WebGL, BrushReveal, InkWipe, Irodori, HakeCut and TornEdge show the plain image, BrushMark the plain words, inkTransition just swaps, and the others show nothing.</li>
        <li>BrushReveal, InkWipe, Irodori, a torn cover and inkTransition release their WebGL context as soon as they finish. The others keep their last frame.</li>
        <li>No dependencies besides React, which the core does not need.</li>
      </ul>
    </section>
  );
}
