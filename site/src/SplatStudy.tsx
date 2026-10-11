import { InkSplat, type Hex } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Code, Range, Study } from "./parts";

// True sumi disappears on dark paper, so the second ink lifts to a warm charcoal there.
export const sumiFor = (dark: boolean): Hex => (dark ? "#5c4f52" : "#161314");

export function SplatStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [seed, setSeed] = useState(3.7);
  const [angle, setAngle] = useState(160);
  const [mist, setMist] = useState(0.55);
  const [second, setSecond] = useState(true);
  const underColor = second ? sumiFor(dark) : null;
  const shuffle = (): void => {
    setSeed(Math.round(Math.random() * 900) / 10 + 1);
  };
  return (
    <Study
      id="splat"
      kanji="飛"
      title="Throw a splat"
      what="InkSplat"
      stage={
        <InkSplat
          seed={seed}
          angle={angle}
          mist={mist}
          underColor={underColor}
          style={{ display: "block", width: "calc(100% + 48px)", margin: -24, aspectRatio: "360 / 396" }}
        />
      }
    >
      <p>
        No art at all. The splat is drawn in code: a pool with fingers that grow longest along the throw, beads off
        their tips, droplets that streak while they fly and skid when they land, a smaller second ink under it,
        and a fine mist.
      </p>
      <p>
        Every seed gives a different splat. With the pool past the edge of the canvas, as here, only the fingers
        and drops reach in.
      </p>
      <div className="controls">
        <button type="button" className="primary" onClick={shuffle}>
          New seed
        </button>
        <Range label="Angle" value={angle} min={90} max={270} step={5} unit="°" onChange={setAngle} />
        <Range label="Mist" value={mist} min={0} max={1} step={0.05} onChange={setMist} />
        <label>
          <input type="checkbox" checked={second} onChange={(e) => { setSecond(e.target.checked); }} />
          Second ink
        </label>
      </div>
      <Code>{`<InkSplat
  seed={${String(seed)}}
  angle={${String(angle)}}
  mist={${String(mist)}}
  underColor={${underColor === null ? "null" : `"${underColor}"`}}
  style={{ width: 360, aspectRatio: "360 / 396" }}
/>`}</Code>
    </Study>
  );
}
