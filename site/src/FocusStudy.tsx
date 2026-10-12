import { Shuchusen } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import type { Row } from "./apiRows";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study, useReplay } from "./parts";

const FOCUS: readonly Row[] = [
  ["lines", '"focus" | "speed"', '"focus"', "Lines that run in toward a point, or stream past side by side."],
  ["focus", "[x, y]", "[0.5, 0.5]", "The point they run toward, as shares of the canvas."],
  ["clear", "[x, y]", "[0.32, 0.3]", "Half the width and height of the clear oval round it, as shares of the canvas."],
  ["count", "number", "150", "How many lines go round, 8 to 600."],
  ["weight", "number", "1", "Line thickness. 2 is twice as heavy."],
  ["color", "#rrggbb", '"#161314"', "The ink."],
  ["fps", "number", "10", "How often the lines are drawn anew. 0 keeps one drawing."],
  ["angle, speed", "number", "0, 1", "Speed lines: their direction in degrees, and how fast they stream."],
  ["seed, delay", "number", "1, 0", "Changes every line; seconds to wait once in view."],
  ["className, style", "", "", "Size the canvas here, behind what the lines point at."],
];

type Lines = "focus" | "off" | "speed";

const CODE: Readonly<Record<Lines, string>> = {
  focus: "",
  off: "\n  focus={[0.68, 0.42]}\n  clear={[0.22, 0.34]}\n  count={120}",
  speed: '\n  lines="speed"',
};

export function FocusStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [lines, setLines] = useState<Lines>("focus");
  const off = lines === "off";
  return (
    <Study
      id="focus"
      kanji="集"
      title="Draw focus lines"
      what="Shuchusen"
      props={{ rows: FOCUS, label: "Shuchusen props" }}
      stage={
        <div className="focus-stage">
          <Shuchusen
            key={`${lines} ${String(run)}`}
            lines={lines === "speed" ? "speed" : "focus"}
            focus={off ? [0.68, 0.42] : undefined}
            clear={off ? [0.22, 0.34] : undefined}
            count={off ? 120 : undefined}
            color={inkFor(dark)}
          />
          {lines === "focus" && (
            <span lang="ja" className="focus-word">
              斬
            </span>
          )}
        </div>
      }
    >
      <p>
        Manga focus lines. Spikes shoot in from past the edges, taper to points round a clear oval, and are
        drawn anew ten times a second, so they shiver the way hand-inked frames do. Speed lines stream past side
        by side instead.
      </p>
      <p>
        The lines run only while they are on screen. With reduced motion they hold one still drawing.
      </p>
      <div className="controls">
        <Choice label="Lines" options={[["focus", "Focus"], ["off", "Off centre"], ["speed", "Speed"]]} value={lines} onChange={setLines} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>{`<Shuchusen${CODE[lines]}
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
