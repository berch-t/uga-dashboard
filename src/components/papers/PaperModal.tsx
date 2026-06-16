"use client";

import { useEffect } from "react";
import { ExternalLink, Quote, X } from "lucide-react";
import { formatInt } from "@/lib/format";
import type { PaperRecord } from "@/lib/types";
import { OaBadge } from "./OaBadge";

/** Detail popup for a single publication, with abstract and external links. */
export function PaperModal({ paper, onClose }: { paper: PaperRecord; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const openAlexUrl = paper.id.startsWith("http") ? paper.id : `https://openalex.org/${paper.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              {paper.year ? <span>{paper.year}</span> : null}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{paper.typeLabel}</span>
              <OaBadge status={paper.oaStatus} />
              <span className="flex items-center gap-1"><Quote className="h-3 w-3" />{formatInt(paper.citations)} citations</span>
            </div>
            <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">{paper.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Field label="Auteurs">{paper.authors.join(", ") || "—"}</Field>
          {paper.venue ? <Field label="Support">{paper.venue}</Field> : null}
          {paper.topic ? (
            <Field label="Domaine">{paper.topic}{paper.field ? ` · ${paper.field}` : ""}</Field>
          ) : null}
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Résumé</p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {paper.abstract ?? "Résumé non disponible pour cette publication."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          {paper.doi ? (
            <LinkButton href={`https://doi.org/${paper.doi}`}>DOI · {paper.doi}</LinkButton>
          ) : null}
          <LinkButton href={openAlexUrl}>Fiche OpenAlex</LinkButton>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{children}</p>
    </div>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
