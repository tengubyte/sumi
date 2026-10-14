import { ensoStroke, Fude, type FudeHandle } from "@tengubyte/sumi";
import { useCallback, useRef, useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study } from "./parts";

type Surface = "paper" | "picture";
type Ink = "sumi" | "red";

const RED = "#d8001a";

const CODE = `const brush = useRef<FudeHandle>(null);

<Fude
  ref={brush}
  label="Drawing area"
  onDrawing={setBrushing}
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>

brush.current?.trace(ensoStroke());`;

// Runs `start` once most of `el` is on screen. InView mounts demos a screen early, so mounting is too soon.
function whenSeen(el: Element, start: () => void): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { threshold: 0.6 },
  );
  observer.observe(el);
  return () => {
    observer.disconnect();
  };
}

export function FudeStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const pad = useRef<FudeHandle>(null);
  const [surface, setSurface] = useState<Surface>("paper");
  const [ink, setInk] = useState<Ink>("sumi");
  const [brushing, setBrushing] = useState(false);
  const picture = surface === "picture";
  const aspect = picture ? 3 / 2 : 4 / 3;
  const enso = (): void => {
    void pad.current?.trace(ensoStroke(aspect));
  };
  // An ensō on arrival, so the sheet shows what it does before anyone draws. A callback ref, because the
  // stage mounts later than this component; the stage's key draws a new one for each surface and ink.
  const arrive = useCallback((el: HTMLDivElement | null) => (el ? whenSeen(el, () => void pad.current?.trace(ensoStroke(aspect))) : undefined), [aspect]);
  const stage = (
    <div key={`${surface} ${ink}`} ref={arrive} className={picture ? `fude-over${brushing ? " brushing" : ""}` : undefined}>
      {picture && <img src="/art/scene.webp" width={1200} height={800} alt="A red sun over blue hills and cherry blossom" />}
      <Fude ref={pad} label="Drawing area: draw with a mouse, finger or pen" color={ink === "red" ? RED : inkFor(dark)} onDrawing={setBrushing} style={{ display: "block", width: "100%", aspectRatio: String(aspect) }} />
    </div>
  );
  return (
    <Study id="fude" kanji="描" title="Draw with a brush" what="Fude" stage={stage}>
      <p>
        A sumi brush to draw with. It goes in thin and presses, runs thinner and greyer when fast, and dries out
        bristle by bristle into streaks. A slow lift stops round; a quick one flicks off to a dry point. A pen&apos;s
        pressure changes the width.
      </p>
      <p>
        Draw on the demo with a mouse, a finger or a pen. The strokes fade once the hand rests. onDrawing lets the
        page change while the brush is down; here the picture turns sepia.
      </p>
      <div className="controls">
        <Choice label="Surface" options={[["paper", "Paper"], ["picture", "Picture"]]} value={surface} onChange={setSurface} />
        <Choice label="Ink" options={[["sumi", "Sumi"], ["red", "Vermilion"]]} value={ink} onChange={setInk} />
        <button type="button" className="primary" onClick={enso}>
          Draw an ensō for me
        </button>
        <button
          type="button"
          onClick={() => {
            pad.current?.clear();
          }}
        >
          Clear
        </button>
      </div>
      <Code>{CODE}</Code>
    </Study>
  );
}
