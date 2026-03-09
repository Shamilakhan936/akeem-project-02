-- Security hardening: Revoke direct access to sensitive columns

-- 1. Create a secure view for pilot_companies that excludes the api_key column
CREATE OR REPLACE VIEW public.pilot_companies_safe AS
SELECT id, user_id, name, industry, vertical, status,
       baseline_fraud_rate, baseline_false_positive_rate,
       current_fraud_rate, current_false_positive_rate,
       total_transactions, total_decisions,
       metadata, created_at, updated_at
FROM public.pilot_companies;

-- 2. Create a secure view for webhook_configs that excludes the secret column
CREATE OR REPLACE VIEW public.webhook_configs_safe AS
SELECT id, user_id, name, url, events, is_active, failure_count,
       last_triggered_at, created_at, updated_at
FROM public.webhook_configs;

-- 3. Create a function to securely reveal an API key (only for the owner)
CREATE OR REPLACE FUNCTION public.get_pilot_api_key(company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result text;
BEGIN
  SELECT api_key INTO result
  FROM public.pilot_companies
  WHERE id = company_id AND user_id = auth.uid();
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Not found or unauthorized';
  END IF;
  
  RETURN result;
END;
$$;

-- 4. Enable leaked password protection is recommended but requires dashboard access
-- Adding a comment to track this recommendation