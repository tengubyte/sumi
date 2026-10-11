import type { JSX } from "react";
import type { Row } from "./apiRows";

export interface PropsDoc {
  readonly rows: readonly Row[];
  /** The toggle's text, such as "Hanko props". */
  readonly label: string;
}

/** An effect's props, folded away under its demo. A list rather than a table, so it reflows in a half-width column. */
export function Props({ rows, label }: PropsDoc): JSX.Element {
  return (
    <details className="props">
      <summary>{label}</summary>
      <dl>
        {rows.map(([name, type, value, what]) => (
          <div key={name}>
            <dt>
              <code>{name}</code>
              {type && <code className="type">{type}</code>}
            </dt>
            <dd>{what}</dd>
            {value && (
              <dd className="default">
                Default <code>{value}</code>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </details>
  );
}
