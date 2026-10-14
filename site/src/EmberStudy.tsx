import { Hinoko } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Range, Study, useReplay } from "./parts";

type Fire = "fire" | "burst";

export function EmberStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [fire, setFire] = useState<Fire>("fire");
  const [wind, setWind] = useState(0.15);
  const burst = fire === "burst";
  return (
    <Study
      id="embers"
      kanji="火"
      title="Send up embers"
      what="Hinoko"
      stage={
        <div className="night embers">
          <img src="/art/sansui.webp" width={1200} height={674} alt="" />
          <Hinoko key={`${fire} ${String(run)}`} burst={burst} from={burst ? [0.5, 0.9] : undefined} wind={wind} />
        </div>
      }
    >
      <p>
        Embers off a fire. Each one leaves hot and nearly white, cools to red as it climbs, and sways in the eddies
        over the heat. A few are flakes of ash that tumble.
      </p>
      <p>
        Embers are light, so they add up on a dark page and vanish on a light one. The fire runs only while it is
        on screen; a burst throws one shower and lets it die down. With reduced motion nothing rises.
      </p>
      <div className="controls">
        <Choice label="Fire" options={[["fire", "Fire"], ["burst", "Burst"]]} value={fire} onChange={setFire} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <Range label="Wind" value={wind} min={-1} max={1} step={0.05} onChange={setWind} />
      </div>
      <Code>{`<Hinoko${burst ? "\n  burst\n  from={[0.5, 0.9]}" : ""}${wind === 0.15 ? "" : `\n  wind={${String(wind)}}`}
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  }}
/>`}</Code>
    </Study>
  );
}
