import { Plus, Send, Users, MailOpen, Reply, Loader2, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useLeads } from "@/hooks/useLeads";
import { useRecentActivity, useDashboardStats } from "@/hooks/useEmailEvents";
import { CampaignStatusBadge } from "@/components/dashboard/CampaignStatusBadge";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Mail, MailOpen as MailOpenIcon, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const activityConfig = {
  sent: { icon: Mail, color: "text-primary bg-primary/10", label: "Email sent to" },
  opened: { icon: MailOpenIcon, color: "text-success bg-success/10", label: "Email opened by" },
  replied: { icon: Reply, color: "text-chart-4 bg-chart-4/10", label: "Reply received from" },
  bounced: { icon: AlertCircle, color: "text-destructive bg-destructive/10", label: "Email bounced for" },
  clicked: { icon: Mail, color: "text-primary bg-primary/10", label: "Link clicked by" },
  unsubscribed: { icon: AlertCircle, color: "text-muted-foreground bg-muted", label: "Unsubscribed" },
};

export default function Dashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(10);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const recentCampaigns = campaigns?.slice(0, 4) || [];
  const totalLeads = leads?.length || 0;

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your campaign overview."
        actions={
          <Link to="/campaigns/new">
            <Button className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-10">
        {/* Metrics Grid - Super-Premium Style */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Outreach"
            value={statsLoading ? "..." : stats?.totalSent.toLocaleString() || "0"}
            icon={Send}
            className="glass-card bg-gradient-to-br from-blue-500/[0.08] to-indigo-500/[0.03] border-blue-500/10"
            iconClassName="text-blue-600"
          />
          <MetricCard
            title="Warmed Leads"
            value={leadsLoading ? "..." : totalLeads.toLocaleString()}
            icon={Users}
            className="glass-card bg-gradient-to-br from-violet-500/[0.08] to-purple-500/[0.03] border-violet-500/10"
            iconClassName="text-violet-600"
          />
          <MetricCard
            title="Engagement"
            value={statsLoading ? "..." : `${stats?.openRate || 0}%`}
            icon={MailOpen}
            className="glass-card bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.03] border-emerald-500/10"
            iconClassName="text-emerald-600"
          />
          <MetricCard
            title="Response Rate"
            value={statsLoading ? "..." : `${stats?.replyRate || 0}%`}
            icon={Reply}
            className="glass-card bg-gradient-to-br from-rose-500/[0.08] to-pink-500/[0.03] border-rose-500/10"
            iconClassName="text-rose-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Recent Campaigns */}
          <div className="lg:col-span-3">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/10 px-8 py-6">
                <div>
                  <h3 className="font-bold text-xl text-foreground">Strategic Campaigns</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Live performance tracking</p>
                </div>
                <Link to="/campaigns">
                  <Button variant="outline" size="sm" className="rounded-full px-5 text-xs font-bold border-border/10">
                    Explore all
                  </Button>
                </Link>
              </div>

              {campaignsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentCampaigns.length > 0 ? (
                <div className="divide-y divide-border/10">
                  {recentCampaigns.map((campaign) => {
                    const progress = campaign.total_leads > 0
                      ? (campaign.sent_count / campaign.total_leads) * 100
                      : 0;
                    const openRate = campaign.sent_count > 0
                      ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                      : "0";
                    const replyRate = campaign.sent_count > 0
                      ? ((campaign.replied_count / campaign.sent_count) * 100).toFixed(1)
                      : "0";

                    return (
                      <div
                        key={campaign.id}
                        className="group flex items-center gap-8 px-8 py-6 transition-all hover:bg-white/40"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <Link
                              to={`/campaigns/${campaign.id}`}
                              className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate"
                            >
                              {campaign.name}
                            </Link>
                            <CampaignStatusBadge status={campaign.status} />
                          </div>
                          <div className="mt-3 flex items-center gap-8">
                            <div className="flex items-center gap-2 group/stat">
                              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover/stat:bg-blue-600 group-hover/stat:text-white transition-colors">
                                <Send className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{campaign.sent_count} sent</span>
                            </div>
                            <div className="flex items-center gap-2 group/stat">
                              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover/stat:bg-emerald-600 group-hover/stat:text-white transition-colors">
                                <MailOpen className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{openRate}% opened</span>
                            </div>
                            <div className="flex items-center gap-2 group/stat">
                              <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover/stat:bg-orange-600 group-hover/stat:text-white transition-colors">
                                <Reply className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{replyRate}% replied</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-48 hidden xl:block">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                            <span>Engagement</span>
                            <span className="text-primary">{Math.round(progress)}%</span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-1.5 bg-muted/30"
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/campaigns/${campaign.id}`}>View Analysis</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/campaigns/${campaign.id}/edit`}>Edit Strategy</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                    <Send className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">Initialize your reach</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6 px-4">
                    Scale your business by creating a multi-touchpoint email campaign.
                  </p>
                  <Link to="/campaigns/new">
                    <Button className="rounded-full px-8 h-12 shadow-glow hover:shadow-primary/30 transition-shadow">
                      Start First Campaign
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity - Super-Premium Glass */}
          <div className="lg:col-span-2">
            <div className="glass-card h-full flex flex-col">
              <div className="border-b border-border/10 px-8 py-6">
                <h3 className="font-bold text-xl text-foreground">Interaction Stream</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Live audience events</p>
              </div>

              {activityLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="divide-y divide-border/5 relative max-h-[600px] overflow-auto flex-1">
                  {recentActivity.map((event) => {
                    const config = activityConfig[event.event_type] || activityConfig.sent;
                    const Icon = config.icon;
                    const leadName = event.lead?.first_name
                      ? `${event.lead.first_name} ${event.lead.last_name || ""}`
                      : event.lead?.email || "Unknown";

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-5 px-8 py-5 transition-all hover:bg-white/40 group"
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner border border-white/40 group-hover:scale-110 transition-transform",
                            config.color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-bold text-foreground">{leadName}</span>
                            <span className="text-muted-foreground font-medium ml-1.5 lowercase">
                              {config.label.replace("Email ", "").replace("Link ", "")}
                            </span>
                          </p>
                          <p className="mt-1 text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider opacity-70">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse"></span>
                            {event.campaign?.name}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/60 whitespace-nowrap bg-muted/20 px-2 py-0.5 rounded-full uppercase">
                          {new Date(event.occurred_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                  <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Monitoring interactions...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
