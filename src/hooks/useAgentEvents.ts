import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AgentEvent = {
  id: string;
  agent_id: string;
  user_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const useAgentEvents = (agentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["agent-events", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_events")
        .select("*")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AgentEvent[];
    },
    enabled: !!user && !!agentId,
  });

  const logEvent = useMutation({
    mutationFn: async ({
      agentId: aId,
      eventType,
      description,
      metadata = {},
    }: {
      agentId: string;
      eventType: string;
      description: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("agent_events").insert([{
        agent_id: aId,
        user_id: user!.id,
        event_type: eventType,
        description,
        metadata: metadata as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-events"] });
    },
  });

  return { events, isLoading, logEvent };
};
