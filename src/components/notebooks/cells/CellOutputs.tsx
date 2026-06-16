"use client";

import { joinSource, mime, type CellOutput } from "@/lib/ipynb";

/** Rend les sorties d'une cellule de code : images, tables HTML, texte, erreurs. */
export function CellOutputs({ outputs }: { outputs: CellOutput[] }) {
  return (
    <div className="space-y-2">
      {outputs.map((out, i) => (
        <Output key={i} out={out} />
      ))}
    </div>
  );
}

function Output({ out }: { out: CellOutput }) {
  // 1. Image (matplotlib) — priorité au PNG.
  const png = mime(out.data, "image/png");
  if (png) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/png;base64,${png}`}
        alt="Sortie graphique du notebook"
        className="max-w-full rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700"
      />
    );
  }

  // 2. Table / HTML riche (DataFrame pandas).
  const html = mime(out.data, "text/html");
  if (html) {
    return (
      <div
        className="nb-html overflow-x-auto text-sm"
        // Contenu de confiance : notebooks exécutés localement et commités.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // 3. Erreur (ne devrait pas arriver, exécution validée).
  if (out.output_type === "error") {
    return (
      <pre className="overflow-x-auto rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {out.ename}: {out.evalue}
      </pre>
    );
  }

  // 4. Texte brut (print, repr) — stream ou execute_result.
  const text = joinSource(out.text) || mime(out.data, "text/plain");
  if (text) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {text}
      </pre>
    );
  }

  return null;
}
