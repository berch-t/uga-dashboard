"use client";

import { joinSource, type Notebook } from "@/lib/ipynb";
import { MarkdownCell } from "./cells/MarkdownCell";
import { CodeCell } from "./cells/CodeCell";

/** Rend un notebook complet, cellule par cellule (look Google Colab). */
export function NotebookViewer({ notebook }: { notebook: Notebook }) {
  return (
    <div className="nb-viewer divide-y divide-slate-100 dark:divide-slate-800">
      {notebook.cells.map((cell, i) => {
        const source = joinSource(cell.source);
        if (cell.cell_type === "markdown") {
          return <MarkdownCell key={i} source={source} />;
        }
        if (cell.cell_type === "code") {
          // On masque les cellules de code vides (cellules de séparation).
          if (!source.trim()) return null;
          return <CodeCell key={i} source={source} outputs={cell.outputs} count={cell.execution_count} />;
        }
        return null;
      })}
    </div>
  );
}
