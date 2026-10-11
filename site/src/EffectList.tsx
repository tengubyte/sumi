import { Fragment, useState, type JSX } from "react";
import { Api } from "./Api";
import { EFFECTS, GROUPS, LIST, type Group } from "./effects";
import { BODIES } from "./pages";
import { Choice } from "./parts";

type Filter = "all" | Group | "core";

const FILTERS: readonly (readonly [Filter, string])[] = [["all", "All"], ...GROUPS, ["core", "Without React"]];

function isFilter(value: string | null): value is Filter {
  return FILTERS.some(([filter]) => filter === value);
}

/**
 * Every effect's studies, one after another, as the site was before it had pages. The filter keeps one group;
 * it lives in the address, so a filtered page can be linked and the back button returns to it.
 */
export function EffectList({ dark }: { readonly dark: boolean }): JSX.Element {
  const [filter, setFilter] = useState<Filter>(() => {
    const group = new URLSearchParams(location.search).get("group");
    return isFilter(group) ? group : "all";
  });
  const pick = (next: Filter): void => {
    setFilter(next);
    history.replaceState(history.state, "", next === "all" ? LIST.path : `${LIST.path}?group=${next}`);
  };
  const shown = EFFECTS.filter((effect) => filter === "all" || effect.group === filter);
  return (
    <main className="wrap">
      <header className="page-head">
        <h1 tabIndex={-1}>{LIST.name}</h1>
        <p className="lede">{LIST.line}</p>
      </header>
      <div className="filter">
        <Choice label="Show" options={FILTERS} value={filter} onChange={pick} />
      </div>
      {shown.map((effect) => (
        <Fragment key={effect.slug}>{BODIES[effect.slug]?.(dark)}</Fragment>
      ))}
      {(filter === "all" || filter === "core") && <Api />}
    </main>
  );
}
