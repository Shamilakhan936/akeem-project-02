-- Enable realtime for remaining tables (feedback_events already enabled)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'agent_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'agents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shared_insights') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_insights;
  END IF;
END $$;