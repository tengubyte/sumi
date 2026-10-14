import { Tachigami, TachigamiText } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { inkFor } from "./BrushStudy";
import { Choice, Code, Study, useReplay } from "./parts";

type Cut = "rejoin" | "apart" | "fall" | "word";

const RED = "#d8001a";

const CODE: Readonly<Record<Exclude<Cut, "word">, string>> = {
  rejoin: "",
  apart: '\n  mode="apart"',
  fall: '\n  mode="fall"',
};

export function TachigamiStudy({ dark }: { readonly dark: boolean }): JSX.Element {
  const [run, replay] = useReplay();
  const [cut, setCut] = useState<Cut>("rejoin");
  const key = `${cut} ${String(run)}`;
  const stage =
    cut === "word" ? (
      <TachigamiText key={key} text="一閃" label="Issen, one flash" mode="apart" font='"Yuji Syuku"' weight={400} textColor={inkFor(dark)} color={RED} style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }} />
    ) : (
      <Tachigami key={key} src="/art/scene.webp" width={1200} height={800} alt="A red sun over blue hills and cherry blossom" mode={cut} color={dark ? RED : undefined} glint={dark} />
    );
  return (
    <Study id="slash" kanji="断" title="Cut with one slash" what="Tachigami and TachigamiText" stage={stage}>
      <p>
        One slash of the brush. A dry ink stroke tears across, spraying drops, and the two halves shear apart
        along it with dark cut faces. They close again, stay parted, or the top half
        sticks, slips down the cut and tips away.
      </p>
      <p>
        A closed cut ends on the plain picture. Parted and fallen halves are the finished look, so they stay on a
        canvas over the hidden image. TachigamiText cuts a word drawn from the font into a canvas.
      </p>
      <div className="controls">
        <Choice label="Cut" options={[["rejoin", "Close"], ["apart", "Apart"], ["fall", "Fall"], ["word", "Word"]]} value={cut} onChange={setCut} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
      </div>
      <Code>
        {cut === "word"
          ? `<TachigamiText
  text="一閃"
  label="Issen, one flash"
  mode="apart"
  font='"Yuji Syuku"'
  color="${RED}"
  style={{ width: "100%", aspectRatio: "4 / 3" }}
/>`
          : `<Tachigami
  src="/scene.webp"
  width={1200}
  height={800}
  alt="..."${CODE[cut]}
/>`}
      </Code>
    </Study>
  );
}
