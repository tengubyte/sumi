import { useSyncExternalStore, type JSX, type MouseEvent, type ReactNode } from "react";
import { addressForAnchor } from "./effects";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

/** The current path, kept up to date across links and the back button. */
export function usePath(): string {
  return useSyncExternalStore(subscribe, () => location.pathname);
}

interface Remembered {
  readonly scroll?: number;
}

/** Where the reader was on this history entry, so the back button returns there. */
export function rememberedScroll(): number {
  const state = history.state as Remembered | null;
  return state?.scroll ?? 0;
}

export function navigate(path: string): void {
  history.replaceState({ scroll: scrollY } satisfies Remembered, "");
  history.pushState({ scroll: 0 } satisfies Remembered, "", path);
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * The site was one page with a section per effect. Links to those sections now open the effect's own page,
 * and the router restores scroll positions itself.
 */
export function startRouter(): void {
  history.scrollRestoration = "manual";
  const address = location.pathname === "/" ? addressForAnchor(location.hash) : undefined;
  if (address !== undefined) history.replaceState(null, "", address);
}

/** A link inside the site that changes the page without a reload; new-tab and modified clicks behave as usual. */
interface LinkProps {
  readonly to: string;
  readonly className?: string;
  readonly label?: string;
  readonly children: ReactNode;
}

export function Link({ to, className, label, children }: LinkProps): JSX.Element {
  const here = usePath() === to;
  const click = (e: MouseEvent<HTMLAnchorElement>): void => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!here) navigate(to);
  };
  return (
    <a href={to} className={className} aria-label={label} aria-current={here ? "page" : undefined} onClick={click}>
      {children}
    </a>
  );
}
