import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Domain } from "@/types/database";
import { toast } from "sonner";

export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Domain[];
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domain: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a simple verification token
      const verificationToken = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

      const { data, error } = await supabase
        .from("domains")
        .insert({
          user_id: user.id,
          domain,
          status: "pending",
          verification_token: verificationToken,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain added. Please verify it.");
    },
    onError: (error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("domains")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove domain: ${error.message}`);
    },
  });
}

export function useVerifyDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, this would verify DNS records
      // For now, we just mark it as verified
      const { data, error } = await supabase
        .from("domains")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Domain verified successfully");
    },
    onError: (error) => {
      toast.error(`Failed to verify domain: ${error.message}`);
    },
  });
}
