/**
 * Types et helpers minimalistes pour le format Jupyter (`.ipynb`, nbformat 4).
 * On ne modélise que ce que le visualiseur rend réellement.
 */

export interface NotebookEntry {
  id: string;
  title: string;
  category: string;
  file: string;
  status: string;
}

export interface NotebooksManifest {
  generatedAt: string;
  notebooks: NotebookEntry[];
}

export type MimeBundle = Record<string, unknown>;

export interface CellOutput {
  output_type: "stream" | "execute_result" | "display_data" | "error";
  name?: string;
  text?: string | string[];
  data?: MimeBundle;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

export interface NotebookCell {
  cell_type: "markdown" | "code" | "raw";
  source: string | string[];
  outputs?: CellOutput[];
  execution_count?: number | null;
}

export interface Notebook {
  cells: NotebookCell[];
  metadata?: Record<string, unknown>;
}

/** nbformat autorise `source`/`text` en string ou array de lignes. */
export function joinSource(source: string | string[] | undefined): string {
  if (!source) return "";
  return Array.isArray(source) ? source.join("") : source;
}

/** Première valeur d'un type MIME donné dans un bundle. */
export function mime(data: MimeBundle | undefined, key: string): string | undefined {
  const v = data?.[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join("");
  return undefined;
}
