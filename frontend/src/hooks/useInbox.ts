import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { EmailEvent } from "@/types/database";

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
      const data = await api.getInboxThreads();
      // Map to expected format
      return data.map((thread: any) => ({
        leadId: thread.lead_id,
        lead: thread.lead,
        lastEvent: thread.last_event,
        hasReply: thread.has_reply,
        eventCount: thread.event_count
      })) as Thread[];
    },
  });
}

export function useThreadHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["thread-history", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const data = await api.getThreadHistory(leadId);
      return data as (EmailEvent & {
        lead: { id: string; email: string; first_name: string | null; last_name: string | null; company: string | null };
        campaign: { id: string; name: string };
      })[];
    },
    enabled: !!leadId,
  });
}
