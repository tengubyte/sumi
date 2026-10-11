import { BrushPaint, type Hex } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import boku from "./kanji/058a8.svg?raw";
import ei from "./kanji/06c38.svg?raw";
import { BRUSH } from "./apiRows";
import { Choice, Code, Range, Study, useReplay } from "./parts";

// Our own line icon: corners, a circle, and a harai along the bottom.
const MOUNTAIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path data-brush-end="tome" d="M5 37 L17 16 L25 28 L30 21 L43 37"/>
  <circle data-brush-end="tome" cx="35" cy="10" r="4.2"/>
  <path data-brush-end="harai" d="M7 43 C 17 41.2, 29 41.2, 42 42.6"/>
</svg>`;

type ArtName = "ei" | "boku" | "icon";

const ART: Readonly<Record<ArtName, { svg: string; label: string; weight: number }>> = {
  ei: { svg: ei, label: "永", weight: 0.036 },
  boku: { svg: boku, label: "墨", weight: 0.03 },
  icon: { svg: MOUNTAIN, label: "A mountain under the sun", weight: 0.035 },
};

/** Sumi on light paper, its light counterpart on dark paper. */
export const inkFor = (dark: boolean): Hex => (dark ? "#f5f0ef" : "#161314");

export function BrushStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [name, setName] = useState<ArtName>("ei");
  const [scale, setScale] = useState(1);
  const [red, setRed] = useState(false);
  const art = ART[name];
  const weight = Math.round(art.weight * scale * 1000) / 1000;
  const color = red ? "#d8001a" : inkFor(dark);
  return (
    <Study
      id="brush"
      kanji="筆"
      title="Write with a brush"
      what="BrushPaint"
      props={{ rows: BRUSH, label: "BrushPaint props" }}
      stage={<BrushPaint key={`${name} ${String(run)}`} svg={art.svg} label={art.label} weight={weight} color={color} style={{ display: "block", width: "100%", aspectRatio: "1" }} />}
    >
      <p>
        Give it any SVG drawn with strokes and it paints them one by one, in the order they appear, with a brush
        drawn in code. The brush lands and presses, runs lighter through the middle, shoulders into each turn,
        and dries out toward the end.
      </p>
      <p>
        A KanjiVG file gives a character in the right stroke order, and its stroke types set how each stroke
        leaves the paper: stopped, flicked off a hook, or swept out to a point. On any other SVG, set{" "}
        <code>data-brush-end</code> on a shape.
      </p>
      <div className="controls">
        <Choice label="Art" options={[["ei", "永"], ["boku", "墨"], ["icon", "Icon"]]} value={name} onChange={setName} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Weight" value={scale} min={0.6} max={1.6} step={0.1} unit="x" onChange={setScale} />
        <label>
          <input type="checkbox" checked={red} onChange={(e) => { setRed(e.target.checked); }} />
          Red ink
        </label>
      </div>
      <Code>{`// svg: KanjiVG or any stroke SVG, as text
<BrushPaint
  svg={svg}
  label="${art.label}"
  weight={${String(weight)}}
  color="${color}"
  style={{ width: 360, aspectRatio: "1" }}
/>`}</Code>
    </Study>
  );
}
