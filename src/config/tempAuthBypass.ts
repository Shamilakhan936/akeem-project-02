import type { User } from "@supabase/supabase-js";

/**
 * TEMPORARY — set to `false` to restore login + protected routes.
 * When true: dashboard routes are open and React context exposes a stub user
 * so hooks that use `enabled: !!user` still run. Supabase RLS still applies
 * (real session may be absent), so some data/actions can fail until you sign in.
 */
export const TEMP_DISABLE_AUTH = true;

const now = new Date().toISOString();

export const TEMP_BYPASS_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "dev-bypass@local.test",
  app_metadata: {},
  user_metadata: {},
  created_at: now,
  updated_at: now,
};
