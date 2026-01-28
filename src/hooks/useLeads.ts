import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/database";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Types for joined data from queries
export interface LeadWithCampaign extends Lead {
  campaign: { id: string; name: string } | null;
}

export function useLeads(campaignId?: string, leadListId?: string) {
  return useQuery({
    queryKey: ["leads", campaignId, leadListId],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          campaign:campaigns(id, name)
        `)
        .order("created_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      if (leadListId) {
        query = query.eq("lead_list_id", leadListId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as LeadWithCampaign[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["leads", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          campaign:campaigns(id, name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as LeadWithCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: { lead_list_id: string; campaign_id?: string; email: string; first_name?: string; last_name?: string; company?: string; custom_fields?: Record<string, unknown>; status?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          lead_list_id: lead.lead_list_id,
          campaign_id: lead.campaign_id || null, // Allow null if optional
          email: lead.email,
          first_name: lead.first_name || null,
          last_name: lead.last_name || null,
          company: lead.company || null,
          custom_fields: (lead.custom_fields || {}) as Json,
          status: (lead.status || "active") as "active" | "sent" | "opened" | "replied" | "bounced" | "unsubscribed" | "completed",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (data.campaign_id) {
        queryClient.invalidateQueries({ queryKey: ["leads", data.campaign_id] });
      }
      toast.success("Lead added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add lead: ${error.message}`);
    },
  });
}

export function useCreateLeadsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadListId, campaignId, leads }: { leadListId: string; campaignId?: string; leads: { email: string; first_name?: string; last_name?: string; company?: string; custom_fields?: Record<string, unknown> }[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const leadsToInsert = leads.map((lead) => ({
        user_id: user.id,
        lead_list_id: leadListId,
        campaign_id: campaignId || null,
        email: lead.email,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        company: lead.company || null,
        custom_fields: (lead.custom_fields || {}) as Json,
        status: "active" as const,
      }));

      const { data, error } = await supabase
        .from("leads")
        .insert(leadsToInsert)
        .select();

      if (error) throw error;
      return data as Lead[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ["leads", variables.campaignId] });
      }
      toast.success(`${data.length} leads imported successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to import leads: ${error.message}`);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ email: string; first_name: string; last_name: string; company: string; status: string }> }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ["leads", "detail", data.id] });
      toast.success("Lead updated");
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });
}

export function useDeleteLeadsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Leads deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete leads: ${error.message}`);
    },
  });
}
