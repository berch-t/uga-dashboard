import { Card } from "@tremor/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

/** Consistent titled container for every chart/visual on the board. */
export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </Card>
  );
}
