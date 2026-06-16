/** Locale-aware formatting helpers (French). */

const intFormatter = new Intl.NumberFormat("fr-FR");
const compactFormatter = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

export const formatInt = (n: number): string => intFormatter.format(Math.round(n));

export const formatCompact = (n: number): string => compactFormatter.format(n);

export const formatPercent = (ratio: number, digits = 1): string =>
  `${(ratio * 100).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

export const formatDecimal = (n: number, digits = 1): string =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const eurFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 });

/** Compact euro amount, e.g. "78,4 M €". */
export const formatEur = (n: number): string => eurFormatter.format(n);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
