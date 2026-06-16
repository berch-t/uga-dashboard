"use client";

import { BookOpen, Database, LineChart } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NotebookEntry } from "@/lib/ipynb";

const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  "Data Science": LineChart,
  "Data Engineering": Database,
};

/**
 * Navigation des notebooks, dans l'esprit du système de sidebar shadcn/ui
 * (groupes, item actif accentué, états `data-active`). Regroupe par catégorie.
 */
export function NotebookSidebar({
  entries,
  activeId,
  onSelect,
}: {
  entries: NotebookEntry[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const categories = [...new Set(entries.map((e) => e.category))];

  return (
    <nav className="flex w-full flex-col gap-5 p-3 text-sm">
      {categories.map((category) => {
        const Icon = CATEGORY_ICON[category] ?? BookOpen;
        return (
          <div key={category} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <Icon className="h-3.5 w-3.5" />
              {category}
            </div>
            {entries
              .filter((e) => e.category === category)
              .map((entry) => {
                const active = entry.id === activeId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    data-active={active}
                    onClick={() => onSelect(entry.id)}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2 py-2 text-left transition",
                      active
                        ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-xs",
                        active ? "text-brand-500" : "text-slate-400 dark:text-slate-600",
                      )}
                    >
                      {entry.id.slice(0, 2)}
                    </span>
                    <span className="leading-snug">{entry.title}</span>
                  </button>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}
