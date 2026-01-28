import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { EmailEvent } from "@/types/database";

export function useEmailEvents(campaignId?: string) {
  return useQuery({
    queryKey: ["email-events", campaignId],
    queryFn: async () => {
      const data = await api.getEmailEvents(campaignId);
      return data as EmailEvent[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const data = await api.getEmailEvents();
      // Return last 10 events
      return (data as EmailEvent[]).slice(0, 10);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [events, campaigns, leads] = await Promise.all([
        api.getEmailEvents(),
        api.getCampaigns(),
        api.getLeads()
      ]);

      const emailEvents = events as EmailEvent[];
      const sentCount = emailEvents.filter(e => e.event_type === "sent").length;
      const openedCount = emailEvents.filter(e => e.event_type === "opened").length;
      const repliedCount = emailEvents.filter(e => e.event_type === "replied").length;
      const bouncedCount = emailEvents.filter(e => e.event_type === "bounced").length;

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === "active").length,
        totalLeads: leads.length,
        emailsSent: sentCount,
        emailsOpened: openedCount,
        emailsReplied: repliedCount,
        emailsBounced: bouncedCount,
        openRate: sentCount > 0 ? (openedCount / sentCount * 100).toFixed(1) : "0",
        replyRate: sentCount > 0 ? (repliedCount / sentCount * 100).toFixed(1) : "0",
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
