import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmailEvent } from "@/types/database";

export function useEmailEvents(campaignId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["email-events", campaignId, leadId],
    queryFn: async () => {
      let query = supabase
        .from("email_events")
        .select(`
          *,
          lead:leads(id, email, first_name, last_name),
          campaign:campaigns(id, name)
        `)
        .order("occurred_at", { ascending: false })
        .limit(100);

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (EmailEvent & { 
        lead: { id: string; email: string; first_name: string | null; last_name: string | null };
        campaign: { id: string; name: string };
      })[];
    },
  });
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ["email-events", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_events")
        .select(`
          *,
          lead:leads(id, email, first_name, last_name),
          campaign:campaigns(id, name)
        `)
        .order("occurred_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as (EmailEvent & { 
        lead: { id: string; email: string; first_name: string | null; last_name: string | null };
        campaign: { id: string; name: string };
      })[];
    },
  });
}

export function useCampaignStats(campaignId: string) {
  return useQuery({
    queryKey: ["campaign-stats", campaignId],
    queryFn: async () => {
      // Get counts by event type
      const { data, error } = await supabase
        .from("email_events")
        .select("event_type")
        .eq("campaign_id", campaignId);

      if (error) throw error;

      const stats = {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      };

      data.forEach((event) => {
        if (event.event_type in stats) {
          stats[event.event_type as keyof typeof stats]++;
        }
      });

      return stats;
    },
    enabled: !!campaignId,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get total leads
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      // Get total sent emails
      const { count: totalSent } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "sent");

      // Get total opens
      const { count: totalOpened } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "opened");

      // Get total replies
      const { count: totalReplied } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "replied");

      const openRate = totalSent && totalOpened ? (totalOpened / totalSent) * 100 : 0;
      const replyRate = totalSent && totalReplied ? (totalReplied / totalSent) * 100 : 0;

      return {
        totalLeads: totalLeads || 0,
        totalSent: totalSent || 0,
        totalOpened: totalOpened || 0,
        totalReplied: totalReplied || 0,
        openRate: openRate.toFixed(1),
        replyRate: replyRate.toFixed(1),
      };
    },
  });
}
