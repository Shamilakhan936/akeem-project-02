
-- Table: agent_learnings - stores individual learning events from each agent
CREATE TABLE public.agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  learning_type text NOT NULL DEFAULT 'behavioral', -- behavioral, error_correction, performance, strategic
  embedding_summary text NOT NULL,
  confidence_score numeric DEFAULT 0.0,
  domain text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert learnings for their agents"
  ON public.agent_learnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learnings"
  ON public.agent_learnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learnings"
  ON public.agent_learnings FOR DELETE
  USING (auth.uid() = user_id);

-- Table: shared_insights - cross-agent aggregated intelligence patterns
CREATE TABLE public.shared_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL DEFAULT 'pattern', -- pattern, anomaly, strategy, cross_domain
  title text NOT NULL,
  description text NOT NULL,
  source_domains text[] DEFAULT '{}',
  source_agent_count integer DEFAULT 1,
  confidence numeric DEFAULT 0.0,
  impact_score numeric DEFAULT 0.0,
  status text NOT NULL DEFAULT 'active', -- active, archived, superseded
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_insights ENABLE ROW LEVEL SECURITY;

-- Shared insights are readable by all authenticated users (they're network-wide)
CREATE POLICY "Authenticated users can view shared insights"
  ON public.shared_insights FOR SELECT
  TO authenticated
  USING (true);

-- Only system (via service role) inserts insights, but allow users too for demo
CREATE POLICY "Authenticated users can insert shared insights"
  ON public.shared_insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Table: intelligence_metrics - tracks network-level metrics over time
CREATE TABLE public.intelligence_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL, -- prediction_accuracy, strategy_score, anomaly_detection_rate, network_agents, total_learnings
  metric_value numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'daily', -- hourly, daily, weekly
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics"
  ON public.intelligence_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert metrics"
  ON public.intelligence_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for shared_insights so dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_metrics;

-- Trigger for updated_at on shared_insights
CREATE TRIGGER update_shared_insights_updated_at
  BEFORE UPDATE ON public.shared_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_agent_learnings_agent_id ON public.agent_learnings(agent_id);
CREATE INDEX idx_agent_learnings_domain ON public.agent_learnings(domain);
CREATE INDEX idx_shared_insights_type ON public.shared_insights(insight_type);
CREATE INDEX idx_intelligence_metrics_name ON public.intelligence_metrics(metric_name);
CREATE INDEX idx_intelligence_metrics_recorded ON public.intelligence_metrics(recorded_at);
