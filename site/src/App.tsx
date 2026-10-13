import { useEffect, useLayoutEffect, useRef, type JSX } from "react";
import { EffectList } from "./EffectList";
import { LIST } from "./effects";
import { Footer, Header, Hero, NotFound } from "./Layout";
import { useDark } from "./parts";
import { rememberedScroll, usePath } from "./router";
import { ShowcaseList } from "./Showcase";
import { SHOWCASE, SUMIGANE, TSUKIMI } from "./showcases";
import { Sumigane } from "./Sumigane";
import { Tsukimi } from "./Tsukimi";

const SITE = "https://sumi.tengubyte.io";
const PAGES = [LIST, SHOWCASE, SUMIGANE, TSUKIMI] as const;

/** Each page but home gets its own title and description; the home page keeps those from index.html. */
function usePageMeta(path: string): void {
  const home = useRef<{ title: string; description: string } | null>(null);
  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    home.current ??= { title: document.title, description: description?.getAttribute("content") ?? "" };
    const page = PAGES.find((one) => one.path === path);
    document.title = page ? `${page.name} | sumi` : path === "/" ? home.current.title : "Nothing here | sumi";
    description?.setAttribute("content", page ? `${page.line} Brush and ink effects for React, by TenguByte.` : home.current.description);
    canonical?.setAttribute("href", `${SITE}${path}`);
  }, [path]);
}

function Page({ path, dark }: { readonly path: string; readonly dark: boolean }): JSX.Element {
  if (path === "/") return <Hero dark={dark} />;
  if (path === LIST.path) return <EffectList dark={dark} />;
  if (path === SHOWCASE.path) return <ShowcaseList />;
  return <NotFound />;
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

  // Each showcase stands as its own site, with its own header and footer.
  if (path === SUMIGANE.path) return <Sumigane />;
  if (path === TSUKIMI.path) return <Tsukimi />;
  return (
    <>
      <Header />
      <Page path={path} dark={dark} />
      <Footer />
    </>
  );
}
