"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useIsDark } from "@/lib/use-is-dark";
import { CellOutputs } from "./CellOutputs";
import type { CellOutput } from "@/lib/ipynb";

/** Cellule de code : source Python colorée + numéro d'exécution + sorties. */
export function CodeCell({
  source,
  outputs,
  count,
}: {
  source: string;
  outputs?: CellOutput[];
  count?: number | null;
}) {
  const dark = useIsDark();
  return (
    <div className="px-4 py-2">
      <div className="flex gap-2">
        <span className="select-none pt-3 font-mono text-xs text-slate-400 dark:text-slate-600">
          [{count ?? " "}]
        </span>
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <SyntaxHighlighter
            language="python"
            style={dark ? oneDark : oneLight}
            customStyle={{ margin: 0, background: "transparent", fontSize: "0.825rem", padding: "0.75rem 1rem" }}
            codeTagProps={{ style: { fontFamily: "var(--font-mono, ui-monospace, monospace)" } }}
          >
            {source.replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      </div>
      {outputs && outputs.length > 0 && (
        <div className="ml-8 mt-1">
          <CellOutputs outputs={outputs} />
        </div>
      )}
    </div>
  );
}
