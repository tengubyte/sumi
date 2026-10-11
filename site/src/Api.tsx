import type { JSX } from "react";
import { BRUSH, ENSO, FLOAT, REVEAL, SPLAT, type Row } from "./apiRows";
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
      <h3>Enso</h3>
      <Props rows={ENSO} label="Enso props" />
      <h3>Suminagashi</h3>
      <Props rows={FLOAT} label="Suminagashi props" />
      <h3>InkSplat</h3>
      <Props rows={SPLAT} label="InkSplat props" />
      <h3>Without React</h3>
      <p>The same effects work on plain elements. Each call returns its cleanup.</p>
      <Code>{`import { floatInk, paintEnso, paintIn, paintStrokes, throwSplat } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas over it.
const stopPaint = paintIn(document.querySelector("img.enso"), { sweep: "ring" });
const stopWrite = paintStrokes(document.querySelector("canvas.kanji"), svgMarkup, { weight: 0.03 });
const stopEnso = paintEnso(document.querySelector("canvas.enso"), { seed: 42 });
const stopFloat = floatInk(document.querySelector("canvas.water"), { pattern: "rings" });
const stopSplat = throwSplat(document.querySelector("canvas.splat"), { seed: 12 });`}</Code>
      <h3>What every effect does</h3>
      <ul className="facts">
        <li>Plays once, when it has scrolled a little way into view.</li>
        <li>With reduced motion it shows the last frame: the finished art, the settled water or the landed splat.</li>
        <li>Without WebGL, BrushReveal shows the plain image and the others show nothing.</li>
        <li>BrushReveal releases its WebGL context as soon as the stroke lands. The others keep their last frame.</li>
        <li>No dependencies besides React, which the core does not need.</li>
      </ul>
    </section>
  );
}
