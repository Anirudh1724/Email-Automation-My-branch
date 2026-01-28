import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmailEvent, Lead } from "@/types/database";

export interface Thread {
  leadId: string;
  lead: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
  };
  lastEvent: EmailEvent;
  hasReply: boolean;
  eventCount: number;
}

export function useInbox() {
  return useQuery({
    queryKey: ["inbox-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_events")
        .select(`
          *,
          lead:leads(id, email, first_name, last_name, company)
        `)
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      const typedData = data as any[];

      // Group by lead_id to create threads
      const threadsMap = new Map<string, Thread>();
      
      typedData.forEach((event) => {
        const leadId = event.lead_id;
        if (!threadsMap.has(leadId)) {
          threadsMap.set(leadId, {
            leadId,
            lead: event.lead,
            lastEvent: event,
            hasReply: typedData.some(e => e.lead_id === leadId && e.event_type === 'replied'),
            eventCount: typedData.filter(e => e.lead_id === leadId).length
          });
        }
      });

      return Array.from(threadsMap.values());
    },
  });
}

export function useThreadHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["thread-history", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from("email_events")
        .select(`
          *,
          lead:leads(id, email, first_name, last_name, company),
          campaign:campaigns(id, name)
        `)
        .eq("lead_id", leadId)
        .order("occurred_at", { ascending: true });

      if (error) throw error;
      return (data as any) as (EmailEvent & { 
        lead: { id: string; email: string; first_name: string | null; last_name: string | null; company: string | null };
        campaign: { id: string; name: string };
      })[];
    },
    enabled: !!leadId,
  });
}
