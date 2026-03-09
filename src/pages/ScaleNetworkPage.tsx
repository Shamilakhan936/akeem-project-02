import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Globe, Building2, Bot, ArrowRight, TrendingUp, Network, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkScale } from "@/hooks/useDecisions";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const ScaleNetworkPage = () => {
  const { user } = useAuth();
  const { data: scaleData, isLoading: scaleLoading } = useNetworkScale();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name, domain, status, performance_score, shared_learnings");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: pilots = [] } = useQuery({
    queryKey: ["pilot-companies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pilot_companies").select("id, name, vertical, status, total_transactions, total_decisions, baseline_fraud_rate, current_fraud_rate");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["cross-domain-transfers-scale", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shared_insights")
        .select("*")
        .eq("insight_type", "cross_domain")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const latest = scaleData?.[0];

  // Vertical distribution from real agents
  const verticalDist = useMemo(() => {
    const map: Record<string, number> = {};
    agents.forEach((a) => {
      const d = a.domain || "General";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, agents: count }))
      .sort((a, b) => b.agents - a.agents);
  }, [agents]);

  const maxAgents = Math.max(...verticalDist.map((v) => v.agents), 1);

  // Scale history chart
  const scaleHistory = useMemo(() => {
    if (!scaleData || scaleData.length === 0) return [];
    return [...scaleData].reverse().map((s) => ({
      date: new Date(s.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      agents: s.total_agents,
      companies: s.total_companies,
      decisions: s.total_decisions,
      transfers: s.total_cross_domain_transfers,
    }));
  }, [scaleData]);

  // Performance by domain
  const domainPerf = useMemo(() => {
    const map: Record<string, { total: number; count: number; learnings: number }> = {};
    agents.forEach((a) => {
      const d = a.domain || "General";
      if (!map[d]) map[d] = { total: 0, count: 0, learnings: 0 };
      map[d].total += Number(a.performance_score || 0);
      map[d].count += 1;
      map[d].learnings += a.shared_learnings;
    });
    return Object.entries(map).map(([name, v]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "…" : name,
      "Avg Performance": Number((v.total / v.count).toFixed(1)),
      "Shared Learnings": v.learnings,
    }));
  }, [agents]);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const activePilots = pilots.filter((p) => p.status === "active").length;
  const totalDecisions = pilots.reduce((s, p) => s + (p.total_decisions || 0), 0);

  const networkStats = [
    { label: "Companies", value: pilots.length || latest?.total_companies || 0, icon: Building2 },
    { label: "Active Agents", value: activeAgents || latest?.total_agents || 0, icon: Bot },
    { label: "Cross-Domain Transfers", value: transfers.length || latest?.total_cross_domain_transfers || 0, icon: Zap },
    { label: "Verticals", value: verticalDist.length || latest?.verticals?.length || 0, icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scale & Network Effects</h1>
        <p className="text-muted-foreground text-sm mt-1">Cross-company and cross-industry intelligence compounding</p>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {networkStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                {scaleLoading ? <Skeleton className="h-12" /> : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Growth chart */}
      {scaleHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Network Growth Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={scaleHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="agents" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="decisions" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vertical distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Agent Distribution by Domain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {verticalDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Create agents with domains to see distribution.</p>
            ) : verticalDist.map((v, i) => (
              <motion.div key={v.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground font-medium capitalize">{v.name}</span>
                  <span className="text-muted-foreground">{v.agents} agent{v.agents !== 1 ? "s" : ""}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(v.agents / maxAgents) * 100}%` }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Domain performance comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-2" />
              Performance by Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {domainPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No agent performance data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={domainPerf}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Avg Performance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Shared Learnings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cross-Domain Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Cross-Domain Intelligence Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Run "Detect Cross-Domain Transfers" on the Network Effect page to discover transfer opportunities.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {transfers.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.source_domains?.map((d: string, j: number) => (
                      <span key={j} className="flex items-center gap-1">
                        {j > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                        <Badge variant="outline" className="text-[10px]">{d}</Badge>
                      </span>
                    ))}
                    <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px]">
                      {((t.confidence || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <h4 className="font-medium text-foreground text-sm">{t.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flywheel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-chart-2" />
            Network Effect Flywheel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {[
              { label: "More Agents", color: "text-primary" },
              { label: "Richer Patterns", color: "text-accent" },
              { label: "Better Decisions", color: "text-chart-2" },
              { label: "Higher ROI", color: "text-chart-4" },
              { label: "More Companies", color: "text-primary" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="px-4 py-3 rounded-lg border border-border bg-card text-center">
                  <span className={`text-sm font-medium ${step.color}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0 hidden md:block" />}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-chart-2/5 border border-chart-2/10">
              <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
              <span className="text-xs text-chart-2 font-medium">Compounding intelligence — every cycle strengthens the network</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScaleNetworkPage;
