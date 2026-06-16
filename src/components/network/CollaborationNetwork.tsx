"use client";

import { useMemo, useState } from "react";
import { communityColor } from "@/lib/colors";
import { formatInt } from "@/lib/format";
import type { NetworkMart } from "@/lib/types";

/**
 * Force-directed collaboration graph. Positions and communities are computed
 * offline (ForceAtlas2 + Louvain); this component only renders and adds hover
 * interaction, so the client stays light regardless of corpus size.
 */
export function CollaborationNetwork({ data }: { data: NetworkMart }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const maxWorks = useMemo(() => Math.max(1, ...data.nodes.map((n) => n.works)), [data.nodes]);
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of data.edges) {
      (map.get(e.source) ?? map.set(e.source, new Set()).get(e.source)!).add(e.target);
      (map.get(e.target) ?? map.set(e.target, new Set()).get(e.target)!).add(e.source);
    }
    return map;
  }, [data.edges]);

  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);
  const radius = (works: number) => 4 + 18 * Math.sqrt(works / maxWorks);
  const isActive = (id: string) => !hovered || hovered === id || neighbors.get(hovered)?.has(id);
  const hoveredNode = hovered ? nodeById.get(hovered) : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 1000 1000" className="h-[480px] w-full" preserveAspectRatio="xMidYMid meet">
        {data.edges.map((e, i) => {
          const a = nodeById.get(e.source);
          const b = nodeById.get(e.target);
          if (!a || !b) return null;
          const active = hovered ? hovered === e.source || hovered === e.target : false;
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={active ? communityColor(a.community) : "#94a3b8"}
              strokeOpacity={hovered ? (active ? 0.6 : 0.03) : 0.12}
              strokeWidth={active ? 1.5 : 0.6}
            />
          );
        })}
        {data.nodes.map((n) => (
          <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
            <circle
              cx={n.x} cy={n.y} r={radius(n.works)}
              fill={communityColor(n.community)}
              fillOpacity={isActive(n.id) ? 0.9 : 0.18}
              stroke="white" strokeWidth={1}
            />
            {n.works > maxWorks * 0.45 || hovered === n.id ? (
              <text x={n.x} y={n.y - radius(n.works) - 3} textAnchor="middle" className="pointer-events-none fill-slate-600 text-[10px] dark:fill-slate-300">
                {n.name.length > 22 ? `${n.name.slice(0, 22)}…` : n.name}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      {hoveredNode ? (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[240px] rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800/95">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{hoveredNode.name}</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {formatInt(hoveredNode.works)} co-publications
            {hoveredNode.country ? ` · ${hoveredNode.country}` : ""}
          </p>
          <p className="text-slate-400 dark:text-slate-500">Communauté {hoveredNode.community + 1}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        {data.communities.slice(0, 6).map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: communityColor(c.id) }} />
            <span className="font-medium text-slate-700 dark:text-slate-200">Communauté {c.id + 1}</span>
            <span className="text-slate-400 dark:text-slate-500">({c.size}) · {c.topMembers[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
