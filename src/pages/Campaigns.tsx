import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Play, Pause, Trash2, Copy, Loader2, TrendingUp, BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { CampaignStatusBadge } from "@/components/dashboard/CampaignStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaigns, useUpdateCampaignStatus, useDeleteCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { CampaignStatus } from "@/types/database";

export default function Campaigns() {
  const { data: campaigns, isLoading } = useCampaigns();
  const updateStatus = useUpdateCampaignStatus();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  const handleStopOnReplyChange = async (id: string, checked: boolean) => {
    await updateCampaign.mutateAsync({
      id,
      updates: { stop_on_reply: checked }
    });
  };

  // Calculate high-level stats
  const activeCount = campaigns?.filter(c => c.status === 'active').length || 0;
  const totalSent = campaigns?.reduce((acc, curr) => acc + curr.sent_count, 0) || 0;
  const avgOpenRate = campaigns?.length 
    ? (campaigns.reduce((acc, curr) => acc + (curr.sent_count > 0 ? (curr.opened_count / curr.sent_count) : 0), 0) / campaigns.length * 100).toFixed(1)
    : "0";

  return (
    <AppLayout>
      <PageHeader
        title="Campaign Management"
        description="Monitor and optimize your outreach performance"
        actions={
          <Link to="/campaigns/new">
            <Button className="gap-2 rounded-full px-6 shadow-glow hover:shadow-primary/40 transition-all font-bold">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-8 animate-in fade-in duration-700">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-none overflow-hidden relative group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-white/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Performance High</span>
              </div>
              <p className="text-3xl font-black">{activeCount}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Active Campaigns</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>

          <Card className="glass-card border-none overflow-hidden relative group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Total Outreach</span>
              </div>
              <p className="text-3xl font-black">{totalSent.toLocaleString()}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Messages Dispatched</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none overflow-hidden relative group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-white/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Above Average</span>
              </div>
              <p className="text-3xl font-black">{avgOpenRate}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Average Open Velocity</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-card/30 p-4 rounded-2xl border border-white/10 glass-card">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              placeholder="Search by campaign name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                <Filter className="mr-2 h-4 w-4 opacity-40" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass-card border-none">
                <SelectItem value="all" className="font-bold">All Campaigns</SelectItem>
                <SelectItem value="active" className="font-bold">Active</SelectItem>
                <SelectItem value="paused" className="font-bold">Paused</SelectItem>
                <SelectItem value="draft" className="font-bold">Draft</SelectItem>
                <SelectItem value="completed" className="font-bold">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing Data...</p>
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="rounded-3xl border border-white/10 glass-card overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="px-8 py-5 text-left">Campaign Blueprint</th>
                    <th className="px-8 py-5 text-left">Current Phase</th>
                    <th className="px-8 py-5 text-left">Stop on Reply</th>
                    <th className="px-8 py-5 text-left">Outreach Velocity</th>
                    <th className="px-8 py-5 text-left">Engagement</th>
                    <th className="px-8 py-5 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCampaigns.map((campaign) => {
                    const openRate = campaign.sent_count > 0
                      ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                      : "0";
                    const replyRate = campaign.sent_count > 0
                      ? ((campaign.replied_count / campaign.sent_count) * 100).toFixed(1)
                      : "0";
                    const progress = campaign.total_leads > 0
                      ? (campaign.sent_count / campaign.total_leads) * 100
                      : 0;

                    return (
                      <tr key={campaign.id} className="group transition-all hover:bg-white/5">
                        <td className="px-8 py-6">
                          <Link
                            to={`/campaigns/${campaign.id}`}
                            className="font-black text-foreground hover:text-primary transition-colors text-lg tracking-tight"
                          >
                            {campaign.name}
                          </Link>
                          <div className="text-[10px] font-bold text-muted-foreground/60 mt-2 flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                             {campaign.sending_account?.email_address || "No Vessel Assigned"}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <CampaignStatusBadge status={campaign.status} />
                        </td>
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={campaign.stop_on_reply} 
                                    onCheckedChange={(checked) => handleStopOnReplyChange(campaign.id, checked)}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    {campaign.stop_on_reply ? "On" : "Off"}
                                </span>
                            </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-44">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                              <span className="text-primary">{Math.round(progress)}% Complete</span>
                              <span className="text-muted-foreground/40">{campaign.sent_count}/{campaign.total_leads}</span>
                            </div>
                            <Progress
                              value={progress}
                              className="h-2 bg-white/5 rounded-full overflow-hidden"
                            />
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className={cn("text-lg font-black tracking-tighter", parseFloat(openRate) > 20 ? "text-emerald-500" : "text-foreground")}>
                                {openRate}%
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Opens</span>
                            </div>
                            <div className="flex flex-col border-l border-white/5 pl-6">
                              <span className={cn("text-lg font-black tracking-tighter", parseFloat(replyRate) > 5 ? "text-emerald-500" : "text-foreground")}>
                                {replyRate}%
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Replies</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 transition-all opacity-40 group-hover:opacity-100">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-none min-w-[180px] p-2">
                              <DropdownMenuItem asChild className="rounded-xl font-bold py-3 px-4 focus:bg-primary/10 focus:text-primary transition-all">
                                <Link to={`/campaigns/${campaign.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="rounded-xl font-bold py-3 px-4 focus:bg-primary/10 focus:text-primary transition-all">
                                <Link to={`/campaigns/${campaign.id}/edit`}>
                                  Edit Campaign
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              {campaign.status === "active" ? (
                                <DropdownMenuItem
                                  className="rounded-xl font-bold py-3 px-4 text-amber-500 focus:bg-amber-500/10 focus:text-amber-500 transition-all"
                                  onClick={() => handleStatusChange(campaign.id, "paused")}
                                >
                                  <Pause className="mr-3 h-4 w-4" />
                                  Pause Campaign
                                </DropdownMenuItem>
                              ) : campaign.status !== "completed" ? (
                                <DropdownMenuItem
                                  className="rounded-xl font-bold py-3 px-4 text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500 transition-all"
                                  onClick={() => handleStatusChange(campaign.id, "active")}
                                >
                                  <Play className="mr-3 h-4 w-4" />
                                  {campaign.status === "draft" ? "Start Campaign" : "Resume Campaign"}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem className="rounded-xl font-bold py-3 px-4 focus:bg-white/10 transition-all">
                                <Copy className="mr-3 h-4 w-4 opacity-40" />
                                Clone Campaign
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem
                                className="rounded-xl font-bold py-3 px-4 text-destructive focus:bg-destructive/10 focus:text-destructive transition-all"
                                onClick={() => handleDelete(campaign.id)}
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 rounded-[32px] border-2 border-dashed border-white/5 bg-white/[0.02] text-center px-10">
            <div className="h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20 shadow-inner">
              <Plus className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-foreground">Create Your First Campaign</h3>
            <p className="text-muted-foreground/60 max-w-md mt-4 font-medium leading-relaxed">
              Every great outreach starts with a single campaign. Create your first campaign to initiate communication with your leads.
            </p>
            <Link to="/campaigns/new" className="mt-10">
              <Button className="gap-3 h-14 px-10 rounded-2xl shadow-glow hover:translate-y-[-2px] transition-all font-black uppercase tracking-widest">
                <Plus className="h-5 w-5" />
                Create Campaign
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
