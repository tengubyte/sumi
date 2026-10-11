import type { JSX } from "react";
import { BRUSH, ENSO, FLOAT, MARK, REVEAL, SANSUI, SPLAT, WIPE, type Row } from "./apiRows";
import { Code } from "./parts";

function Props({ rows, label }: { readonly rows: readonly Row[]; readonly label: string }): JSX.Element {
  return (
    <div className="table-scroll">
      <table aria-label={label}>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, value, what]) => (
            <tr key={name}>
              <td><code>{name}</code></td>
              <td><code>{type}</code></td>
              <td><code>{value}</code></td>
              <td>{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Api(): JSX.Element {
  return (
    <section id="api" className="study" aria-labelledby="api-title">
      <h2 id="api-title">API</h2>
      <h3>BrushReveal</h3>
      <Props rows={REVEAL} label="BrushReveal props" />
      <h3>BrushPaint</h3>
      <Props rows={BRUSH} label="BrushPaint props" />
      <h3>BrushMark</h3>
      <Props rows={MARK} label="BrushMark props" />
      <h3>Enso</h3>
      <Props rows={ENSO} label="Enso props" />
      <h3>Suminagashi</h3>
      <Props rows={FLOAT} label="Suminagashi props" />
      <h3>InkWipe</h3>
      <Props rows={WIPE} label="InkWipe props" />
      <h3>Sansui</h3>
      <Props rows={SANSUI} label="Sansui props" />
      <h3>InkSplat</h3>
      <Props rows={SPLAT} label="InkSplat props" />
      <h3>Without React</h3>
      <p>The same effects work on plain elements. Each call returns its cleanup.</p>
      <Code>{`import { floatInk, paintEnso, paintIn, paintMark, paintSansui, paintStrokes, throwSplat, wipeIn } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas over it.
const stopPaint = paintIn(document.querySelector("img.enso"), { sweep: "ring" });
const stopWrite = paintStrokes(document.querySelector("canvas.kanji"), svgMarkup, { weight: 0.03 });
const stopEnso = paintEnso(document.querySelector("canvas.enso"), { seed: 42 });
const stopFloat = floatInk(document.querySelector("canvas.water"), { pattern: "rings" });
const stopSplat = throwSplat(document.querySelector("canvas.splat"), { seed: 12 });
// A positioned, one-line element; the image must fill a positioned parent.
const stopMark = paintMark(document.querySelector("span.key"), "circle");
const stopWipe = wipeIn(document.querySelector("img.hero"), { blots: [[0.5, 0.5, 0]] });
const stopHills = paintSansui(document.querySelector("canvas.hills"), { seed: 8 });`}</Code>
      <h3>What every effect does</h3>
      <ul className="facts">
        <li>Plays once, when it has scrolled a little way into view.</li>
        <li>With reduced motion it shows the last frame: the finished art, the settled water or the landed splat.</li>
        <li>Without WebGL, BrushReveal and InkWipe show the plain image, BrushMark the plain words, and the others nothing.</li>
        <li>BrushReveal and InkWipe release their WebGL context as soon as they land. The others keep their last frame.</li>
        <li>No dependencies besides React, which the core does not need.</li>
      </ul>
    </section>
  );
}
