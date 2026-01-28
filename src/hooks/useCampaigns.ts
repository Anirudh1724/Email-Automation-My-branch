import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          sending_account:sending_accounts(id, email_address, display_name, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CampaignWithAccount[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          sending_account:sending_accounts(id, email_address, display_name, status),
          sequences:email_sequences(
            *,
            variants:email_sequence_variants(*)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as CampaignWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: CreateCampaignInput & { sequences?: CreateSequenceInput[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: campaign.name!,
          description: campaign.description,
          sending_account_id: campaign.sending_account_id,
          lead_list_id: campaign.lead_list_id,
          status: campaign.status || "draft",
          daily_send_limit: campaign.daily_send_limit || 50,
          send_gap_seconds: campaign.send_gap_seconds || 60,
          randomize_timing: campaign.randomize_timing ?? true,
          weekdays_only: campaign.weekdays_only ?? true,
          start_time: campaign.start_time || "09:00",
          end_time: campaign.end_time || "18:00",
          timezone: campaign.timezone || "America/New_York",
          scheduled_start_at: campaign.scheduled_start_at,
          stop_on_reply: campaign.stop_on_reply ?? true,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create sequences if provided
      if (campaign.sequences && campaign.sequences.length > 0) {
        const sequencesToInsert = campaign.sequences.map((seq, index) => ({
          campaign_id: campaignData.id,
          step_number: seq.step_number || index + 1,
          subject: seq.subject || "",
          body: seq.body || "",
          delay_days: seq.delay_days || 0,
          delay_hours: seq.delay_hours || 0,
          delay_minutes: seq.delay_minutes || 0,
          is_reply: seq.is_reply ?? (index > 0),
        }));

        const { data: sequenceData, error: seqError } = await supabase
          .from("email_sequences")
          .insert(sequencesToInsert)
          .select("id, step_number");

        if (seqError) throw seqError;

        // Create variants if provided
        const variantsToInsert: any[] = [];
        
        // Map created sequences back to input sequences to find variants
        campaign.sequences.forEach((seq) => {
           // Find the created sequence ID for this step
           const stepNum = seq.step_number || (campaign.sequences?.indexOf(seq) || 0) + 1;
           const createdSeq = sequenceData.find(s => s.step_number === stepNum);
           
           if (createdSeq && seq.variants && seq.variants.length > 0) {
             seq.variants.forEach(variant => {
               variantsToInsert.push({
                 sequence_id: createdSeq.id,
                 subject: variant.subject,
                 body: variant.body,
                 weight: variant.weight || 50,
               });
             });
           }
        });

        if (variantsToInsert.length > 0) {
          const { error: varError } = await (supabase
            .from("email_sequence_variants" as any)
            .insert(variantsToInsert));
            
          if (varError) throw varError;
        }
      }

      return campaignData as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCampaign }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns", data.id] });
      toast.success("Campaign updated");
    },
    onError: (error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign["status"] }) => {
      const updates: Partial<Campaign> = { status };
      
      if (status === "active") {
        updates.started_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
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
      toast.error(`Failed to update campaign status: ${error.message}`);
    },
  });
}
