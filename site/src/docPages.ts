import readme from "../../README.md?raw";
import { docPath, EFFECTS, type Effect } from "./effects";
import { sections, type Resolve } from "./markdown";

// The docs pages read the README, so the docs and the README cannot drift apart.
export const README = sections(readme);

export const DOCS = { path: "/docs", name: "Docs", line: "Install sumi, use each effect in React or on plain elements, and look up every prop." } as const;
export const CORE = { path: "/docs/without-react", name: "Without React", line: "The same effects on plain elements, from @tengubyte/sumi/core." } as const;

export interface DocPage {
  readonly path: string;
  readonly name: string;
  readonly line: string;
  readonly effect?: Effect;
}

/** What each effect does, from the table at the top of the README. */
const DOES = new Map<string, string>();
for (const [, name, what] of (README.get("") ?? "").matchAll(/^\| \[(\w+)\]\(#\w+\) \| (.+?) \|/gm)) {
  if (name && what) DOES.set(name, what);
}

/** In reading order: getting started, the core calls, then one page per effect. */
export const DOC_PAGES: readonly DocPage[] = [
  DOCS,
  CORE,
  ...EFFECTS.map((effect) => ({ path: docPath(effect), name: effect.name, line: DOES.get(effect.name) ?? "", effect })),
];

/** The README's sections that the getting started page shows, in order, by their ids. */
export const STARTED = [
  ["install", "Install"],
  ["usage", "Usage"],
  ["what-every-effect-does", "What every effect does"],
] as const;

const SITE = "https://sumi.tengubyte.io";

/** README links point at its own sections and at this site; here they open the matching docs page. */
export const resolve: Resolve = (href) => {
  if (href.startsWith(SITE)) return href.slice(SITE.length) || "/";
  if (!href.startsWith("#")) return href;
  const id = href.slice(1);
  if (id === "without-react") return CORE.path;
  const effect = EFFECTS.find((one) => one.name.toLowerCase() === id);
  if (effect) return docPath(effect);
  return STARTED.some(([started]) => started === id) ? `${DOCS.path}#${id}` : DOCS.path;
};
