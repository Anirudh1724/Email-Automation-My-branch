import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SendingAccount, CreateSendingAccount, UpdateSendingAccount } from "@/types/database";
import { toast } from "sonner";

export function useSendingAccounts() {
  return useQuery({
    queryKey: ["sending-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sending_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SendingAccount[];
    },
  });
}

export function useSendingAccount(id: string) {
  return useQuery({
    queryKey: ["sending-accounts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sending_accounts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SendingAccount;
    },
    enabled: !!id,
  });
}

export function useCreateSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Partial<CreateSendingAccount>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("sending_accounts")
        .insert({
          user_id: user.id,
          email_address: account.email_address!,
          display_name: account.display_name,
          provider: account.provider || "smtp",
          smtp_host: account.smtp_host,
          smtp_port: account.smtp_port || 587,
          smtp_username: account.smtp_username,
          smtp_password_encrypted: account.smtp_password_encrypted,
          imap_host: account.imap_host,
          imap_port: account.imap_port || 993,
          imap_username: account.imap_username,
          imap_password_encrypted: account.imap_password_encrypted,
          daily_send_limit: account.daily_send_limit || 50,
          status: account.status || "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data as SendingAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      toast.success("Email account added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add email account: ${error.message}`);
    },
  });
}

export function useUpdateSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSendingAccount }) => {
      const { data, error } = await supabase
        .from("sending_accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SendingAccount;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["sending-accounts", data.id] });
      toast.success("Email account updated");
    },
    onError: (error) => {
      toast.error(`Failed to update email account: ${error.message}`);
    },
  });
}

export function useDeleteSendingAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sending_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-accounts"] });
      toast.success("Email account removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove email account: ${error.message}`);
    },
  });
}
