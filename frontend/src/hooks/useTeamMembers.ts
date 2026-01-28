import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { TeamMember } from "@/types/database";
import { toast } from "sonner";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const data = await api.getTeamMembers();
      return data as TeamMember[];
    },
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: string }) => {
      const data = await api.inviteTeamMember(email, role);
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member invited");
    },
    onError: (error) => {
      toast.error(`Failed to invite team member: ${(error as Error).message}`);
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.removeTeamMember(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove team member: ${(error as Error).message}`);
    },
  });
}
