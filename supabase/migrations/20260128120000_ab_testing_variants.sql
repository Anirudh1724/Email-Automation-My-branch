-- Create email_sequence_variants table
CREATE TABLE public.email_sequence_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 50,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_variants_sequence ON public.email_sequence_variants(sequence_id);

-- RLS Policies
ALTER TABLE public.email_sequence_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence variants" ON public.email_sequence_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      JOIN public.campaigns c ON s.campaign_id = c.id
      WHERE s.id = email_sequence_variants.sequence_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sequence variants" ON public.email_sequence_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      JOIN public.campaigns c ON s.campaign_id = c.id
      WHERE s.id = email_sequence_variants.sequence_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sequence variants" ON public.email_sequence_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      JOIN public.campaigns c ON s.campaign_id = c.id
      WHERE s.id = email_sequence_variants.sequence_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sequence variants" ON public.email_sequence_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      JOIN public.campaigns c ON s.campaign_id = c.id
      WHERE s.id = email_sequence_variants.sequence_id
      AND c.user_id = auth.uid()
    )
  );
