import { inkTransition, type Hex, type Spot } from "@tengubyte/sumi";
import { useRef, useState, type JSX, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { TRANSITION } from "./apiRows";
import { inkFor } from "./BrushStudy";
import { Code, Study } from "./parts";

const PAGES = [
  { title: "Paint the mountains", text: "Five ridges, brushed from far to near." },
  { title: "Float ink on water", text: "Drops, rings and a slow current." },
] as const;

export function TransitionStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const screen = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [red, setRed] = useState(false);
  const color: Hex = red ? "#d8001a" : inkFor(dark);
  const shown = PAGES[page % 2] ?? PAGES[0];

  const flip = (e: MouseEvent<HTMLButtonElement>, whole: boolean): void => {
    const box = whole || !screen.current ? new DOMRect(0, 0, innerWidth, innerHeight) : screen.current.getBoundingClientRect();
    const from: Spot = [(e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height];
    setBusy(true);
    // flushSync, so the new page is in the DOM before the ink opens over it.
    const swap = (): void => {
      flushSync(() => { setPage((n) => n + 1); });
    };
    void inkTransition(swap, { from, color, within: whole ? undefined : (screen.current ?? undefined) }).finally(() => {
      setBusy(false);
    });
  };

  return (
    <Study
      id="transition"
      kanji="幕"
      title="Change the page under ink"
      what="inkTransition"
      props={{ rows: TRANSITION, label: "inkTransition options" }}
      eager
      stage={
        <div ref={screen} className={`screen page-${String(page % 2)}`}>
          <h3>{shown.title}</h3>
          <p>{shown.text}</p>
        </div>
      }
    >
      <p>
        Ink floods in from where you clicked until nothing shows, the page changes under it, then paper opens
        from the same spot and pushes the ink off the edges with a grey wash at the opening.
      </p>
      <p>
        inkTransition is a function you call with the change to make. It waits for that change, so a route
        that loads data stays covered until it is ready. Each call plays once; reduced motion just swaps.
      </p>
      <div className="controls">
        <button type="button" className="primary" disabled={busy} onClick={(e) => { flip(e, false); }}>
          Change page
        </button>
        <button type="button" disabled={busy} onClick={(e) => { flip(e, true); }}>
          Whole window
        </button>
        <label>
          <input type="checkbox" checked={red} onChange={(e) => { setRed(e.target.checked); }} />
          Red ink
        </label>
      </div>
      <Code>{`import { inkTransition } from "@tengubyte/sumi";

<button onClick={(e) => inkTransition(() => navigate("/water"), {
  from: [e.clientX / innerWidth, e.clientY / innerHeight],
})}>`}</Code>
    </Study>
  );
}
