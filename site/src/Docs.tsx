import { useSyncExternalStore, type JSX } from "react";
import { CORE, DOCS, DOC_PAGES, README, STARTED, resolve, type DocPage } from "./docPages";
import { GROUPS } from "./effects";
import { NotFound } from "./Layout";
import { Markdown } from "./markdown";
import { Link } from "./router";

const WIDE = "(min-width: 900px)";

function useWide(): boolean {
  return useSyncExternalStore(
    (changed) => {
      const query = matchMedia(WIDE);
      query.addEventListener("change", changed);
      return () => {
        query.removeEventListener("change", changed);
      };
    },
    () => matchMedia(WIDE).matches,
  );
}

/**
 * Every docs page, grouped. Beside the page it stays open; on a phone it folds into one line above the page,
 * and each new page starts with it folded, so the heading is the first thing in view.
 */
function DocsNav({ path }: { readonly path: string }): JSX.Element {
  const wide = useWide();
  const item = (page: DocPage): JSX.Element => (
    <li key={page.path}>
      <Link to={page.path}>{page === DOCS ? "Install and usage" : page.name}</Link>
    </li>
  );
  return (
    <details key={path} className="docs-nav" open={wide}>
      <summary>All docs pages</summary>
      <nav aria-label="Docs">
        <p>Getting started</p>
        <ul>{[DOCS, CORE].map(item)}</ul>
        {GROUPS.map(([group, label]) => (
          <div key={group}>
            <p>{label}</p>
            <ul>{DOC_PAGES.filter((page) => page.effect?.group === group).map(item)}</ul>
          </div>
        ))}
      </nav>
    </details>
  );
}

function Section({ id, title, source }: { readonly id: string; readonly title: string; readonly source: string }): JSX.Element {
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <Markdown source={source} resolve={resolve} />
    </section>
  );
}

/** Install, usage and the rules every effect follows, with the README's table of effects in between. */
function Started(): JSX.Element {
  const [install, usage, every] = STARTED.map(([id, title]) => <Section key={id} id={id} title={title} source={README.get(title) ?? ""} />);
  const table = (README.get("") ?? "")
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .join("\n");
  return (
    <>
      {install}
      {usage}
      <Section id="effects" title="Effects" source={table} />
      {every}
    </>
  );
}

function Turn({ path }: { readonly path: string }): JSX.Element {
  const at = DOC_PAGES.findIndex((page) => page.path === path);
  const [previous, next] = [DOC_PAGES[at - 1], DOC_PAGES[at + 1]];
  return (
    <nav className="docs-turn" aria-label="Previous and next">
      {previous && <Link to={previous.path}>Previous: {previous.name}</Link>}
      {next && <Link to={next.path}>Next: {next.name}</Link>}
    </nav>
  );
}

/** Getting started, the core calls, and a page per effect with its usage and props, all read from the README. */
export function Docs({ path }: { readonly path: string }): JSX.Element {
  const page = DOC_PAGES.find((one) => one.path === path);
  if (!page) return <NotFound />;
  const { effect } = page;
  return (
    <main className="wrap docs">
      <DocsNav path={path} />
      <article>
        <header className="page-head">
          <h1 tabIndex={-1}>{page.name}</h1>
          <p className="lede">{page.line}</p>
          {effect && (
            <p className="more">
              <Link to={`/effects#${effect.anchors[0] ?? ""}`}>See {effect.name} run</Link>
            </p>
          )}
        </header>
        {path === DOCS.path ? <Started /> : <Markdown source={README.get(effect ? effect.name : CORE.name) ?? ""} resolve={resolve} />}
        <Turn path={path} />
      </article>
    </main>
  );
}
