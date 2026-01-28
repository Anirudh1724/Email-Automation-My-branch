import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Domain } from "@/types/database";
import { toast } from "sonner";

export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const data = await api.getDomains();
      return data as Domain[];
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domain: string) => {
      const data = await api.createDomain(domain);
      return data as Domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add domain: ${(error as Error).message}`);
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteDomain(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove domain: ${(error as Error).message}`);
    },
  });
}

export function useVerifyDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call the domain health check and update status if valid
      const health = await api.getDomainHealth(id);
      if (health.checks?.dns?.status === "ok") {
        const data = await api.updateDomain(id, { status: "verified", verified_at: new Date().toISOString() });
        return data as Domain;
      }
      throw new Error("Domain verification failed - DNS not configured properly");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain verified successfully");
    },
    onError: (error) => {
      toast.error(`Failed to verify domain: ${(error as Error).message}`);
    },
  });
}
