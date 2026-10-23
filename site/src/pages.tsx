import type { JSX } from "react";
import { BrushStudy } from "./BrushStudy";
import { DropStudy } from "./DropStudy";
import { EmberStudy } from "./EmberStudy";
import { EnsoStudy } from "./EnsoStudy";
import { FireStudy } from "./FireStudy";
import { FloatStudy } from "./FloatStudy";
import { FocusStudy } from "./FocusStudy";
import { FudeStudy } from "./FudeStudy";
import { HakeStudy } from "./HakeStudy";
import { HanasakaStudy } from "./HanasakaStudy";
import { HankoStudy } from "./HankoStudy";
import { IrodoriStudy } from "./IrodoriStudy";
import { KasumiStudy } from "./KasumiStudy";
import { KintsugiStudy } from "./KintsugiStudy";
import { MarkStudy } from "./MarkStudy";
import { BandStudy, RingStudy } from "./Reveals";
import { SansuiStudy } from "./SansuiStudy";
import { ShiboriStudy } from "./ShiboriStudy";
import { SplatStudy } from "./SplatStudy";
import { StrikeStudy } from "./StrikeStudy";
import { TachigamiStudy } from "./TachigamiStudy";
import { TornStudy } from "./TornStudy";
import { TransitionStudy } from "./TransitionStudy";
import { UnrollStudy } from "./UnrollStudy";
import { WipeStudy } from "./WipeStudy";

type Body = (dark: boolean) => JSX.Element;

/** Each effect's studies, by its slug in `EFFECTS`. */
export const BODIES: Readonly<Record<string, Body>> = {
  "brush-reveal": () => (
    <>
      <RingStudy />
      <UnrollStudy />
      <BandStudy />
    </>
  ),
  "brush-paint": (dark) => <BrushStudy dark={dark} />,
  "brush-mark": () => <MarkStudy />,
  hanko: () => <HankoStudy />,
  "kanji-strike": () => <StrikeStudy />,
  enso: (dark) => <EnsoStudy dark={dark} />,
  fude: (dark) => <FudeStudy dark={dark} />,
  suminagashi: (dark) => <FloatStudy dark={dark} />,
  "ink-drop": (dark) => <DropStudy dark={dark} />,
  "ink-wipe": (dark) => <WipeStudy dark={dark} />,
  "ink-transition": (dark) => <TransitionStudy dark={dark} />,
  "torn-edge": (dark) => <TornStudy dark={dark} />,
  irodori: () => <IrodoriStudy />,
  hake: () => <HakeStudy />,
  tachigami: (dark) => <TachigamiStudy dark={dark} />,
  kintsugi: () => <KintsugiStudy />,
  kasumi: () => <KasumiStudy />,
  sansui: (dark) => <SansuiStudy dark={dark} />,
  shibori: () => <ShiboriStudy />,
  "ink-splat": (dark) => <SplatStudy dark={dark} />,
  hinoko: () => <EmberStudy />,
  kaen: (dark) => <FireStudy dark={dark} />,
  shuchusen: (dark) => <FocusStudy dark={dark} />,
  hanasaka: (dark) => <HanasakaStudy dark={dark} />,
};
