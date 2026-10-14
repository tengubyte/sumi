import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { docPath, EFFECTS } from "./effects";
import { Link } from "./router";

/** A code block with a copy button. */
export function Code({ children }: { readonly children: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  const copy = (): void => {
    void navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1600);
    });
  };
  return (
    <div className="code">
      <button type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

interface StudyProps {
  readonly id: string;
  readonly kanji: string;
  readonly title: string;
  /** The component or technique, under the title. */
  readonly what: string;
  readonly stage: ReactNode;
  readonly children: ReactNode;
  /** Keep the demo mounted off screen, for a study whose own code holds on to the demo's elements. */
  readonly eager?: boolean;
}

/**
 * One effect: the live demo on one side, how it works and its controls on the other. Its props live on its
 * docs page, which the study links to last.
 */
export function Study({ id, kanji, title, what, stage, children, eager = false }: StudyProps): JSX.Element {
  const effect = EFFECTS.find((one) => one.anchors.includes(id));
  return (
    <section id={id} className="study" aria-labelledby={`${id}-title`}>
      <header>
        <span className="kanji" lang="ja" aria-hidden="true">
          {kanji}
        </span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p className="what">{what}</p>
        </div>
      </header>
      <div className="study-body">
        {eager ? <div className="stage">{stage}</div> : <InView className="stage">{stage}</InView>}
        <div>
          {children}
          {effect && (
            <p className="study-docs">
              <Link to={docPath(effect)}>{effect.name} props and usage</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

interface RangeProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  readonly onChange: (value: number) => void;
}

export function Range({ label, value, min, max, step, unit = "", onChange }: RangeProps): JSX.Element {
  return (
    <label>
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => { onChange(Number(e.target.value)); }} />
      <output>
        {value}
        {unit}
      </output>
    </label>
  );
}

/** A counter for `key`, so Replay remounts a demo and it plays again. */
export function useReplay(): [number, () => void] {
  const [run, setRun] = useState(0);
  return [run, () => { setRun((n) => n + 1); }];
}

/** Buttons that pick one of a few options. */
export function Choice<T extends string>({ label, options, value, onChange }: { readonly label: string; readonly options: readonly (readonly [T, string])[]; readonly value: T; readonly onChange: (value: T) => void }): JSX.Element {
  return (
    <div className="choice" role="group" aria-label={label}>
      {options.map(([option, text]) => (
        <button key={option} type="button" aria-pressed={option === value} onClick={() => { onChange(option); }}>
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * Mounts its children only within a screen of the viewport. Chrome keeps about sixteen WebGL contexts and drops
 * the oldest past that, and every effect releases its context when it unmounts, so a page of demos stays under
 * the limit. A demo plays again when it comes back. The box keeps its last height, so the page does not jump.
 */
function InView({ className, children }: { readonly className?: string; readonly children: ReactNode }): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    if (!box.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const near = entry?.isIntersecting ?? false;
        if (!near && box.current) setHeight(box.current.offsetHeight);
        setShown(near);
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(box.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={box} className={className} style={{ minHeight: height, boxSizing: "border-box" }}>
      {shown && children}
    </div>
  );
}

/** True while the media query matches, kept up to date. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = (): void => {
      setMatches(media.matches);
    };
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, [query]);
  return matches;
}

/** True when the visitor's system is in dark mode, kept up to date. */
export function useDark(): boolean {
  return useMedia("(prefers-color-scheme: dark)");
}
