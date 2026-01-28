import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  MoreHorizontal,
  Send,
  MailOpen,
  Reply,
  AlertCircle,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CampaignStatusBadge } from "@/components/dashboard/CampaignStatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCampaign, useUpdateCampaignStatus, useDeleteCampaign } from "@/hooks/useCampaigns";
import { useLeads } from "@/hooks/useLeads";
import { useEmailEvents } from "@/hooks/useEmailEvents";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  sent: "bg-primary/10 text-primary",
  opened: "bg-success/10 text-success",
  replied: "bg-chart-4/10 text-chart-4",
  bounced: "bg-destructive/10 text-destructive",
  unsubscribed: "bg-muted text-muted-foreground",
  completed: "bg-muted text-muted-foreground",
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id!);
  const { data: leads, isLoading: leadsLoading } = useLeads(id);
  const { data: events, isLoading: eventsLoading } = useEmailEvents(id);
  const updateStatus = useUpdateCampaignStatus();
  const deleteCampaign = useDeleteCampaign();

  if (campaignLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button variant="link" onClick={() => navigate("/campaigns")}>
            Back to campaigns
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Calculate stats from real data
  const totalLeads = campaign.total_leads || leads?.length || 0;
  const sentCount = campaign.sent_count || 0;
  const openedCount = campaign.opened_count || 0;
  const repliedCount = campaign.replied_count || 0;
  const bouncedCount = campaign.bounced_count || 0;

  const openRate = sentCount > 0 ? ((openedCount / sentCount) * 100).toFixed(1) : "0";
  const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : "0";
  const bounceRate = sentCount > 0 ? ((bouncedCount / sentCount) * 100).toFixed(1) : "0";
  const progress = totalLeads > 0 ? (sentCount / totalLeads) * 100 : 0;

  // Calculate sequence stats from events
  const sequences = campaign.sequences || [];
  const sequenceStats = sequences.map((seq) => {
    const stepEvents = events?.filter((e) => e.step_number === seq.step_number) || [];
    const sentEvents = stepEvents.filter((e) => e.event_type === "sent").length;
    const openedEvents = stepEvents.filter((e) => e.event_type === "opened").length;
    const repliedEvents = stepEvents.filter((e) => e.event_type === "replied").length;
    
    return {
      ...seq,
      sent: sentEvents,
      openRate: sentEvents > 0 ? ((openedEvents / sentEvents) * 100).toFixed(1) : "0",
      replyRate: sentEvents > 0 ? ((repliedEvents / sentEvents) * 100).toFixed(1) : "0",
    };
  });

  const handleToggleStatus = async () => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    await updateStatus.mutateAsync({ id: campaign.id, status: newStatus });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
      await deleteCampaign.mutateAsync(campaign.id);
      navigate("/campaigns");
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-4">
          <Link to="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {campaign.name}
              </h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {campaign.sending_account?.email_address || "No sending account"} • Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {campaign.status === "active" ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleToggleStatus}
              disabled={updateStatus.isPending}
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : campaign.status === "paused" || campaign.status === "draft" ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleToggleStatus}
              disabled={updateStatus.isPending}
            >
              <Play className="h-4 w-4" />
              {campaign.status === "draft" ? "Start" : "Resume"}
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/campaigns/${id}/edit`)}>
                Edit Campaign
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Leads"
            value={totalLeads.toLocaleString()}
            icon={Users}
          />
          <MetricCard
            title="Emails Sent"
            value={sentCount.toLocaleString()}
            icon={Send}
          />
          <MetricCard
            title="Open Rate"
            value={`${openRate}%`}
            icon={MailOpen}
          />
          <MetricCard
            title="Reply Rate"
            value={`${replyRate}%`}
            icon={Reply}
          />
          <MetricCard
            title="Bounce Rate"
            value={`${bounceRate}%`}
            icon={AlertCircle}
          />
        </div>

        {/* Progress */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Campaign Progress</h3>
              <p className="text-sm text-muted-foreground">
                {sentCount} of {totalLeads} leads contacted
              </p>
            </div>
            <span className="text-2xl font-bold text-primary">
              {progress.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <Tabs defaultValue="sequence" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sequence">Sequence</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="sequence" className="space-y-4">
            {sequenceStats.length > 0 ? (
              sequenceStats.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 rounded-xl border bg-card p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
                    {step.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {index === 0 ? "Initial Email" : `Follow-up ${index}`}
                      </h4>
                      {index > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {step.delay_days || 0} days after previous
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.subject || "No subject"}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="font-medium text-foreground">{step.sent}</p>
                      <p className="text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{step.openRate}%</p>
                      <p className="text-muted-foreground">Opened</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{step.replyRate}%</p>
                      <p className="text-muted-foreground">Replied</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                No email sequence configured yet.{" "}
                <Link to={`/campaigns/${id}/edit`} className="text-primary hover:underline">
                  Add one now
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads && leads.length > 0 ? (
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Status</th>
                      <th>Current Step</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div>
                            <p className="font-medium">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.email}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              statusColors[lead.status] || statusColors.active
                            )}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td>Step {lead.current_step || 0}</td>
                        <td className="text-muted-foreground">
                          {lead.updated_at ? format(new Date(lead.updated_at), "MMM d, h:mm a") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                No leads in this campaign yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="rounded-xl border bg-card divide-y">
                {events.slice(0, 50).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 px-6 py-4">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium capitalize",
                        statusColors[event.event_type] || statusColors.sent
                      )}
                    >
                      {event.event_type.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium capitalize">{event.event_type}</span>
                        {event.recipient_email && (
                          <span className="text-muted-foreground"> — {event.recipient_email}</span>
                        )}
                      </p>
                      {event.subject && (
                        <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.occurred_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                No activity yet. Activity will appear here once the campaign starts sending emails.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
