import { motion } from "framer-motion";
import { Brain, Zap, TrendingUp, AlertTriangle, Network, Lightbulb, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSharedInsights, useIntelligenceMetrics, useAgentLearnings, useAnalyzeIntelligence } from "@/hooks/useIntelligence";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const insightIcons: Record<string, typeof Brain> = {
  pattern: Network,
  anomaly: AlertTriangle,
  strategy: Lightbulb,
  cross_domain: TrendingUp,
};

const insightColors: Record<string, string> = {
  pattern: "bg-primary/10 text-primary border-primary/20",
  anomaly: "bg-destructive/10 text-destructive border-destructive/20",
  strategy: "bg-accent/10 text-accent border-accent/20",
  cross_domain: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

const IntelligencePage = () => {
  const { data: insights, isLoading: insightsLoading } = useSharedInsights();
  const { data: metrics, isLoading: metricsLoading } = useIntelligenceMetrics();
  const { data: learnings, isLoading: learningsLoading } = useAgentLearnings();
  const analyze = useAnalyzeIntelligence();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("intelligence-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shared_insights" }, () => {
        queryClient.invalidateQueries({ queryKey: ["shared-insights"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "intelligence_metrics" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intelligence-metrics"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Aggregate latest metrics
  const latestMetrics = useMemo(() => {
    if (!metrics) return {};
    const map: Record<string, number> = {};
    for (const m of metrics) {
      if (!(m.metric_name in map)) map[m.metric_name] = m.metric_value;
    }
    return map;
  }, [metrics]);

  const statCards = [
    { label: "Network Agents", value: latestMetrics.network_agents ?? 0, icon: Brain, color: "text-primary" },
    { label: "Total Learnings", value: latestMetrics.total_learnings ?? 0, icon: Zap, color: "text-accent" },
    { label: "Prediction Accuracy", value: `${latestMetrics.prediction_accuracy ?? 0}%`, icon: TrendingUp, color: "text-chart-4" },
    { label: "Active Insights", value: insights?.length ?? 0, icon: Lightbulb, color: "text-chart-2" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shared Intelligence Layer</h1>
          <p className="text-muted-foreground text-sm mt-1">Cross-agent patterns, anomalies, and network-wide learning</p>
        </div>
        <Button
          onClick={() => analyze.mutate()}
          disabled={analyze.isPending}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${analyze.isPending ? "animate-spin" : ""}`} />
          {analyze.isPending ? "Analyzing…" : "Run Analysis"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                {metricsLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Insights feed — takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Network Insights
          </h2>
          {insightsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : insights?.length ? (
            insights.map((insight, i) => {
              const Icon = insightIcons[insight.insight_type] || Network;
              const colorClass = insightColors[insight.insight_type] || "bg-muted text-foreground border-border";
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="hover:border-primary/20 transition-colors">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg border ${colorClass} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground text-sm">{insight.title}</h3>
                            <Badge variant="outline" className="text-[10px]">
                              {insight.insight_type.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{insight.description}</p>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span>Confidence: <strong className="text-foreground">{Math.round(insight.confidence * 100)}%</strong></span>
                            <span>Impact: <strong className="text-foreground">{Math.round(insight.impact_score * 100)}%</strong></span>
                            {insight.source_domains?.length > 0 && (
                              <span>Domains: {insight.source_domains.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Network className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No insights yet. Run an analysis to detect cross-agent patterns.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent learnings sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            Recent Learnings
          </h2>
          {learningsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : learnings?.length ? (
            learnings.slice(0, 10).map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card>
                  <CardContent className="py-3 px-4">
                    <p className="text-xs text-foreground font-medium">{l.embedding_summary}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{l.learning_type}</Badge>
                      {l.domain && <span>{l.domain}</span>}
                      <span>{new Date(l.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">No learnings recorded yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
