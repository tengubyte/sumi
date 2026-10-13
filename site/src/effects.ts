export type Group = "brush" | "water" | "image" | "scene";

export const GROUPS: readonly (readonly [Group, string])[] = [
  ["brush", "Brush"],
  ["water", "Water"],
  ["image", "Image and page"],
  ["scene", "Scene"],
];

export interface Effect {
  /** Its studies in `BODIES`. */
  readonly slug: string;
  readonly group: Group;
  /** The ids of its study sections, which old `/#section` links point at. */
  readonly anchors: readonly string[];
}

/** In page order, grouped. */
export const EFFECTS: readonly Effect[] = [
  { slug: "brush-reveal", group: "brush", anchors: ["ring", "unroll", "band"] },
  { slug: "brush-paint", group: "brush", anchors: ["brush"] },
  { slug: "brush-mark", group: "brush", anchors: ["mark"] },
  { slug: "hanko", group: "brush", anchors: ["hanko"] },
  { slug: "kanji-strike", group: "brush", anchors: ["strike"] },
  { slug: "enso", group: "brush", anchors: ["enso"] },
  { slug: "fude", group: "brush", anchors: ["fude"] },
  { slug: "suminagashi", group: "water", anchors: ["float"] },
  { slug: "ink-drop", group: "water", anchors: ["drop"] },
  { slug: "ink-wipe", group: "image", anchors: ["wipe"] },
  { slug: "ink-transition", group: "image", anchors: ["transition"] },
  { slug: "torn-edge", group: "image", anchors: ["torn"] },
  { slug: "irodori", group: "image", anchors: ["irodori"] },
  { slug: "hake", group: "image", anchors: ["hake"] },
  { slug: "tachigami", group: "image", anchors: ["slash"] },
  { slug: "sansui", group: "scene", anchors: ["sansui"] },
  { slug: "ink-splat", group: "scene", anchors: ["splat"] },
  { slug: "hinoko", group: "scene", anchors: ["embers"] },
  { slug: "kaen", group: "scene", anchors: ["fire"] },
  { slug: "shuchusen", group: "scene", anchors: ["focus"] },
  { slug: "hanasaka", group: "scene", anchors: ["bloom"] },
];

/** The effects page. */
export const LIST = { path: "/effects", name: "Effects", line: "Every effect in sumi. Each one plays as it scrolls into view." } as const;

/** The site was one page; an old `/#section` link now opens that section on the effects page. */
export function addressForAnchor(hash: string): string | undefined {
  const id = hash.replace(/^#/, "");
  return id === "api" || EFFECTS.some((effect) => effect.anchors.includes(id)) ? `${LIST.path}#${id}` : undefined;
}
