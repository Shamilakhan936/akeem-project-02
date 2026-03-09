import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BNPLTransaction {
  id: string;
  amount: number;
  merchant_name: string | null;
  merchant_category: string | null;
  customer_id: string | null;
  customer_email: string | null;
  decision: string;
  decision_confidence: number | null;
  risk_score: number | null;
  risk_factors: any;
  metadata: any;
  created_at: string;
  decided_at: string | null;
  outcome: string | null;
  outcome_score: number | null;
}

const CONFIDENCE_THRESHOLD = 0.7;
const HIGH_RISK_THRESHOLD = 65;

export function riskLevel(score: number | null): "low" | "medium" | "high" | "critical" {
  if (score == null) return "low";
  if (score >= 80) return "critical";
  if (score >= HIGH_RISK_THRESHOLD) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function isHighRisk(txn: BNPLTransaction): boolean {
  return (txn.risk_score ?? 0) >= HIGH_RISK_THRESHOLD;
}

export function isBelowConfidence(txn: BNPLTransaction): boolean {
  return (txn.decision_confidence ?? 0) < CONFIDENCE_THRESHOLD;
}

export function usePayLaterrAgent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paylaterr-agent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("domain", "bnpl")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePayLaterrTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paylaterr-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .not("metadata->bill_category", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as BNPLTransaction[];
    },
    enabled: !!user,
  });
}

export function usePayLaterrStats(transactions: BNPLTransaction[]) {
  const pending = transactions.filter((t) => t.decision === "pending");
  const scored = transactions.filter((t) => t.decision !== "pending");
  const approved = scored.filter((t) => t.decision === "approve");
  const rejected = scored.filter((t) => t.decision === "reject");
  const flagged = scored.filter((t) => isHighRisk(t) || isBelowConfidence(t));
  const avgRisk = scored.length
    ? scored.reduce((s, t) => s + (t.risk_score ?? 0), 0) / scored.length
    : 0;
  const avgConfidence = scored.length
    ? scored.reduce((s, t) => s + (t.decision_confidence ?? 0), 0) / scored.length
    : 0;

  const categoryRisk: Record<string, { total: number; count: number }> = {};
  for (const t of scored) {
    const cat = t.metadata?.bill_category || t.merchant_category || "Unknown";
    if (!categoryRisk[cat]) categoryRisk[cat] = { total: 0, count: 0 };
    categoryRisk[cat].total += t.risk_score ?? 0;
    categoryRisk[cat].count++;
  }
  const categoryBreakdown = Object.entries(categoryRisk)
    .map(([cat, v]) => ({ category: cat, avgRisk: Math.round(v.total / v.count), count: v.count }))
    .sort((a, b) => b.avgRisk - a.avgRisk);

  return { pending, scored, approved, rejected, flagged, avgRisk, avgConfidence, categoryBreakdown };
}

export function useScoreTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction_id: string) => {
      const { data, error } = await supabase.functions.invoke("score-paylaterr", {
        body: { transaction_id, action: "score" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paylaterr-transactions"] });
      const r = data.result;
      const intel = data.thresholds_used ? ` (thresholds: ${(data.thresholds_used.confidence * 100).toFixed(0)}%/${data.thresholds_used.riskThreshold}%)` : "";
      const msg = `${r.decision}: risk ${r.risk_score}%, ${r.delinquency_risk} delinquency${intel}`;
      if (r.decision === "approve") toast.success(msg);
      else if (r.decision === "reject") toast.error(msg);
      else toast.warning(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useScoreBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("score-paylaterr", {
        body: { action: "score_batch" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paylaterr-transactions"] });
      const errMsg = data.errors?.length ? ` (${data.errors.length} errors)` : "";
      toast.success(`Scored ${data.scored}/${data.total} transactions${errMsg}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface IntelligenceSummary {
  learnings: any[];
  insights: any[];
  graph_node_count: number;
  graph_node_types: Record<string, number>;
  metrics: any[];
}

export function usePayLaterrIntelligence() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paylaterr-intelligence-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("paylaterr-intelligence", {
        body: { action: "get_summary" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as IntelligenceSummary;
    },
    enabled: !!user,
  });
}

export function useBuildIntelligence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("paylaterr-intelligence", {
        body: { action: "build_intelligence" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paylaterr-intelligence-summary"] });
      queryClient.invalidateQueries({ queryKey: ["paylaterr-transactions"] });
      toast.success(
        `Intelligence built: ${data.embeddings_stored} embeddings, ${data.graph_edges_created} graph patterns, ${data.insights_stored} insights`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDetectAnomalies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("paylaterr-intelligence", {
        body: { action: "detect_anomalies" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const count = data.anomalies?.length || 0;
      const offenders = data.repeat_offenders?.length || 0;
      if (count > 0) {
        toast.warning(`${count} anomaly alert(s) detected${offenders ? `, ${offenders} repeat late payer(s)` : ""}`);
      } else {
        toast.success("No anomalies detected — all categories within normal range.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useABPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ab-performance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("network-intelligence", {
        body: { action: "ab_performance" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!user,
  });
}
