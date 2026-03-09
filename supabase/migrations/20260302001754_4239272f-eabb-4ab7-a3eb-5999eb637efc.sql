
-- Create team_role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid,
  invited_email text NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, invited_email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Add team_id to agents (nullable, agents without team are personal)
ALTER TABLE public.agents ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND status = 'accepted'
  )
$$;

-- Security definer function to check team admin/owner
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND status = 'accepted'
      AND role IN ('owner', 'admin')
  )
$$;

-- Teams RLS: members can view their teams
CREATE POLICY "Team members can view their team"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id) OR owner_id = auth.uid());

-- Only authenticated users can create teams
CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only admins/owners can update teams
CREATE POLICY "Team admins can update their team"
ON public.teams FOR UPDATE
USING (public.is_team_admin(auth.uid(), id));

-- Only owner can delete team
CREATE POLICY "Team owner can delete team"
ON public.teams FOR DELETE
USING (auth.uid() = owner_id);

-- Team members RLS
CREATE POLICY "Team members can view members"
ON public.team_members FOR SELECT
USING (public.is_team_member(auth.uid(), team_id) OR user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()));

-- Admins/owners can invite
CREATE POLICY "Team admins can invite members"
ON public.team_members FOR INSERT
WITH CHECK (public.is_team_admin(auth.uid(), team_id) OR 
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()));

-- Admins can update member roles
CREATE POLICY "Team admins can update members"
ON public.team_members FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id) OR user_id = auth.uid());

-- Admins can remove members
CREATE POLICY "Team admins can remove members"
ON public.team_members FOR DELETE
USING (public.is_team_admin(auth.uid(), team_id) OR user_id = auth.uid());

-- Update agents policy: team members can view team agents
CREATE POLICY "Team members can view team agents"
ON public.agents FOR SELECT
USING (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id));

-- Trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
