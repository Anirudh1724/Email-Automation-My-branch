import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnsubscribeEntry, DomainBlacklist } from "@/types/database";
import { toast } from "sonner";

export function useUnsubscribeList() {
  return useQuery({
    queryKey: ["unsubscribe-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unsubscribe_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UnsubscribeEntry[];
    },
  });
}

export function useAddToUnsubscribeList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, reason }: { email: string; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("unsubscribe_list")
        .insert({
          user_id: user.id,
          email,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UnsubscribeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-list"] });
      toast.success("Email added to unsubscribe list");
    },
    onError: (error) => {
      toast.error(`Failed to add email: ${error.message}`);
    },
  });
}

export function useRemoveFromUnsubscribeList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("unsubscribe_list")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsubscribe-list"] });
      toast.success("Email removed from unsubscribe list");
    },
    onError: (error) => {
      toast.error(`Failed to remove email: ${error.message}`);
    },
  });
}

// Domain Blacklist
export function useDomainBlacklist() {
  return useQuery({
    queryKey: ["domain-blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domain_blacklist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DomainBlacklist[];
    },
  });
}

export function useAddToDomainBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domain: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("domain_blacklist")
        .insert({
          user_id: user.id,
          domain,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DomainBlacklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-blacklist"] });
      toast.success("Domain added to blacklist");
    },
    onError: (error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });
}

export function useRemoveFromDomainBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("domain_blacklist")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-blacklist"] });
      toast.success("Domain removed from blacklist");
    },
    onError: (error) => {
      toast.error(`Failed to remove domain: ${error.message}`);
    },
  });
}
