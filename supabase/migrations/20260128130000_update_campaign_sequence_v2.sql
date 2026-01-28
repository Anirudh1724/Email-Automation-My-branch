-- Recursive function update to handle variants
CREATE OR REPLACE FUNCTION public.update_campaign_sequence(_campaign_id UUID, _steps JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _step JSONB;
  _sequence_id UUID;
  _variant JSONB;
BEGIN
  -- 1. Check if the user owns the campaign
  IF NOT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = _campaign_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Delete existing sequences (cascades to variants)
  DELETE FROM public.email_sequences
  WHERE campaign_id = _campaign_id;

  -- 3. Loop through steps
  FOR _step IN SELECT * FROM jsonb_array_elements(_steps)
  LOOP
    -- Insert sequence
    INSERT INTO public.email_sequences (
      campaign_id,
      step_number,
      subject,
      body,
      delay_days,
      delay_hours,
      is_reply
    ) VALUES (
      _campaign_id,
      (_step->>'step_number')::INTEGER,
      _step->>'subject',
      _step->>'body',
      (_step->>'delay_days')::INTEGER,
      (_step->>'delay_hours')::INTEGER,
      (_step->>'is_reply')::BOOLEAN
    ) RETURNING id INTO _sequence_id;

    -- Insert variants if present
    IF _step ? 'variants' AND jsonb_array_length(_step->'variants') > 0 THEN
      INSERT INTO public.email_sequence_variants (
        sequence_id,
        subject,
        body,
        weight
      )
      SELECT
        _sequence_id,
        variant->>'subject',
        variant->>'body',
        COALESCE((variant->>'weight')::INTEGER, 0)
      FROM jsonb_array_elements(_step->'variants') AS variant;
    ELSE
       -- Fallback: create default variant from main fields
       INSERT INTO public.email_sequence_variants (
        sequence_id,
        subject,
        body,
        weight
      ) VALUES (
        _sequence_id,
        _step->>'subject',
        _step->>'body',
        100
      );
    END IF;
  END LOOP;
END;
$$;
