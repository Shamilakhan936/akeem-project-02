import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SharedInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  source_domains: string[];
  source_agent_count: number;
  confidence: number;
  impact_score: number;
  status: string;
  created_at: string;
}

export interface IntelligenceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  period: string;
  recorded_at: string;
}

export interface AgentLearning {
  id: string;
  agent_id: string;
  learning_type: string;
  embedding_summary: string;
  confidence_score: number;
  domain: string | null;
  created_at: string;
}

export function useSharedInsights() {
  return useQuery({
    queryKey: ["shared-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_insights")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as SharedInsight[];
    },
  });
}

export function useIntelligenceMetrics() {
  return useQuery({
    queryKey: ["intelligence-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intelligence_metrics")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as IntelligenceMetric[];
    },
  });
}

export function useAgentLearnings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agent-learnings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_learnings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as AgentLearning[];
    },
    enabled: !!user,
  });
}

export function useAnalyzeIntelligence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-intelligence", {
        body: { action: "analyze_agents" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shared-insights"] });
      queryClient.invalidateQueries({ queryKey: ["intelligence-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["agent-learnings"] });
      toast.success(`Analysis complete: ${data.insights?.length || 0} patterns detected across ${data.agent_count || 0} agents`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Analysis failed");
    },
  });
}
