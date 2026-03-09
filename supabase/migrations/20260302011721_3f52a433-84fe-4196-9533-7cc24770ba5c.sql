
-- Transactions table for e-commerce fraud detection
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  transaction_ref text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  merchant_name text,
  merchant_category text,
  customer_email text,
  customer_id text,
  payment_method text,
  country text,
  ip_address text,
  device_fingerprint text,
  risk_score numeric DEFAULT 0,
  risk_factors jsonb DEFAULT '[]'::jsonb,
  decision text NOT NULL DEFAULT 'pending',
  decision_confidence numeric DEFAULT 0,
  decided_by text DEFAULT 'pending',
  outcome text,
  outcome_score numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  outcome_at timestamptz
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Knowledge graph nodes
CREATE TABLE public.knowledge_graph_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  node_type text NOT NULL, -- customer, merchant, order, pattern
  label text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  domain text,
  weight numeric DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nodes" ON public.knowledge_graph_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nodes" ON public.knowledge_graph_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nodes" ON public.knowledge_graph_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nodes" ON public.knowledge_graph_nodes FOR DELETE USING (auth.uid() = user_id);

-- Knowledge graph edges (relationships)
CREATE TABLE public.knowledge_graph_edges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- transacted_with, flagged_for, similar_to, linked_to
  weight numeric DEFAULT 1.0,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edges" ON public.knowledge_graph_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own edges" ON public.knowledge_graph_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edges" ON public.knowledge_graph_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own edges" ON public.knowledge_graph_edges FOR DELETE USING (auth.uid() = user_id);

-- Pilot companies table
CREATE TABLE public.pilot_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  industry text DEFAULT 'e-commerce',
  vertical text,
  api_key text DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'onboarding',
  baseline_fraud_rate numeric DEFAULT 0,
  baseline_false_positive_rate numeric DEFAULT 0,
  current_fraud_rate numeric DEFAULT 0,
  current_false_positive_rate numeric DEFAULT 0,
  total_transactions integer DEFAULT 0,
  total_decisions integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pilot_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies" ON public.pilot_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companies" ON public.pilot_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own companies" ON public.pilot_companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own companies" ON public.pilot_companies FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_decision ON public.transactions(decision);
CREATE INDEX idx_transactions_risk_score ON public.transactions(risk_score);
CREATE INDEX idx_transactions_agent_id ON public.transactions(agent_id);
CREATE INDEX idx_kg_nodes_type ON public.knowledge_graph_nodes(node_type);
CREATE INDEX idx_kg_nodes_user ON public.knowledge_graph_nodes(user_id);
CREATE INDEX idx_kg_edges_source ON public.knowledge_graph_edges(source_node_id);
CREATE INDEX idx_kg_edges_target ON public.knowledge_graph_edges(target_node_id);
CREATE INDEX idx_pilot_companies_user ON public.pilot_companies(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_kg_nodes_updated_at BEFORE UPDATE ON public.knowledge_graph_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pilot_companies_updated_at BEFORE UPDATE ON public.pilot_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
