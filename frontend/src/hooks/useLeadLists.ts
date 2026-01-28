import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { LeadList, CreateLeadListInput, UpdateLeadList } from "@/types/database";
import { toast } from "sonner";

export function useLeadLists() {
  return useQuery({
    queryKey: ["lead-lists"],
    queryFn: async () => {
      const data = await api.getLeadLists();
      return data as LeadList[];
    },
  });
}

export function useLeadList(id: string) {
  return useQuery({
    queryKey: ["lead-lists", id],
    queryFn: async () => {
      const data = await api.getLeadList(id);
      return data as LeadList;
    },
    enabled: !!id,
  });
}

export function useCreateLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLeadListInput) => {
      const data = await api.createLeadList(input);
      return data as LeadList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      toast.success("Lead list created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create lead list: ${(error as Error).message}`);
    },
  });
}

export function useUpdateLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateLeadList }) => {
      const data = await api.updateLeadList(id, updates);
      return data as LeadList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      queryClient.invalidateQueries({ queryKey: ["lead-lists", data.id] });
      toast.success("Lead list updated");
    },
    onError: (error) => {
      toast.error(`Failed to update lead list: ${(error as Error).message}`);
    },
  });
}

export function useDeleteLeadList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteLeadList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] });
      toast.success("Lead list deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete lead list: ${(error as Error).message}`);
    },
  });
}
