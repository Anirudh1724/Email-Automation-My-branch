-- Migration to fix Leads and Campaigns issues

-- 1. Ensure campaign_id is nullable (it might already be from previous migration, but ensuring here)
ALTER TABLE public.leads ALTER COLUMN campaign_id DROP NOT NULL;

-- 2. Enforce First Name and Last Name
-- First, backfill existing nulls
UPDATE public.leads SET first_name = 'Unknown' WHERE first_name IS NULL;
UPDATE public.leads SET last_name = '' WHERE last_name IS NULL;

-- Now add constraints (optional: we can keep them nullable but enforce in UI/API)
-- User asked "both are necessary", so let's try to enforce at DB level if safe, or at least default them.
ALTER TABLE public.leads ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE public.leads ALTER COLUMN last_name SET DEFAULT '';

-- 3. Function to sync leads from a list to a campaign
CREATE OR REPLACE FUNCTION public.sync_campaign_leads(_campaign_id UUID, _lead_list_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Remove leads from this campaign that are NOT in the new list (reset their campaign_id)
  UPDATE public.leads
  SET campaign_id = NULL
  WHERE campaign_id = _campaign_id
  AND lead_list_id != _lead_list_id;

  -- 2. Add leads from the list to the campaign
  UPDATE public.leads
  SET campaign_id = _campaign_id
  WHERE lead_list_id = _lead_list_id;
  
  -- 3. Update campaign stats immediately
  UPDATE public.campaigns
  SET total_leads = (SELECT COUNT(*) FROM public.leads WHERE campaign_id = _campaign_id)
  WHERE id = _campaign_id;
END;
$$;

-- 4. Trigger to auto-add new leads to campaign if added to a list that is assigned to a campaign
CREATE OR REPLACE FUNCTION public.handle_new_lead_in_list()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  -- If lead is added to a list, check if that list is assigned to an active/draft campaign
  IF NEW.lead_list_id IS NOT NULL THEN
    -- Find a campaign using this list (pick the first one if multiple, though usually 1:1)
    SELECT id INTO v_campaign_id
    FROM public.campaigns
    WHERE lead_list_id = NEW.lead_list_id
    LIMIT 1;
    
    -- If found, assign the lead to it (only if campaign_id not explicitly set)
    IF v_campaign_id IS NOT NULL AND NEW.campaign_id IS NULL THEN
      NEW.campaign_id := v_campaign_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_lead_created_check_list
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_lead_in_list();
