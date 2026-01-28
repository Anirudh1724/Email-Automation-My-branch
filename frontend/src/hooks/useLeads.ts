import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Lead } from "@/types/database";
import { toast } from "sonner";

// Types for joined data from queries
export interface LeadWithCampaign extends Lead {
  campaign: { id: string; name: string } | null;
}

export function useLeads(campaignId?: string, leadListId?: string) {
  return useQuery({
    queryKey: ["leads", campaignId, leadListId],
    queryFn: async () => {
      const data = await api.getLeads(campaignId, leadListId);
      return data as LeadWithCampaign[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["leads", "detail", id],
    queryFn: async () => {
      const data = await api.getLead(id);
      return data as LeadWithCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: { lead_list_id: string; campaign_id?: string; email: string; first_name?: string; last_name?: string; company?: string; custom_fields?: Record<string, unknown>; status?: string }) => {
      const data = await api.createLead(lead);
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
      toast.error(`Failed to add lead: ${(error as Error).message}`);
    },
  });
}

export function useCreateLeadsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadListId, campaignId, leads }: { leadListId: string; campaignId?: string; leads: { email: string; first_name?: string; last_name?: string; company?: string; custom_fields?: Record<string, unknown> }[] }) => {
      const data = await api.createLeadsBulk(leadListId, campaignId, leads);
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
      toast.error(`Failed to import leads: ${(error as Error).message}`);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ email: string; first_name: string; last_name: string; company: string; status: string }> }) => {
      const data = await api.updateLead(id, updates);
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ["leads", "detail", data.id] });
      toast.success("Lead updated");
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${(error as Error).message}`);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteLead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${(error as Error).message}`);
    },
  });
}

export function useDeleteLeadsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.deleteLeadsBulk(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Leads deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete leads: ${(error as Error).message}`);
    },
  });
}
