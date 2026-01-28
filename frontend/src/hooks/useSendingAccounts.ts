import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SendingAccount, CreateSendingAccount, UpdateSendingAccount } from "@/types/database";
import { toast } from "sonner";

export function useSendingAccounts() {
  return useQuery({
    queryKey: ["sending-accounts"],
    queryFn: async () => {
      const data = await api.getSendingAccounts();
      return data as SendingAccount[];
    },
  });
}

export function useSendingAccount(id: string) {
  return useQuery({
    queryKey: ["sending-accounts", id],
    queryFn: async () => {
      const data = await api.getSendingAccount(id);
      return data as SendingAccount;
    },
    enabled: !!id,
  });
}

export function useCreateSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Partial<CreateSendingAccount>) => {
      const data = await api.createSendingAccount(account);
      return data as SendingAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      toast.success("Email account added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add email account: ${(error as Error).message}`);
    },
  });
}

export function useUpdateSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSendingAccount }) => {
      const data = await api.updateSendingAccount(id, updates);
      return data as SendingAccount;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["sending-accounts", data.id] });
      toast.success("Email account updated");
    },
    onError: (error) => {
      toast.error(`Failed to update email account: ${(error as Error).message}`);
    },
  });
}

export function useDeleteSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteSendingAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      toast.success("Email account removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove email account: ${(error as Error).message}`);
    },
  });
}
