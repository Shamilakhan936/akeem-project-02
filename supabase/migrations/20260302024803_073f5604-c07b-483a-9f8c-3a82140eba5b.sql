-- Fix security definer views to use security invoker instead
ALTER VIEW public.pilot_companies_safe SET (security_invoker = on);
ALTER VIEW public.webhook_configs_safe SET (security_invoker = on);