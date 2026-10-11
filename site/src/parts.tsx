import { useEffect, useState, type JSX, type ReactNode } from "react";

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
}

/** One effect: the live demo on one side, how it works and its controls on the other. */
export function Study({ id, kanji, title, what, stage, children }: StudyProps): JSX.Element {
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
        <div>{children}</div>
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

/** True when the visitor's system is in dark mode, kept up to date. */
export function useDark(): boolean {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = (): void => {
      setDark(media.matches);
    };
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, []);
  return dark;
}
