
-- Tighten INSERT policies to only allow via service role or specific conditions
-- Drop the overly permissive INSERT policies
DROP POLICY "Authenticated users can insert shared insights" ON public.shared_insights;
DROP POLICY "Authenticated users can insert metrics" ON public.intelligence_metrics;

-- Re-create with a user_id tracking approach isn't needed for network-wide data
-- Instead, we'll keep INSERT open but add a created_by column for audit
ALTER TABLE public.shared_insights ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.intelligence_metrics ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Scoped INSERT: user must be authenticated and set created_by to their own ID
CREATE POLICY "Users can insert shared insights"
  ON public.shared_insights FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can insert metrics"
  ON public.intelligence_metrics FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
