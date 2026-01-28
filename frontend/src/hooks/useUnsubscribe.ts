import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UnsubscribeEntry, DomainBlacklist } from "@/types/database";
import { toast } from "sonner";

// Unsubscribe list
export function useUnsubscribeList() {
  return useQuery({
    queryKey: ["unsubscribe-list"],
    queryFn: async () => {
      const data = await api.getUnsubscribeList();
      return data as UnsubscribeEntry[];
    },
  });
}

export function useAddToUnsubscribeList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason?: string }) => {
      const data = await api.addToUnsubscribeList(email, reason);
      return data as UnsubscribeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-list"] });
      toast.success("Added to unsubscribe list");
    },
    onError: (error) => {
      toast.error(`Failed to add to unsubscribe list: ${(error as Error).message}`);
    },
  });
}

export function useRemoveFromUnsubscribeList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.removeFromUnsubscribeList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-list"] });
      toast.success("Removed from unsubscribe list");
    },
    onError: (error) => {
      toast.error(`Failed to remove from unsubscribe list: ${(error as Error).message}`);
    },
  });
}

// Domain blacklist
export function useDomainBlacklist() {
  return useQuery({
    queryKey: ["domain-blacklist"],
    queryFn: async () => {
      const data = await api.getDomainBlacklist();
      return data as DomainBlacklist[];
    },
  });
}

export function useAddToDomainBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domain: string) => {
      const data = await api.addToDomainBlacklist(domain);
      return data as DomainBlacklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-blacklist"] });
      toast.success("Added to domain blacklist");
    },
    onError: (error) => {
      toast.error(`Failed to add to domain blacklist: ${(error as Error).message}`);
    },
  });
}

export function useRemoveFromDomainBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.removeFromDomainBlacklist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-blacklist"] });
      toast.success("Removed from domain blacklist");
    },
    onError: (error) => {
      toast.error(`Failed to remove from domain blacklist: ${(error as Error).message}`);
    },
  });
}
