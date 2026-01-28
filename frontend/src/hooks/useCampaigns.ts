import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Campaign, CreateCampaignInput, UpdateCampaign, EmailSequence, CreateSequenceInput, EmailSequenceVariant } from "@/types/database";
import { toast } from "sonner";

// Types for joined data from queries
export interface CampaignWithAccount extends Campaign {
  sending_account: { id: string; email_address: string; display_name: string | null; status: string } | null;
}

export interface CampaignWithDetails extends Campaign {
  sending_account: { id: string; email_address: string; display_name: string | null; status: string } | null;
  sequences: (EmailSequence & { variants: EmailSequenceVariant[] })[];
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const data = await api.getCampaigns();
      return data as CampaignWithAccount[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: async () => {
      const data = await api.getCampaign(id);
      return data as CampaignWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: CreateCampaignInput & { sequences?: CreateSequenceInput[] }) => {
      const data = await api.createCampaign(campaign);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${(error as Error).message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCampaign }) => {
      const data = await api.updateCampaign(id, updates);
      return data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns", data.id] });
      toast.success("Campaign updated");
    },
    onError: (error) => {
      toast.error(`Failed to update campaign: ${(error as Error).message}`);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${(error as Error).message}`);
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign["status"] }) => {
      const data = await api.updateCampaignStatus(id, status);
      return data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns", data.id] });

      const statusMessages: Record<string, string> = {
        active: "Campaign started",
        paused: "Campaign paused",
        completed: "Campaign completed",
        draft: "Campaign moved to draft",
      };
      toast.success(statusMessages[data.status] || "Campaign status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update campaign status: ${(error as Error).message}`);
    },
  });
}
