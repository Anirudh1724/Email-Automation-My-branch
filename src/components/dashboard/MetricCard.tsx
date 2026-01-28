import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  className,
  iconClassName,
}: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                change.positive ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {change.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(change.value)}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10",
            iconClassName
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
