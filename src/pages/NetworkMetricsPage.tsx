import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Target, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntelligenceMetrics } from "@/hooks/useIntelligence";
import { useNetworkScale } from "@/hooks/useDecisions";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const NetworkMetricsPage = () => {
  const { data: metrics, isLoading: metricsLoading } = useIntelligenceMetrics();
  const { data: scaleData, isLoading: scaleLoading } = useNetworkScale();

  // Build time series from intelligence_metrics
  const chartData = useMemo(() => {
    if (!metrics) return [];
    const byDate: Record<string, Record<string, number>> = {};
    for (const m of metrics) {
      const day = new Date(m.recorded_at).toLocaleDateString();
      if (!byDate[day]) byDate[day] = {};
      byDate[day][m.metric_name] = m.metric_value;
    }
    return Object.entries(byDate)
      .map(([date, vals]) => ({ date, ...vals }))
      .reverse();
  }, [metrics]);

  // Latest scale snapshot
  const latestScale = scaleData?.[0];

  const kpiCards = [
    {
      label: "Accuracy Improvement",
      value: latestScale ? `${latestScale.avg_accuracy_improvement}%` : "—",
      icon: Target,
      color: "text-chart-2",
      trend: latestScale && latestScale.avg_accuracy_improvement > 0,
    },
    {
      label: "ROI Improvement",
      value: latestScale ? `${latestScale.avg_roi_improvement}%` : "—",
      icon: TrendingUp,
      color: "text-primary",
      trend: latestScale && latestScale.avg_roi_improvement > 0,
    },
    {
      label: "Error Reduction",
      value: latestScale ? `${latestScale.avg_error_reduction}%` : "—",
      icon: AlertTriangle,
      color: "text-accent",
      trend: latestScale && latestScale.avg_error_reduction > 0,
    },
    {
      label: "Total Decisions",
      value: latestScale ? latestScale.total_decisions.toLocaleString() : "0",
      icon: Zap,
      color: "text-chart-4",
      trend: true,
    },
  ];

  const isLoading = metricsLoading || scaleLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Network Metrics</h1>
        <p className="text-muted-foreground text-sm mt-1">Accuracy, ROI, and error reduction across the agent network</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <k.icon className={`w-5 h-5 ${k.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-2xl font-bold text-foreground">{k.value}</p>
                        {k.trend !== undefined && (
                          k.trend ? (
                            <TrendingUp className="w-4 h-4 text-chart-2" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prediction Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="prediction_accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                Run intelligence analysis to generate metrics
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Network Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="network_agents" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total_learnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                No metrics data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkMetricsPage;
