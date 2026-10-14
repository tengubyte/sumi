import { InkWipe, type Blot, type Hex } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study, useReplay } from "./parts";

type Spread = "one" | "three" | "corner";

const SPREADS: Readonly<Record<Spread, readonly Blot[]>> = {
  one: [[0.5, 0.5, 0]],
  three: [[0.25, 0.3, 0], [0.75, 0.45, 0.15], [0.45, 0.8, 0.3]],
  corner: [[0.04, 0.96, 0]],
};

export function WipeStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [spread, setSpread] = useState<Spread>("one");
  const [over, setOver] = useState(false);
  const [red, setRed] = useState(false);
  const color: Hex = red ? "#d8001a" : inkFor(dark);
  return (
    <Study
      id="wipe"
      kanji="滲"
      title="Bring an image in under ink"
      what="InkWipe"
      stage={
        <InkWipe
          key={`${spread} ${String(over)} ${String(run)}`}
          src="/art/sansui.webp"
          width={1200}
          height={674}
          alt="Ink-wash mountains under a red sun"
          from={over ? "/art/enso.webp" : undefined}
          blots={SPREADS[spread]}
          color={color}
          duration={2}
        />
      }
    >
      <p>
        Ink lands and spreads, and the picture is under it. The edge is uneven, with feathered fibres, and the
        pigment rides the water out to it, so the front is darkest and the wash behind it thins until the image
        shows through. Then the ink dries away.
      </p>
      <p>
        A shader draws the bloom at the image's own size, and each seed grows a different one. The finished image
        is a plain image, as with BrushReveal.
      </p>
      <div className="controls">
        <Choice label="Blots" options={[["one", "One"], ["three", "Three"], ["corner", "Corner"]]} value={spread} onChange={setSpread} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <label>
          <input type="checkbox" checked={over} onChange={(e) => { setOver(e.target.checked); }} />
          Over the ensō
        </label>
        <label>
          <input type="checkbox" checked={red} onChange={(e) => { setRed(e.target.checked); }} />
          Red ink
        </label>
      </div>
      <Code>{`<InkWipe
  src="/sansui.webp"
  width={1200}
  height={674}
  alt="Ink-wash mountains under a red sun"${over ? `\n  from="/enso.webp"` : ""}
  blots={${JSON.stringify(SPREADS[spread])}}
/>`}</Code>
    </Study>
  );
}
