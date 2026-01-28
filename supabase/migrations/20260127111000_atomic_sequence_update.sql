-- Atomic function to update campaign sequence steps
CREATE OR REPLACE FUNCTION public.update_campaign_sequence(_campaign_id UUID, _steps JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check if the user owns the campaign
  IF NOT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = _campaign_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Delete existing sequences for this campaign
  DELETE FROM public.email_sequences
  WHERE campaign_id = _campaign_id;

  -- 3. Insert new sequences from the JSONB array
  INSERT INTO public.email_sequences (
    campaign_id,
    step_number,
    subject,
    body,
    delay_days,
    delay_hours,
    is_reply
  )
  SELECT
    _campaign_id,
    (step->>'step_number')::INTEGER,
    step->>'subject',
    step->>'body',
    (step->>'delay_days')::INTEGER,
    (step->>'delay_hours')::INTEGER,
    (step->>'is_reply')::BOOLEAN
  FROM jsonb_array_elements(_steps) AS step;
END;
$$;
