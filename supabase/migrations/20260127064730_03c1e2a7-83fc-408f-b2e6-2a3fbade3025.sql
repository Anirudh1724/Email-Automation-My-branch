-- =============================================
-- EMAIL AUTOMATION SAAS - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE public.provider_type AS ENUM ('google', 'outlook', 'smtp');
CREATE TYPE public.account_status AS ENUM ('active', 'paused', 'error', 'warming');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE public.lead_status AS ENUM ('active', 'sent', 'opened', 'replied', 'bounced', 'unsubscribed', 'completed');
CREATE TYPE public.event_type AS ENUM ('sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed');

-- 2. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES TABLE (for future team features)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. SENDING ACCOUNTS TABLE
-- =============================================
CREATE TABLE public.sending_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  display_name TEXT,
  provider provider_type NOT NULL DEFAULT 'smtp',
  -- OAuth credentials (encrypted at rest by Supabase)
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,
  -- SMTP credentials
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  -- IMAP settings for inbox monitoring
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  imap_username TEXT,
  imap_password_encrypted TEXT,
  -- Limits and status
  daily_send_limit INTEGER DEFAULT 50,
  sent_today INTEGER DEFAULT 0,
  warmup_enabled BOOLEAN DEFAULT false,
  warmup_progress INTEGER DEFAULT 0,
  status account_status NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sending_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sending_accounts_user_id ON public.sending_accounts(user_id);
CREATE INDEX idx_sending_accounts_status ON public.sending_accounts(status);

-- 5. CAMPAIGNS TABLE
-- =============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sending_account_id UUID REFERENCES public.sending_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  -- Sending configuration
  daily_send_limit INTEGER DEFAULT 50,
  send_gap_seconds INTEGER DEFAULT 60,
  randomize_timing BOOLEAN DEFAULT true,
  weekdays_only BOOLEAN DEFAULT true,
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/New_York',
  -- Stats (denormalized for performance)
  total_leads INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  -- Scheduling
  scheduled_start_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_sending_account ON public.campaigns(sending_account_id);

-- 6. EMAIL SEQUENCES (steps in a campaign)
-- =============================================
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  delay_minutes INTEGER DEFAULT 0,
  is_reply BOOLEAN DEFAULT false, -- If true, sends as reply in thread
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, step_number)
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_sequences_campaign ON public.email_sequences(campaign_id);

-- 7. LEADS TABLE
-- =============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  custom_fields JSONB DEFAULT '{}',
  status lead_status NOT NULL DEFAULT 'active',
  -- Threading
  thread_id TEXT,
  last_message_id TEXT,
  -- Current progress
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  -- Timestamps
  first_sent_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_leads_campaign ON public.leads(campaign_id);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_next_send ON public.leads(next_send_at) WHERE status = 'active';
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_thread_id ON public.leads(thread_id) WHERE thread_id IS NOT NULL;

-- 8. EMAIL EVENTS TABLE (log everything)
-- =============================================
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE SET NULL,
  sending_account_id UUID REFERENCES public.sending_accounts(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  step_number INTEGER,
  message_id TEXT,
  -- Event details
  subject TEXT,
  recipient_email TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_events_lead ON public.email_events(lead_id);
CREATE INDEX idx_email_events_campaign ON public.email_events(campaign_id);
CREATE INDEX idx_email_events_type ON public.email_events(event_type);
CREATE INDEX idx_email_events_occurred ON public.email_events(occurred_at DESC);
CREATE INDEX idx_email_events_message_id ON public.email_events(message_id) WHERE message_id IS NOT NULL;

-- 9. EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_templates_user ON public.email_templates(user_id);

-- 10. UNSUBSCRIBE LIST (global blacklist)
-- =============================================
CREATE TABLE public.unsubscribe_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

ALTER TABLE public.unsubscribe_list ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_unsubscribe_user ON public.unsubscribe_list(user_id);
CREATE INDEX idx_unsubscribe_email ON public.unsubscribe_list(email);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if user owns a record directly
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
$$;

-- Check if user owns the campaign
CREATE OR REPLACE FUNCTION public.is_campaign_owner(_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = _campaign_id AND user_id = auth.uid()
  )
$$;

-- Check if user owns the sending account
CREATE OR REPLACE FUNCTION public.is_sending_account_owner(_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sending_accounts
    WHERE id = _account_id AND user_id = auth.uid()
  )
$$;

-- Check if user owns the lead
CREATE OR REPLACE FUNCTION public.is_lead_owner(_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = auth.uid()
  )
$$;

-- Check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- USER ROLES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- SENDING ACCOUNTS
CREATE POLICY "Users can view own sending accounts"
  ON public.sending_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sending accounts"
  ON public.sending_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sending accounts"
  ON public.sending_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sending accounts"
  ON public.sending_accounts FOR DELETE
  USING (user_id = auth.uid());

-- CAMPAIGNS
CREATE POLICY "Users can view own campaigns"
  ON public.campaigns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns"
  ON public.campaigns FOR DELETE
  USING (user_id = auth.uid());

-- EMAIL SEQUENCES
CREATE POLICY "Users can view own sequences"
  ON public.email_sequences FOR SELECT
  USING (public.is_campaign_owner(campaign_id));

CREATE POLICY "Users can insert own sequences"
  ON public.email_sequences FOR INSERT
  WITH CHECK (public.is_campaign_owner(campaign_id));

CREATE POLICY "Users can update own sequences"
  ON public.email_sequences FOR UPDATE
  USING (public.is_campaign_owner(campaign_id));

CREATE POLICY "Users can delete own sequences"
  ON public.email_sequences FOR DELETE
  USING (public.is_campaign_owner(campaign_id));

-- LEADS
CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_campaign_owner(campaign_id));

CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own leads"
  ON public.leads FOR DELETE
  USING (user_id = auth.uid());

-- EMAIL EVENTS
CREATE POLICY "Users can view own events"
  ON public.email_events FOR SELECT
  USING (public.is_campaign_owner(campaign_id));

-- Service role can insert events (from edge functions)
CREATE POLICY "Service can insert events"
  ON public.email_events FOR INSERT
  WITH CHECK (true);

-- EMAIL TEMPLATES
CREATE POLICY "Users can view own templates"
  ON public.email_templates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.email_templates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.email_templates FOR DELETE
  USING (user_id = auth.uid());

-- UNSUBSCRIBE LIST
CREATE POLICY "Users can view own unsubscribe list"
  ON public.unsubscribe_list FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to own unsubscribe list"
  ON public.unsubscribe_list FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from own unsubscribe list"
  ON public.unsubscribe_list FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sending_accounts_updated_at
  BEFORE UPDATE ON public.sending_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update campaign stats when lead status changes
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

CREATE TRIGGER update_campaign_stats_on_lead_change
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_stats();

-- Reset daily send counts at midnight
CREATE OR REPLACE FUNCTION public.reset_daily_send_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.sending_accounts SET sent_today = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;