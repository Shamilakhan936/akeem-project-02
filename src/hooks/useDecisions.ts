import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DecisionTemplate {
  id: string;
  user_id: string;
  agent_id: string | null;
  decision_type: string;
  name: string;
  description: string | null;
  metrics: { name: string; target: number; unit: string }[];
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackEvent {
  id: string;
  user_id: string;
  agent_id: string;
  decision_template_id: string | null;
  stage: string;
  action_taken: string;
  outcome: string | null;
  outcome_score: number | null;
  reinforcement_delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NetworkScale {
  id: string;
  total_companies: number;
  total_agents: number;
  total_decisions: number;
  total_cross_domain_transfers: number;
  verticals: string[];
  avg_accuracy_improvement: number;
  avg_roi_improvement: number;
  avg_error_reduction: number;
  recorded_at: string;
}

export function useDecisionTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["decision-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DecisionTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateDecisionTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (template: {
      decision_type: string;
      name: string;
      description?: string;
      agent_id?: string;
      metrics: { name: string; target: number; unit: string }[];
    }) => {
      const { data, error } = await supabase.from("decision_templates").insert({
        user_id: user!.id,
        decision_type: template.decision_type,
        name: template.name,
        description: template.description || null,
        agent_id: template.agent_id || null,
        metrics: template.metrics as unknown as any,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision-templates"] });
      toast.success("Decision template created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDecisionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("decision_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFeedbackEvents(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feedback-events", user?.id, agentId],
    queryFn: async () => {
      let q = supabase
        .from("feedback_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (agentId) q = q.eq("agent_id", agentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as FeedbackEvent[];
    },
    enabled: !!user,
  });
}

export function useCreateFeedbackEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: {
      agent_id: string;
      decision_template_id?: string;
      stage: string;
      action_taken: string;
      outcome?: string;
      outcome_score?: number;
      reinforcement_delta?: number;
    }) => {
      const { data, error } = await supabase.from("feedback_events").insert({
        user_id: user!.id,
        ...event,
        decision_template_id: event.decision_template_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useNetworkScale() {
  return useQuery({
    queryKey: ["network-scale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_scale")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as NetworkScale[];
    },
  });
}
