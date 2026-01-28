import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DomainHealthStats {
  sentCount: number;
  bouncedCount: number;
  replyCount: number;
  bounceRate: number;
  healthScore: number;
  warmupProgress: number;
}

export const useDomainHealth = (accountId: string) => {
  return useQuery({
    queryKey: ['domain-health', accountId],
    queryFn: async (): Promise<DomainHealthStats> => {
      // 1. Get raw counts from email_events for this account
      // We look at the last 30 days for health score calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: events, error } = await supabase
        .from('email_events')
        .select('event_type')
        .eq('sending_account_id', accountId)
        .gte('occurred_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching domain health:', error);
        throw error;
      }

      const sentCount = events.filter(e => e.event_type === 'sent').length;
      const bouncedCount = events.filter(e => e.event_type === 'bounced').length;
      const replyCount = events.filter(e => e.event_type === 'replied').length;

      // 2. Calculate Stats
      const bounceRate = sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0;
      
      // Health Score Logic (Simple):
      // Start at 100.
      // Deduct 20 points for every 1% bounce rate above 2%.
      // e.g., 3% bounce rate = 20 points penalty = 80 score.
      let healthScore = 100;
      if (bounceRate > 2) {
        healthScore -= (bounceRate - 2) * 20;
      }
      healthScore = Math.max(0, Math.min(100, healthScore));

      // 3. Get generic account info for warmup status (optional overlap, but good for self-contained hook)
      const { data: account } = await supabase
        .from('sending_accounts')
        .select('warmup_progress')
        .eq('id', accountId)
        .single();

      return {
        sentCount,
        bouncedCount,
        replyCount,
        bounceRate,
        healthScore,
        warmupProgress: account?.warmup_progress || 0
      };
    },
    enabled: !!accountId
  });
};
