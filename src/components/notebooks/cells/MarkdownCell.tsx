"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/** Rend une cellule markdown (GFM + maths KaTeX), façon Colab. */
export function MarkdownCell({ source }: { source: string }) {
  return (
    <div className="prose prose-slate max-w-none px-4 py-3 dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-2 prose-p:leading-relaxed prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
