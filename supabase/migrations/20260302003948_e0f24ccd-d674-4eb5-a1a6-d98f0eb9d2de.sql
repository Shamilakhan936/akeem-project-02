
-- Decision templates: define what decisions an agent can make and how to measure them
CREATE TABLE public.decision_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  decision_type text NOT NULL, -- fraud_detection, route_optimization, inventory_restock, ad_budget
  name text NOT NULL,
  description text,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{name, target, unit}]
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decision templates" ON public.decision_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decision templates" ON public.decision_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decision templates" ON public.decision_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decision templates" ON public.decision_templates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_decision_templates_updated_at
  BEFORE UPDATE ON public.decision_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Feedback events: structured outcome logging for the feedback pipeline
CREATE TABLE public.feedback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  decision_template_id uuid REFERENCES public.decision_templates(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'action', -- action, outcome, reinforcement, global_update, policy_refinement, propagation
  action_taken text NOT NULL,
  outcome text,
  outcome_score numeric,
  reinforcement_delta numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback events" ON public.feedback_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback events" ON public.feedback_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback events" ON public.feedback_events FOR DELETE USING (auth.uid() = user_id);

-- Network scale metrics: track cross-company growth
CREATE TABLE public.network_scale (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_companies integer NOT NULL DEFAULT 0,
  total_agents integer NOT NULL DEFAULT 0,
  total_decisions bigint NOT NULL DEFAULT 0,
  total_cross_domain_transfers integer NOT NULL DEFAULT 0,
  verticals text[] DEFAULT '{}',
  avg_accuracy_improvement numeric DEFAULT 0,
  avg_roi_improvement numeric DEFAULT 0,
  avg_error_reduction numeric DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.network_scale ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view network scale" ON public.network_scale FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert network scale" ON public.network_scale FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Indexes
CREATE INDEX idx_decision_templates_agent ON public.decision_templates(agent_id);
CREATE INDEX idx_decision_templates_type ON public.decision_templates(decision_type);
CREATE INDEX idx_feedback_events_agent ON public.feedback_events(agent_id);
CREATE INDEX idx_feedback_events_stage ON public.feedback_events(stage);
CREATE INDEX idx_feedback_events_created ON public.feedback_events(created_at);
CREATE INDEX idx_network_scale_recorded ON public.network_scale(recorded_at);

-- Enable realtime for feedback events
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_events;
