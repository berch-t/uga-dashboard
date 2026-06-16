/**
 * Tiny, dependency-free CSV reader/writer (RFC 4180 subset).
 *
 * Handles quoted fields, embedded commas/newlines and escaped quotes — enough
 * to safely round-trip the structured exports we treat as "internal files".
 */

/** Parse CSV text into an array of row objects keyed by header. */
export function parseCsv(text: string): Array<Record<string, string>> {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const header = rows[0]!;
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = cells[i] ?? "";
    });
    return record;
  });
}

/** Low-level parse into a matrix of string cells. */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

/** Serialise rows (objects) to CSV text using the given column order. */
export function toCsv(rows: Array<Record<string, string | number | null>>, columns: string[]): string {
  const escape = (v: string | number | null): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const row of rows) lines.push(columns.map((c) => escape(row[c] ?? "")).join(","));
  return lines.join("\n");
}
