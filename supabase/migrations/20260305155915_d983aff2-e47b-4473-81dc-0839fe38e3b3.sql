CREATE TABLE IF NOT EXISTS public.enterprise_partner_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  team_size TEXT NOT NULL,
  primary_use_case TEXT NOT NULL,
  deployment_timeline TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'signup',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_partner_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enterprise onboarding"
ON public.enterprise_partner_onboarding
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enterprise onboarding"
ON public.enterprise_partner_onboarding
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enterprise onboarding"
ON public.enterprise_partner_onboarding
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_partner_onboarding_user_id
ON public.enterprise_partner_onboarding (user_id);

CREATE TRIGGER update_enterprise_partner_onboarding_updated_at
BEFORE UPDATE ON public.enterprise_partner_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.partner_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enterprise_onboarding_id UUID REFERENCES public.enterprise_partner_onboarding(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  team_size TEXT NOT NULL,
  primary_use_case TEXT NOT NULL,
  deployment_timeline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own partner handoffs"
ON public.partner_handoffs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner handoffs"
ON public.partner_handoffs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner handoffs"
ON public.partner_handoffs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_partner_handoffs_user_id
ON public.partner_handoffs (user_id);

CREATE INDEX IF NOT EXISTS idx_partner_handoffs_status
ON public.partner_handoffs (status);

CREATE TRIGGER update_partner_handoffs_updated_at
BEFORE UPDATE ON public.partner_handoffs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();