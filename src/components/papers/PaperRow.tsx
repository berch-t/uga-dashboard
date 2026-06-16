import { Quote } from "lucide-react";
import { formatInt } from "@/lib/format";
import type { PaperRecord } from "@/lib/types";
import { OaBadge } from "./OaBadge";

/** One clickable publication row in the explorer list. */
export function PaperRow({ paper, onSelect }: { paper: PaperRecord; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
          {paper.title}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Quote className="h-3.5 w-3.5" />
          {formatInt(paper.citations)}
        </span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
        {paper.authors.slice(0, 4).join(", ")}
        {paper.authors.length > 4 ? " et al." : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        {paper.year ? <span>{paper.year}</span> : null}
        {paper.venue ? <span className="line-clamp-1 max-w-[200px]">· {paper.venue}</span> : null}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {paper.typeLabel}
        </span>
        <OaBadge status={paper.oaStatus} />
      </div>
    </button>
  );
}
