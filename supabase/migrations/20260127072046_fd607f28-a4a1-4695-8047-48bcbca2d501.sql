-- Create lead_lists table
CREATE TABLE public.lead_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add lead_list_id to leads table
ALTER TABLE public.leads 
ADD COLUMN lead_list_id UUID REFERENCES public.lead_lists(id) ON DELETE SET NULL;

-- Add lead_list_id to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN lead_list_id UUID REFERENCES public.lead_lists(id) ON DELETE SET NULL;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create domains table (for tracking/sending domain verification)
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verification_token TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, member_email)
);

-- Create domain_blacklist table
CREATE TABLE public.domain_blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Enable RLS on all new tables
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_lists
CREATE POLICY "Users can view own lead lists" ON public.lead_lists
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own lead lists" ON public.lead_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own lead lists" ON public.lead_lists
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own lead lists" ON public.lead_lists
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for domains
CREATE POLICY "Users can view own domains" ON public.domains
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own domains" ON public.domains
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own domains" ON public.domains
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own domains" ON public.domains
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for team_members
CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for domain_blacklist
CREATE POLICY "Users can view own domain blacklist" ON public.domain_blacklist
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert to own domain blacklist" ON public.domain_blacklist
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete from own domain blacklist" ON public.domain_blacklist
  FOR DELETE USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_lead_lists_updated_at
  BEFORE UPDATE ON public.lead_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update lead count on lead_lists
CREATE OR REPLACE FUNCTION public.update_lead_list_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lead_lists SET lead_count = lead_count + 1 WHERE id = NEW.lead_list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lead_lists SET lead_count = lead_count - 1 WHERE id = OLD.lead_list_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lead_list_id IS DISTINCT FROM NEW.lead_list_id THEN
    IF OLD.lead_list_id IS NOT NULL THEN
      UPDATE public.lead_lists SET lead_count = lead_count - 1 WHERE id = OLD.lead_list_id;
    END IF;
    IF NEW.lead_list_id IS NOT NULL THEN
      UPDATE public.lead_lists SET lead_count = lead_count + 1 WHERE id = NEW.lead_list_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_lead_list_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_list_count();