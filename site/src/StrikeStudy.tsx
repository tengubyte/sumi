import { KanjiStrike } from "@tengubyte/sumi";
import { useState, type JSX } from "react";
import { Choice, Code, Study, useReplay } from "./parts";

type Word = "死" | "危" | "忍" | "斬";

const MEANING: Readonly<Record<Word, string>> = { 死: "Death", 危: "Danger", 忍: "Stealth", 斬: "Cut" };

export function StrikeStudy(): JSX.Element {
  const [run, replay] = useReplay();
  const [word, setWord] = useState<Word>("死");
  const [glow, setGlow] = useState(true);
  const strike = (
    <KanjiStrike
      key={`${word} ${String(glow)} ${String(run)}`}
      text={word}
      label={MEANING[word]}
      font='"Yuji Syuku"'
      weight={400}
      glow={glow}
      style={{ display: "block", width: "100%", aspectRatio: "4 / 3" }}
    />
  );
  return (
    <Study
      id="strike"
      kanji="撃"
      title="Strike a character"
      what="KanjiStrike"
      stage={glow ? <div className="night">{strike}</div> : strike}
    >
      <p>
        One character in one sweep of the brush, the way an action game stamps 死 across the screen. The front of
        the sweep is streaky with bristles, the brush runs dry toward the end, and drops fly off where it stops.
        It lands a little large and shakes.
      </p>
      <p>
        Then the ink creeps a short way into the paper. Any font you load works; a brush face such as Yuji Syuku
        suits it. On a dark page, glow adds a red halo.
      </p>
      <div className="controls">
        <Choice label="Character" options={[["死", "死"], ["危", "危"], ["忍", "忍"], ["斬", "斬"]]} value={word} onChange={setWord} />
        <button type="button" className="primary" onClick={replay}>
          Replay
        </button>
        <label>
          <input type="checkbox" checked={glow} onChange={(e) => { setGlow(e.target.checked); }} />
          Dark page and glow
        </label>
      </div>
      <Code>{`<KanjiStrike
  text="${word}"
  label="${MEANING[word]}"
  font='"Yuji Syuku"'${glow ? "\n  glow" : ""}
  style={{ width: 320, aspectRatio: "1" }}
/>`}</Code>
    </Study>
  );
}
