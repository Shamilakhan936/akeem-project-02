import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { Activity, Bot, TrendingUp, Zap, Download, BarChart3, Target, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
  "hsl(var(--secondary))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

const AnalyticsPage = () => {
  const { user } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["all-agent-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_events").select("*").order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["all-transactions-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions").select("amount, decision, risk_score, outcome, created_at, merchant_category, metadata, customer_id")
        .order("created_at", { ascending: true }).limit(1000);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["intelligence-metrics-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intelligence_metrics").select("*").order("recorded_at", { ascending: true }).limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Status distribution
  const statusData = ["active", "draft", "paused", "error"].map((s) => ({
    name: s, count: agents.filter((a) => a.status === s).length,
  })).filter((d) => d.count > 0);

  // Performance scores
  const performanceData = agents
    .filter((a) => a.performance_score !== null && a.name).slice(0, 10)
    .map((a) => ({ name: a.name.length > 12 ? a.name.slice(0, 12) + "…" : a.name, score: a.performance_score }));

  // Activity over last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 13 - i));
    return { date, label: format(date, "MMM d") };
  });
  const activityData = last14Days.map(({ date, label }) => {
    const dayEnd = new Date(date); dayEnd.setDate(dayEnd.getDate() + 1);
    const evtCount = events.filter((e) => { const t = new Date(e.created_at); return t >= date && t < dayEnd; }).length;
    const txnCount = transactions.filter((t) => { const d = new Date(t.created_at); return d >= date && d < dayEnd; }).length;
    return { name: label, events: evtCount, transactions: txnCount };
  });

  // Event type breakdown
  const eventTypes = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1; return acc;
  }, {});
  const eventTypeData = Object.entries(eventTypes).map(([name, count]) => ({ name, count }));

  // Transaction cohort analysis (by week)
  const cohortData = (() => {
    const weeks: Record<string, { total: number; approved: number; rejected: number; volume: number }> = {};
    for (const t of transactions) {
      const w = format(new Date(t.created_at), "MMM d");
      if (!weeks[w]) weeks[w] = { total: 0, approved: 0, rejected: 0, volume: 0 };
      weeks[w].total++;
      weeks[w].volume += t.amount;
      if (t.decision === "approve") weeks[w].approved++;
      if (t.decision === "reject") weeks[w].rejected++;
    }
    return Object.entries(weeks).slice(-14).map(([name, d]) => ({
      name, ...d, approvalRate: d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0,
    }));
  })();

  // Risk distribution histogram
  const riskHistogram = (() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));
    for (const t of transactions) {
      const idx = Math.min(9, Math.floor((t.risk_score ?? 0) / 10));
      buckets[idx].count++;
    }
    return buckets;
  })();

  // Intelligence metrics timeline
  const accuracyTimeline = metrics
    .filter((m) => m.metric_name === "network_accuracy")
    .map((m) => ({ date: format(new Date(m.recorded_at), "MMM d HH:mm"), value: Number(m.metric_value.toFixed(1)) }));

  // Summary stats
  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalLearnings = agents.reduce((s, a) => s + a.shared_learnings, 0);
  const avgPerf = agents.length ? (agents.reduce((s, a) => s + (a.performance_score ?? 0), 0) / agents.length).toFixed(1) : "0";
  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);

  const summaryStats = [
    { label: "Agents", value: agents.length, icon: Bot },
    { label: "Active", value: activeCount, icon: Activity },
    { label: "Events", value: events.length, icon: Zap },
    { label: "Avg Performance", value: `${avgPerf}%`, icon: TrendingUp },
    { label: "Transactions", value: transactions.length, icon: BarChart3 },
    { label: "Volume", value: `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Target },
  ];

  const exportCSV = () => {
    const headers = ["Date", "Amount", "Decision", "Risk Score", "Outcome", "Category", "Customer"];
    const rows = transactions.map((t) => [
      t.created_at, String(t.amount), t.decision, String(t.risk_score ?? ""),
      t.outcome ?? "", t.merchant_category ?? (t.metadata as any)?.bill_category ?? "", t.customer_id ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "synapse-analytics-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Advanced intelligence metrics & reporting</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={transactions.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-card p-4">
            <s.icon className="w-4 h-4 mb-2 text-muted-foreground" />
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="flex-wrap">
          <TabsTrigger value="trends">Time Series</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        {/* Time Series */}
        <TabsContent value="trends" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Activity & Transactions (14 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorEvts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTxns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#colorEvts)" strokeWidth={2} />
                    <Area type="monotone" dataKey="transactions" stroke="hsl(var(--accent))" fill="url(#colorTxns)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {eventTypeData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Event Type Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeData} layout="vertical">
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={120} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohorts" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Transaction Volume & Approval Rate</CardTitle></CardHeader>
            <CardContent>
              {cohortData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No transaction data yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="approved" stackId="a" fill="hsl(142 71% 45%)" radius={[0, 0, 0, 0]} name="Approved" />
                      <Bar dataKey="rejected" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Approval Rate Trend</CardTitle></CardHeader>
            <CardContent>
              {cohortData.length > 1 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="approvalRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} name="Approval %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Need more data for trend analysis.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Distribution */}
        <TabsContent value="risk" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Risk Score Distribution</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Score transactions to see distribution.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskHistogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {riskHistogram.map((_, i) => (
                          <Cell key={i} fill={i < 4 ? "hsl(142 71% 45%)" : i < 7 ? "hsl(48 96% 53%)" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Agent Status</CardTitle></CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No agents.</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Decision Outcomes</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const outcomeData = [
                    { name: "Correct", count: transactions.filter((t) => (t.decision === "approve" && t.outcome === "legitimate") || (t.decision === "reject" && t.outcome === "fraud")).length },
                    { name: "False +", count: transactions.filter((t) => t.decision === "reject" && t.outcome === "legitimate").length },
                    { name: "False -", count: transactions.filter((t) => t.decision === "approve" && t.outcome === "fraud").length },
                    { name: "No outcome", count: transactions.filter((t) => !t.outcome).length },
                  ].filter((d) => d.count > 0);
                  return outcomeData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={outcomeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                            {outcomeData.map((_, i) => <Cell key={i} fill={["hsl(142 71% 45%)", "hsl(var(--destructive))", "hsl(48 96% 53%)", "hsl(var(--muted-foreground))"][i]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-4">No outcomes recorded.</p>;
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Performance */}
        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Agent Performance Scores</CardTitle></CardHeader>
            <CardContent>
              {performanceData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No agent data.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intelligence Metrics */}
        <TabsContent value="intelligence" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Network Accuracy Over Time</CardTitle></CardHeader>
            <CardContent>
              {accuracyTimeline.length > 1 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accuracyTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Propagate learnings to see accuracy trends.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Intelligence Metrics Summary</CardTitle></CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No intelligence metrics yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Metric</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Latest Value</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Count</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(
                        metrics.reduce<Record<string, { latest: number; count: number }>>((acc, m) => {
                          if (!acc[m.metric_name]) acc[m.metric_name] = { latest: m.metric_value, count: 0 };
                          acc[m.metric_name].latest = m.metric_value;
                          acc[m.metric_name].count++;
                          return acc;
                        }, {})
                      ).map(([name, d]) => (
                        <tr key={name} className="border-b border-border/50">
                          <td className="p-2 text-foreground font-mono text-xs">{name}</td>
                          <td className="p-2 text-right text-foreground font-mono">{d.latest.toFixed(2)}</td>
                          <td className="p-2 text-right text-muted-foreground">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AnalyticsPage;
