-- Recalculate counts to fix any sync issues

-- 1. Recalculate Lead List counts
UPDATE public.lead_lists ll
SET lead_count = (
  SELECT COUNT(*)
  FROM public.leads l
  WHERE l.lead_list_id = ll.id
);

-- 2. Recalculate Campaign stats
UPDATE public.campaigns c
SET 
  total_leads = (SELECT COUNT(*) FROM public.leads l WHERE l.campaign_id = c.id),
  sent_count = (SELECT COUNT(*) FROM public.leads l WHERE l.campaign_id = c.id AND l.current_step > 0),
  opened_count = (SELECT COUNT(*) FROM public.leads l WHERE l.campaign_id = c.id AND l.opened_at IS NOT NULL),
  replied_count = (SELECT COUNT(*) FROM public.leads l WHERE l.campaign_id = c.id AND l.replied_at IS NOT NULL),
  bounced_count = (SELECT COUNT(*) FROM public.leads l WHERE l.campaign_id = c.id AND l.bounced_at IS NOT NULL);
