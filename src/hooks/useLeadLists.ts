import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadList, CreateLeadListInput, UpdateLeadList } from "@/types/database";
import { toast } from "sonner";

export function useLeadLists() {
  return useQuery({
    queryKey: ["lead-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_lists")
        .select("*, leads(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map the nested count to the flat lead_count property
      return data.map((list: any) => ({
        ...list,
        lead_count: list.leads?.[0]?.count || 0
      })) as LeadList[];
    },
  });
}

export function useLeadList(id: string) {
  return useQuery({
    queryKey: ["lead-lists", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_lists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as LeadList;
    },
    enabled: !!id,
  });
}

export function useCreateLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLeadListInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lead_lists")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LeadList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      toast.success("Lead list created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create lead list: ${error.message}`);
    },
  });
}

export function useUpdateLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateLeadList }) => {
      const { data, error } = await supabase
        .from("lead_lists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as LeadList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      queryClient.invalidateQueries({ queryKey: ["lead-lists", data.id] });
      toast.success("Lead list updated");
    },
    onError: (error) => {
      toast.error(`Failed to update lead list: ${error.message}`);
    },
  });
}

export function useDeleteLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_lists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      toast.success("Lead list deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete lead list: ${error.message}`);
    },
  });
}
