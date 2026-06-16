import { formatDate, formatInt } from "@/lib/format";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  institution: string;
  generatedAt: string;
  openAlexTotal: number;
  halTotal: number;
}

const NAV: Array<{ href: string; label: string; emphasis?: boolean }> = [
  { href: "/#overview", label: "Vue d'ensemble" },
  { href: "/#production", label: "Production" },
  { href: "/#impact", label: "Impact" },
  { href: "/#emerging", label: "Signaux émergents" },
  { href: "/#network", label: "Collaborations" },
  { href: "/#contracts", label: "Contrats" },
  { href: "/#quality", label: "Qualité des données" },
  { href: "/#explorer", label: "Explorateur" },
  { href: "/notebooks", label: "Notebooks", emphasis: true },
  { href: "/explore", label: "Navigateur d'API", emphasis: true },
];

/** Sticky institutional header with provenance badges and section nav. */
export function Header({ institution, generatedAt, openAlexTotal, halTotal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-700/30 bg-brand-900 text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-100/70">
              Système d&apos;information décisionnel · Recherche
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-tight sm:text-xl">
              Pilotage de la production scientifique
            </h1>
            <p className="text-sm text-brand-100/80">{institution}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ThemeToggle />
              <Badge>OpenAlex · {formatInt(openAlexTotal)} publications</Badge>
              <Badge>HAL · {formatInt(halTotal)} dépôts</Badge>
            </div>
            <p className="text-xs text-brand-100/60">
              Données réelles · instantané du {formatDate(generatedAt)}
            </p>
          </div>
        </div>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-100/80">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={
                item.emphasis
                  ? "rounded-full bg-white/15 px-2 py-0.5 font-medium text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/25"
                  : "transition hover:text-white"
              }
            >
              {item.label}
            </a>
          ))}
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
