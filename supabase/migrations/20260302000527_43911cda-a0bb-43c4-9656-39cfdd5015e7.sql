
-- Create agent_events table for activity tracking
CREATE TABLE public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_agent_events_agent_id ON public.agent_events(agent_id);
CREATE INDEX idx_agent_events_created_at ON public.agent_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

-- Users can only see events for their own agents
CREATE POLICY "Users can view their own agent events"
ON public.agent_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent events"
ON public.agent_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent events"
ON public.agent_events FOR DELETE
USING (auth.uid() = user_id);
