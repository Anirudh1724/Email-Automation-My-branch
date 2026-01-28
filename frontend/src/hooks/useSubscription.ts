import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Subscription } from "@/types/database";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const data = await api.getSubscription();
      return data as Subscription;
    },
  });
}
