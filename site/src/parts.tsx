import { useEffect, useState, type JSX, type ReactNode } from "react";
import { Props, type PropsDoc } from "./Props";

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
      <pre>
        <code>{children}</code>
      </pre>
      <button type="button" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
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
  /** The effect's props table, shown last under how it works. */
  readonly props?: PropsDoc | undefined;
}

/** One effect: the live demo on one side, how it works, its controls and its props on the other. */
export function Study({ id, kanji, title, what, stage, children, props }: StudyProps): JSX.Element {
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
        <div className="stage">{stage}</div>
        <div>
          {children}
          {props && <Props {...props} />}
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
