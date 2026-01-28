import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useDomainHealth(domainId: string) {
  return useQuery({
    queryKey: ["domain-health", domainId],
    queryFn: async () => {
      const data = await api.getDomainHealth(domainId);
      return data;
    },
    enabled: !!domainId,
  });
}
