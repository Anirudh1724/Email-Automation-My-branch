-- 1. Add stop_on_reply column to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN stop_on_reply BOOLEAN NOT NULL DEFAULT true;

-- 2. Create function to handle new replies
CREATE OR REPLACE FUNCTION public.handle_new_reply_event()
RETURNS TRIGGER AS $$
DECLARE
  v_stop_on_reply BOOLEAN;
  v_campaign_id UUID;
BEGIN
  -- Only process 'replied' events
  IF NEW.event_type = 'replied' THEN
    
    -- Get campaign settings
    SELECT stop_on_reply INTO v_stop_on_reply
    FROM public.campaigns
    WHERE id = NEW.campaign_id;
    
    -- If campaign exists and stop_on_reply is true
    IF FOUND AND v_stop_on_reply THEN
      -- Update lead status to 'replied'
      UPDATE public.leads
      SET 
        status = 'replied',
        replied_at = COALESCE(replied_at, NEW.occurred_at)
      WHERE id = NEW.lead_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create trigger on email_events
DROP TRIGGER IF EXISTS on_reply_received ON public.email_events;
CREATE TRIGGER on_reply_received
  AFTER INSERT ON public.email_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reply_event();
