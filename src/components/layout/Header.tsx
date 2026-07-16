import Image from "next/image";
import { BookOpen, Compass } from "lucide-react";
import { formatInt } from "@/lib/format";
import { fetchSourceTotals } from "@/lib/live-totals";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  institution: string;
  /** Snapshot totals, used as fallback if a source API is unreachable at view time. */
  fallbackTotals: { openAlex: number; hal: number };
}

/** Today's date, localized (fr-FR), pinned to Paris time — e.g. « 18 juin 2026 ». */
function today(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

const ICONS = { notebooks: BookOpen, explore: Compass } as const;

const NAV: Array<{ href: string; label: string; icon?: keyof typeof ICONS }> = [
  { href: "/#overview", label: "Vue d'ensemble" },
  { href: "/#production", label: "Production" },
  { href: "/#impact", label: "Impact" },
  { href: "/#emerging", label: "Signaux émergents" },
  { href: "/#network", label: "Collaborations" },
  { href: "/#contracts", label: "Contrats" },
  { href: "/#quality", label: "Qualité des données" },
  { href: "/#explorer", label: "Explorateur" },
  { href: "/notebooks", label: "Notebooks", icon: "notebooks" },
  { href: "/explore", label: "Navigateur d'API", icon: "explore" },
];

/** Sticky institutional header: UGA logo, provenance badges and section nav.
 *  Source totals are re-checked live on every render; the date is today's. */
export async function Header({ institution, fallbackTotals }: HeaderProps) {
  const totals = await fetchSourceTotals(fallbackTotals);
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-brand-800 to-brand-900 text-white shadow-lg shadow-brand-900/20 print:hidden">
      {/* Liseré orange — rappel de l'accent du logo UGA. */}
      <div className="h-1 bg-gradient-to-r from-uga-orange via-uga-orange/70 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3.5">
          {/* Bloc identité : logo + intitulé */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/#overview"
              aria-label={`${institution} — accueil`}
              className="shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition hover:shadow-md sm:p-2.5"
            >
              <Image
                src="/logo_uga.png"
                alt={institution}
                width={64}
                height={39}
                priority
                className="h-8 w-auto sm:h-9"
              />
            </a>

            <span className="hidden h-10 w-px bg-white/15 sm:block" aria-hidden="true" />

            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-100/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-uga-orange" aria-hidden="true" />
                SI décisionnel · Recherche
              </p>
              <h1 className="mt-0.5 text-base font-semibold leading-tight sm:text-xl">
                Pilotage de la production scientifique
              </h1>
            </div>
          </div>

          {/* Bloc méta : thème, sources, fraîcheur */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ThemeToggle />
              <Badge>OpenAlex · {formatInt(totals.openAlex)}</Badge>
              <Badge>HAL · {formatInt(totals.hal)}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-brand-100/60">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Totaux en direct · {today()}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap items-center gap-1 border-t border-white/10 py-2">
          {NAV.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : null;
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  Icon
                    ? "inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
                    : "rounded-lg px-3 py-1.5 text-xs font-medium text-brand-100/80 transition hover:bg-white/10 hover:text-white"
                }
              >
                {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
      {children}
    </span>
  );
}
