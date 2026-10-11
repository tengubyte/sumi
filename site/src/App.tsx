import { useEffect, useLayoutEffect, useRef, type JSX } from "react";
import { EffectList } from "./EffectList";
import { LIST } from "./effects";
import { Footer, Header, Hero, NotFound } from "./Layout";
import { useDark } from "./parts";
import { rememberedScroll, usePath } from "./router";

const SITE = "https://sumi.tengubyte.io";

/** The effects page gets its own title and description; the home page keeps those from index.html. */
function usePageMeta(path: string): void {
  const home = useRef<{ title: string; description: string } | null>(null);
  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    home.current ??= { title: document.title, description: description?.getAttribute("content") ?? "" };
    const list = path === LIST.path;
    document.title = list ? `${LIST.name} | sumi` : path === "/" ? home.current.title : "Nothing here | sumi";
    description?.setAttribute("content", list ? `${LIST.line} Brush and ink effects for React, by TenguByte.` : home.current.description);
    canonical?.setAttribute("href", `${SITE}${path}`);
  }, [path]);
}

export function App(): JSX.Element {
  const dark = useDark();
  const path = usePath();
  const first = useRef(true);
  usePageMeta(path);

  // After a link or the back button: back to where the reader was, and the new heading takes focus so a
  // screen reader announces the page. The first load keeps the browser's own focus and goes to its #section.
  useLayoutEffect(() => {
    scrollTo(0, rememberedScroll());
    if (first.current) {
      first.current = false;
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
      return;
    }
    document.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [path]);

  return (
    <>
      <Header />
      {path === "/" ? <Hero dark={dark} /> : path === LIST.path ? <EffectList dark={dark} /> : <NotFound />}
      <Footer />
    </>
  );
}
