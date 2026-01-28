import { cn } from "@/lib/utils";

type CampaignStatus = "active" | "paused" | "draft" | "completed";

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "active" },
  paused: { label: "Paused", className: "paused" },
  draft: { label: "Draft", className: "draft" },
  completed: { label: "Completed", className: "completed" },
};

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("status-badge", config.className)}>{config.label}</span>
  );
}
