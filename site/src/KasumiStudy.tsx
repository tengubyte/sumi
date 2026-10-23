import { Kasumi, kasumiTransition } from "@tengubyte/sumi";
import { useRef, useState, type JSX, type RefObject } from "react";
import { flushSync } from "react-dom";
import { Choice, Code, Study, useReplay } from "./parts";

type Show = "divider" | "transition";

const PAGES = [
  { title: "Paint the mountains", text: "Five ridges, brushed from far to near." },
  { title: "Dye the cloth", text: "Indigo, dip after dip." },
] as const;

const CODE: Readonly<Record<Show, string>> = {
  divider: `<Kasumi style={{ width: "100%", height: 120 }} />`,
  transition: `import { kasumiTransition } from "@tengubyte/sumi";

<button onClick={() => kasumiTransition(() => navigate("/dye"))}>`,
};

/** The demo page, and a flip that changes it under the bands, over the page or over the whole window. */
function useFlip(seed: number): { readonly screen: RefObject<HTMLDivElement | null>; readonly page: number; readonly busy: boolean; readonly flip: (whole: boolean) => void } {
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const flip = (whole: boolean): void => {
    setBusy(true);
    // flushSync, so the new page is in the DOM before the bands open over it.
    const swap = (): void => {
      flushSync(() => { setPage((n) => n + 1); });
    };
    void kasumiTransition(swap, { seed, within: whole ? undefined : (screen.current ?? undefined) }).finally(() => {
      setBusy(false);
    });
  };
  return { screen, page, busy, flip };
}

export function KasumiStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [show, setShow] = useState<Show>("divider");
  const [seed, setSeed] = useState(1);
  const { screen, page, busy, flip } = useFlip(seed);
  const shown = PAGES[page % 2] ?? PAGES[0];
  const shuffle = (): void => {
    setSeed(Math.floor(Math.random() * 900) + 1);
  };

  const stage =
    show === "divider" ? (
      <div key={run} className="band-stage">
        <Kasumi seed={seed} style={{ width: "100%", height: 120 }} />
        <p>The next section starts under the mist.</p>
      </div>
    ) : (
      <div ref={screen} className={`screen page-${String(page % 2)}`}>
        <h3>{shown.title}</h3>
        <p>{shown.text}</p>
      </div>
    );
  return (
    <Study id="kasumi" kanji="霞" title="Part the gold mist" what="Kasumi and kasumiTransition" stage={stage}>
      <p>
        Suyari-gasumi, the long gold cloud bands that picture scrolls use to part one scene from the next. Each
        band is flat gold leaf laid in squares, its ends stepping in as rounded lobes, with gold dust and cut
        flakes gathered near the edge.
      </p>
      <p>
        Kasumi slides two bands in from either side to settle as a divider. kasumiTransition draws five across
        the page from alternating sides, changes the page once nothing shows, and drifts them out the far side.
      </p>
      <div className="controls">
        <Choice label="Show" options={[["divider", "Divider"], ["transition", "Transition"]]} value={show} onChange={setShow} />
        {show === "divider" ? (
          <button type="button" className="primary" onClick={replay}>
            Replay
          </button>
        ) : (
          <>
            <button type="button" className="primary" disabled={busy} onClick={() => { flip(false); }}>
              Change page
            </button>
            <button type="button" disabled={busy} onClick={() => { flip(true); }}>
              Whole window
            </button>
          </>
        )}
        <button type="button" onClick={shuffle}>
          New seed
        </button>
      </div>
      <Code>{CODE[show]}</Code>
    </Study>
  );
}
