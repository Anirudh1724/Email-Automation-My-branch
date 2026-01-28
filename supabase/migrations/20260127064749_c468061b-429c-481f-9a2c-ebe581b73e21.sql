-- Fix security warnings

-- 1. Fix function search path for update_campaign_stats
CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts based on status change
  UPDATE public.campaigns
  SET
    sent_count = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = NEW.campaign_id AND current_step > 0),
    opened_count = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
    replied_count = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = NEW.campaign_id AND replied_at IS NOT NULL),
    bounced_count = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = NEW.campaign_id AND bounced_at IS NOT NULL),
    total_leads = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = NEW.campaign_id)
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix function search path for reset_daily_send_counts
CREATE OR REPLACE FUNCTION public.reset_daily_send_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.sending_accounts SET sent_today = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Fix function search path for handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Also create default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Fix overly permissive RLS policy for email_events insert
-- Replace the service role insert with a more restrictive policy
DROP POLICY IF EXISTS "Service can insert events" ON public.email_events;

-- Allow inserts only for events related to campaigns the user owns
-- This will be bypassed by service role key in edge functions
CREATE POLICY "Users can insert events for own campaigns"
  ON public.email_events FOR INSERT
  WITH CHECK (public.is_campaign_owner(campaign_id));