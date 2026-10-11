import type { JSX } from "react";
import { Code } from "./parts";

type Row = readonly [name: string, type: string, defaultValue: string, what: string];

const REVEAL: readonly Row[] = [
  ["src", "string", "required", "Brush art on a transparent background."],
  ["width, height", "number", "required", "The art's own size, so the page reserves its space."],
  ["sweep", '"line" | "ring"', '"line"', "Left to right, or clockwise round the centre."],
  ["startAngle", "number", "0", "Ring only: where the stroke starts, degrees clockwise from 3 o'clock."],
  ["duration", "number", "1.4", "Seconds the stroke takes."],
  ["delay", "number", "0", "Seconds to wait once it is in view."],
  ["ease", "(t) => number", "joHaKyu", "Time to progress, both 0 to 1. Pass a stable function."],
  ["alt, className, style", "", "", "Alt is empty by default. Width alone keeps the art's shape."],
];

const SPLAT: readonly Row[] = [
  ["seed", "number", "3.7", "Changes every finger, bead and droplet."],
  ["angle", "number", "160", "Direction of travel, degrees clockwise from pointing right."],
  ["x, y", "number", "1.04, 0.3", "Where the pool lands, as a share of the canvas. Above 1 is past the edge."],
  ["size", "number", "0.12", "Pool radius as a share of the canvas width."],
  ["color", "#rrggbb", '"#d8001a"', "The main ink."],
  ["underColor", "#rrggbb | null", '"#161314"', "A smaller second splat under it, or null for none."],
  ["mist", "number", "0.55", "How much mist, 0 to 1."],
  ["duration, delay", "number", "2.2, 0", "Seconds until the last mist lands, and to wait once in view."],
  ["className, style", "", "", "Size the canvas here; the splat scales with its width."],
];

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
      <h3>InkSplat</h3>
      <Props rows={SPLAT} label="InkSplat props" />
      <h3>Without React</h3>
      <p>The same effects work on plain elements. Each call returns its cleanup.</p>
      <Code>{`import { paintIn, throwSplat } from "@tengubyte/sumi/core";

// The image must fill a positioned parent; the brush draws on a canvas over it.
const stopPaint = paintIn(document.querySelector("img.enso"), { sweep: "ring" });
const stopSplat = throwSplat(document.querySelector("canvas.splat"), { seed: 12 });`}</Code>
      <h3>What every effect does</h3>
      <ul className="facts">
        <li>Plays once, when it has scrolled a little way into view.</li>
        <li>With reduced motion it shows the last frame: the finished art, or the landed splat.</li>
        <li>Without WebGL, BrushReveal shows the plain image and InkSplat shows nothing.</li>
        <li>BrushReveal releases its WebGL context as soon as the stroke lands. InkSplat keeps its last frame.</li>
        <li>No dependencies besides React, which the core does not need.</li>
      </ul>
    </section>
  );
}
