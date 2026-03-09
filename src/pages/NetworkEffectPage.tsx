import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useABPerformance } from "@/hooks/usePayLaterr";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  TrendingUp, Loader2, Sparkles, BarChart3, ShieldCheck,
  ArrowRight, RefreshCw, Target, Zap, Building2, CheckCircle2,
  Users, Globe, Lock, Brain, GitBranch, AlertTriangle, Plus,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line,
} from "recharts";

const NetworkEffectPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [propagating, setPropagating] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  const { data: roi, isLoading: roiLoading } = useQuery({
    queryKey: ["network-roi", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("network-intelligence", { body: { action: "network_roi" } });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: comparison } = useQuery({
    queryKey: ["network-effect-comparison", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("network-intelligence", { body: { action: "network_effect_comparison" } });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ["cross-domain-transfers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shared_insights")
        .select("*").eq("insight_type", "cross_domain").eq("status", "active")
        .order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: abData, isLoading: abLoading } = useABPerformance();

  const handleOnboardPilots = async () => {
    setOnboarding(true);
    try {
      const { data, error } = await supabase.functions.invoke("network-intelligence", { body: { action: "onboard_pilots" } });
      if (error) throw error;
      toast.success(data.message || `Onboarded ${data.companies_created} pilots`);
      qc.invalidateQueries({ queryKey: ["network-roi"] });
      qc.invalidateQueries({ queryKey: ["network-effect-comparison"] });
      qc.invalidateQueries({ queryKey: ["ab-performance"] });
      qc.invalidateQueries({ queryKey: ["agents"] });
    } catch (e: any) { toast.error(e.message); } finally { setOnboarding(false); }
  };

  const handlePropagate = async () => {
    setPropagating(true);
    try {
      const { data, error } = await supabase.functions.invoke("network-intelligence", { body: { action: "propagate_learnings" } });
      if (error) throw error;
      toast.success(`Reinforcement complete: ${data.agents_updated} agents updated, accuracy: ${data.accuracy?.toFixed(1)}%`);
      qc.invalidateQueries({ queryKey: ["network-roi"] });
      qc.invalidateQueries({ queryKey: ["network-effect-comparison"] });
      qc.invalidateQueries({ queryKey: ["ab-performance"] });
    } catch (e: any) { toast.error(e.message); } finally { setPropagating(false); }
  };

  const handleDetectTransfers = async () => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("network-intelligence", { body: { action: "detect_transfers" } });
      if (error) throw error;
      toast.success(`Detected ${data.transfers?.length || 0} cross-domain transfer opportunities`);
      qc.invalidateQueries({ queryKey: ["cross-domain-transfers"] });
    } catch (e: any) { toast.error(e.message); } finally { setDetecting(false); }
  };

  const comparisons = comparison?.comparisons || [];
  const domains = roi?.domains || [];

  const chartData = comparisons.filter((c: any) => c.total_outcomes > 0).map((c: any) => ({
    name: c.agent_name?.substring(0, 14),
    "AI Accuracy": Number(c.ai_accuracy?.toFixed(1)) || 0,
    "Manual Baseline": Number(c.manual_accuracy?.toFixed(1)) || 0,
  }));

  const radarData = domains.map((d: any) => ({
    domain: d.domain?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).substring(0, 16),
    Accuracy: Math.round(d.accuracy),
    Learnings: Math.min(100, d.learnings * 5),
    Confidence: Math.round((d.avg_confidence || 0) * 100),
    Transactions: Math.min(100, d.transactions * 2),
  }));

  const kpis = [
    { label: "Structured decision logging", done: true },
    { label: "Baseline ML model deployed", done: true },
    { label: "Shared intelligence layer (embeddings + graph)", done: true },
    { label: "Privacy & compliance framework", done: true },
    { label: "Multi-company pilot onboarding", done: (roi?.total_companies || 0) > 1 },
    { label: "Cross-domain transfer detection", done: (transfers?.length || 0) > 0 },
    { label: "Network effect measurable", done: (roi?.total_agents || 0) > 2 && (roi?.cross_domain_insights || 0) > 0 },
    { label: "ROI demonstrated to attract pilots", done: (roi?.total_companies || 0) >= 3 },
    { label: "Closed-loop intelligence → scoring", done: true },
    { label: "Real-time anomaly alerting", done: true },
    { label: "A/B before/after performance tracking", done: !!abData?.total_transactions },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Network Effect</h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-company intelligence sharing, ROI proof, and cross-domain learning</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" disabled={onboarding} onClick={handleOnboardPilots}>
            <Plus className="w-4 h-4 mr-1" />{onboarding ? "Onboarding…" : "Onboard Pilots"}
          </Button>
          <Button variant="outline" size="sm" disabled={propagating} onClick={handlePropagate}>
            <RefreshCw className={`w-4 h-4 mr-1 ${propagating ? "animate-spin" : ""}`} />{propagating ? "Propagating…" : "Propagate Learnings"}
          </Button>
          <Button size="sm" disabled={detecting} onClick={handleDetectTransfers}>
            <Sparkles className="w-4 h-4 mr-1" />{detecting ? "Detecting…" : "Detect Transfers"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Companies", value: roi?.total_companies || 0, icon: Building2 },
          { label: "Agents", value: roi?.total_agents || 0, icon: Users },
          { label: "Domains", value: domains.length, icon: Globe },
          { label: "Transactions", value: roi?.total_transactions || 0, icon: BarChart3 },
          { label: "Shared Insights", value: roi?.total_insights || 0, icon: Brain },
          { label: "Cross-Domain", value: roi?.cross_domain_insights || 0, icon: Zap },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="rounded-xl border border-border bg-card p-4">
              <k.icon className="w-4 h-4 mb-2 text-primary" />
              <div className="text-xl font-bold text-foreground">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="ab">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ab">A/B Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI & Domains</TabsTrigger>
          <TabsTrigger value="comparison">AI vs Baseline</TabsTrigger>
          <TabsTrigger value="transfers">Cross-Domain</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="kpis">KPI Checklist</TabsTrigger>
        </TabsList>

        {/* A/B Performance Tab */}
        <TabsContent value="ab" className="mt-4 space-y-4">
          {abLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !abData?.total_transactions ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Score transactions and record outcomes to see before/after performance.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Before/After Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Accuracy Δ", value: abData.improvement?.accuracy, suffix: "%", positive: true },
                  { label: "False Positive Δ", value: abData.improvement?.fpr, suffix: "%", positive: true },
                  { label: "Risk Reduction", value: abData.improvement?.risk_reduction, suffix: " pts", positive: true },
                ].map((m) => {
                  const val = m.value ?? 0;
                  const isPositive = val > 0;
                  return (
                    <Card key={m.label}>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {isPositive ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
                          <span className={`text-2xl font-bold ${isPositive ? "text-green-500" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}{val.toFixed(1)}{m.suffix}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Side by side comparison */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base text-muted-foreground">Before (Early Decisions)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Accuracy</span><span className="font-mono font-bold text-foreground">{abData.before?.accuracy?.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">False Positive Rate</span><span className="font-mono font-bold text-foreground">{abData.before?.fpr?.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Avg Risk Score</span><span className="font-mono font-bold text-foreground">{abData.before?.avgRisk?.toFixed(1)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Decisions</span><span className="font-mono text-foreground">{abData.before?.count}</span></div>
                  </CardContent>
                </Card>
                <Card className="border-primary/30">
                  <CardHeader><CardTitle className="text-base text-primary">After (With Network Effect)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Accuracy</span><span className="font-mono font-bold text-green-500">{abData.after?.accuracy?.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">False Positive Rate</span><span className="font-mono font-bold text-green-500">{abData.after?.fpr?.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Avg Risk Score</span><span className="font-mono font-bold text-foreground">{abData.after?.avgRisk?.toFixed(1)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Decisions</span><span className="font-mono text-foreground">{abData.after?.count}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Accuracy timeline */}
              {abData.accuracy_timeline?.length > 1 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Network Accuracy Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={abData.accuracy_timeline.map((d: any) => ({ date: new Date(d.date).toLocaleDateString(), accuracy: Number(d.value.toFixed(1)) }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /><span className="text-sm text-foreground font-medium">Reinforcement Cycles:</span><span className="font-mono text-foreground">{abData.reinforcement_cycles || 0}</span></div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-sm text-foreground font-medium">Agents:</span><span className="font-mono text-foreground">{abData.total_agents || 0}</span></div>
                  <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><span className="text-sm text-foreground font-medium">Total Outcomes:</span><span className="font-mono text-foreground">{abData.total_transactions || 0}</span></div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ROI & Domain Performance */}
        <TabsContent value="roi" className="mt-4 space-y-4">
          {roiLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : domains.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No domain data yet. Onboard pilots to see network ROI.</p></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Per-Domain Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="text-left p-2 text-muted-foreground font-medium">Domain</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Agents</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Transactions</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Accuracy</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Learnings</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Confidence</th>
                      </tr></thead>
                      <tbody>
                        {domains.map((d: any) => (
                          <tr key={d.domain} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-2 font-medium text-foreground capitalize">{d.domain?.replace(/_/g, " ")}</td>
                            <td className="p-2 text-right text-foreground">{d.agents}</td>
                            <td className="p-2 text-right text-foreground">{d.transactions}</td>
                            <td className="p-2 text-right"><span className={d.accuracy >= 70 ? "text-green-500" : d.accuracy >= 50 ? "text-yellow-500" : "text-destructive"}>{d.accuracy.toFixed(1)}%</span></td>
                            <td className="p-2 text-right text-foreground">{d.learnings}</td>
                            <td className="p-2 text-right text-foreground">{((d.avg_confidence || 0) * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              {radarData.length >= 2 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Domain Capability Radar</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="domain" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Radar name="Accuracy" dataKey="Accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Radar name="Confidence" dataKey="Confidence" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {roi?.scale && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Network ROI Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="rounded-lg bg-muted/30 p-4 text-center"><div className="text-2xl font-bold text-foreground">+{roi.scale.avg_accuracy_improvement?.toFixed(1)}%</div><div className="text-xs text-muted-foreground mt-1">Accuracy Improvement</div></div>
                      <div className="rounded-lg bg-muted/30 p-4 text-center"><div className="text-2xl font-bold text-foreground">+{roi.scale.avg_roi_improvement?.toFixed(1)}%</div><div className="text-xs text-muted-foreground mt-1">ROI Improvement</div></div>
                      <div className="rounded-lg bg-muted/30 p-4 text-center"><div className="text-2xl font-bold text-foreground">-{roi.scale.avg_error_reduction?.toFixed(1)}%</div><div className="text-xs text-muted-foreground mt-1">Error Reduction</div></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* AI vs Baseline */}
        <TabsContent value="comparison" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">AI Agent vs. Manual Baseline</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Score transactions and record outcomes to see comparisons.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="AI Accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Manual Baseline" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          {comparisons.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Per-Agent Comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Agent</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Domain</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Outcomes</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">AI</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Manual</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Δ</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Learnings</th>
                    </tr></thead>
                    <tbody>
                      {comparisons.map((c: any) => (
                        <tr key={c.agent_id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-2 font-medium text-foreground">{c.agent_name}</td>
                          <td className="p-2 text-muted-foreground capitalize">{c.domain?.replace(/_/g, " ") || "—"}</td>
                          <td className="p-2 text-right text-foreground">{c.total_outcomes}</td>
                          <td className="p-2 text-right font-medium text-foreground">{c.ai_accuracy?.toFixed(1)}%</td>
                          <td className="p-2 text-right text-muted-foreground">{c.manual_accuracy?.toFixed(1)}%</td>
                          <td className="p-2 text-right"><span className={c.accuracy_improvement > 0 ? "text-green-500" : c.accuracy_improvement < 0 ? "text-destructive" : "text-muted-foreground"}>{c.accuracy_improvement > 0 ? "+" : ""}{c.accuracy_improvement?.toFixed(1)}%</span></td>
                          <td className="p-2 text-right text-foreground">{c.shared_learnings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cross-Domain */}
        <TabsContent value="transfers" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Cross-Domain Intelligence Transfers</CardTitle></CardHeader>
            <CardContent>
              {!transfers?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No transfers yet. Click "Detect Transfers" with agents across 2+ domains.</p>
              ) : (
                <div className="space-y-3">
                  {transfers.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.source_domains?.map((d: string, j: number) => (
                          <span key={j} className="flex items-center gap-1">
                            {j > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                            <Badge variant="outline" className="text-xs capitalize">{d.replace(/_/g, " ")}</Badge>
                          </span>
                        ))}
                        <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">{((t.confidence ?? 0) * 100).toFixed(0)}% confidence</Badge>
                      </div>
                      <h4 className="font-medium text-foreground text-sm">{t.title}</h4>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Privacy & Compliance Framework</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Row-Level Security (RLS)", desc: "All tables enforce user-scoped access. No cross-tenant data leakage.", status: "active", icon: ShieldCheck },
                { title: "Data Isolation", desc: "Each company's raw data stays isolated. Only aggregated patterns and anonymized embeddings are shared.", status: "active", icon: Lock },
                { title: "Behavioral Embeddings", desc: "Customer data is transformed into statistical patterns (avg risk, approval rates) — no PII in shared intelligence.", status: "active", icon: Brain },
                { title: "Input Validation", desc: "All edge functions validate request bodies, action types, and parameters before processing.", status: "active", icon: ShieldCheck },
                { title: "Consent-Based Sharing", desc: "Companies opt in to shared intelligence. Agents only query anonymized aggregate insights.", status: "active", icon: CheckCircle2 },
                { title: "Audit Trail", desc: "Every decision, scoring event, and feedback loop is logged with timestamps and agent attribution.", status: "active", icon: GitBranch },
                { title: "GDPR Data Minimization", desc: "Only decision outcomes and risk patterns are retained. Raw transaction data can be purged per policy.", status: "planned", icon: AlertTriangle },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <item.icon className={`w-5 h-5 shrink-0 mt-0.5 ${item.status === "active" ? "text-green-500" : "text-yellow-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                      <Badge variant="outline" className={`text-xs ${item.status === "active" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI Checklist */}
        <TabsContent value="kpis" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Agent Network KPI Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${kpi.done ? "text-green-500" : "text-muted-foreground/30"}`} />
                  <span className={`text-sm ${kpi.done ? "text-foreground" : "text-muted-foreground"}`}>{kpi.label}</span>
                  {kpi.done && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 ml-auto">Done</Badge>}
                </div>
              ))}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">{kpis.filter(k => k.done).length}/{kpis.length}</span>
                </div>
                <Progress value={(kpis.filter(k => k.done).length / kpis.length) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default NetworkEffectPage;
