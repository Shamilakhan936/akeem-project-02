import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Zap, AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp, BarChart3, Loader2, Play, PlayCircle, Shield, Filter, Brain, GitBranch, Sparkles, Network, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  usePayLaterrAgent,
  usePayLaterrTransactions,
  usePayLaterrStats,
  useScoreTransaction,
  useScoreBatch,
  usePayLaterrIntelligence,
  useBuildIntelligence,
  useDetectAnomalies,
  riskLevel,
  isHighRisk,
  isBelowConfidence,
  type BNPLTransaction,
} from "@/hooks/usePayLaterr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const riskColor: Record<string, string> = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-destructive",
};

const riskBg: Record<string, string> = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-destructive/10 text-destructive",
};

const decisionIcon: Record<string, React.ReactNode> = {
  approve: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  reject: <XCircle className="w-4 h-4 text-destructive" />,
  review: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

const barColors = ["#22c55e", "#eab308", "#f97316", "#ef4444"];

function RiskBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const level = riskLevel(s);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Progress value={s} className="h-2 flex-1" />
      <span className={`text-xs font-medium ${riskColor[level]}`}>{s}%</span>
    </div>
  );
}

function TransactionRow({ txn, onScore, scoring }: { txn: BNPLTransaction; onScore: (id: string) => void; scoring: boolean }) {
  const flagged = isHighRisk(txn) || isBelowConfidence(txn);
  const level = riskLevel(txn.risk_score);
  const intelligenceUsed = txn.metadata?.intelligence_used?.length || 0;
  return (
    <div className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${flagged ? "border-orange-500/40 bg-orange-500/5" : "border-border bg-card"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {decisionIcon[txn.decision] || decisionIcon.pending}
          <span className="font-medium text-foreground truncate">{txn.metadata?.bill_name || txn.merchant_name || "Bill"}</span>
          <Badge variant="outline" className="text-xs">{txn.metadata?.bill_category || txn.merchant_category}</Badge>
          {flagged && <Badge className={`text-xs ${riskBg[level]}`}><AlertTriangle className="w-3 h-3 mr-1" />Flagged</Badge>}
          {intelligenceUsed > 0 && <Badge variant="outline" className="text-xs bg-primary/10 text-primary"><Brain className="w-3 h-3 mr-1" />{intelligenceUsed} signals</Badge>}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>${txn.amount}</span>
          <span>{txn.metadata?.installments || "?"} installments</span>
          <span>{txn.customer_email}</span>
          {txn.metadata?.reasoning && <span className="truncate max-w-[200px]">{txn.metadata.reasoning}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <RiskBar score={txn.risk_score} />
        {txn.decision === "pending" ? (
          <Button size="sm" variant="outline" disabled={scoring} onClick={() => onScore(txn.id)}>
            {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            <span className="ml-1">Score</span>
          </Button>
        ) : (
          <span className={`text-xs font-semibold capitalize ${txn.decision === "approve" ? "text-green-500" : txn.decision === "reject" ? "text-destructive" : "text-yellow-500"}`}>
            {txn.decision}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PayLaterrPage() {
  const { data: agent } = usePayLaterrAgent();
  const { data: transactions = [], isLoading } = usePayLaterrTransactions();
  const stats = usePayLaterrStats(transactions);
  const scoreMutation = useScoreTransaction();
  const batchMutation = useScoreBatch();
  const { data: intelligence } = usePayLaterrIntelligence();
  const buildIntel = useBuildIntelligence();
  const detectAnomalies = useDetectAnomalies();
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "approved" | "rejected">("all");

  const filtered = transactions.filter((t) => {
    if (filter === "pending") return t.decision === "pending";
    if (filter === "flagged") return isHighRisk(t) || isBelowConfidence(t);
    if (filter === "approved") return t.decision === "approve";
    if (filter === "rejected") return t.decision === "reject";
    return true;
  });

  const chartData = stats.categoryBreakdown.map((c, i) => ({ ...c, fill: barColors[Math.min(i, barColors.length - 1)] }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PayLaterr Agent</h1>
            {agent && <Badge variant="outline" className="text-xs">{agent.status}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Intelligence-powered BNPL scoring with dynamic thresholds from shared intelligence layer</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button disabled={batchMutation.isPending || stats.pending.length === 0} onClick={() => batchMutation.mutate()}>
            {batchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
            Score All Pending ({stats.pending.length})
          </Button>
          <Button variant="outline" disabled={buildIntel.isPending || transactions.length === 0} onClick={() => buildIntel.mutate()}>
            {buildIntel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
            Build Intelligence
          </Button>
          <Button variant="outline" disabled={detectAnomalies.isPending || stats.scored.length === 0} onClick={() => detectAnomalies.mutate()}>
            {detectAnomalies.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
            Detect Anomalies
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: transactions.length, icon: BarChart3 },
          { label: "Pending", value: stats.pending.length, icon: Clock },
          { label: "Approved", value: stats.approved.length, icon: CheckCircle2, color: "text-green-500" },
          { label: "Rejected", value: stats.rejected.length, icon: XCircle, color: "text-destructive" },
          { label: "Flagged", value: stats.flagged.length, icon: AlertTriangle, color: "text-orange-500" },
          { label: "Avg Risk", value: `${stats.avgRisk.toFixed(0)}%`, icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className={`w-4 h-4 mb-2 ${(s as any).color || "text-muted-foreground"}`} />
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Anomaly results banner */}
      {detectAnomalies.data && (detectAnomalies.data.anomalies?.length > 0 || detectAnomalies.data.repeat_offenders?.length > 0) && (
        <div className="rounded-xl border border-orange-500/40 bg-orange-500/5 p-4 space-y-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Anomaly Alerts ({detectAnomalies.data.anomalies.length})
          </h3>
          <div className="space-y-1">
            {detectAnomalies.data.anomalies.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge className={riskBg[a.severity] || "bg-orange-500/10 text-orange-500"}>{a.severity}</Badge>
                <span className="text-foreground">{a.message}</span>
              </div>
            ))}
          </div>
          {detectAnomalies.data.repeat_offenders?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ {detectAnomalies.data.repeat_offenders.length} repeat late payer(s) identified across {detectAnomalies.data.categories_analyzed} categories.
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="intelligence"><Brain className="w-3 h-3 mr-1" />Intelligence</TabsTrigger>
          <TabsTrigger value="risk">Category Risk</TabsTrigger>
          <TabsTrigger value="model">Model Info</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "flagged", "approved", "rejected"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "flagged" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {f === "all" && <Filter className="w-3 h-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "flagged" && ` (${stats.flagged.length})`}
                {f === "pending" && ` (${stats.pending.length})`}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions found. Seed PayLaterr from the Dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} onScore={(id) => scoreMutation.mutate(id)} scoring={scoreMutation.isPending} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Behavioral Embeddings", value: intelligence?.learnings?.length ?? 0, icon: Brain },
              { label: "Shared Insights", value: intelligence?.insights?.length ?? 0, icon: Sparkles },
              { label: "Graph Nodes", value: intelligence?.graph_node_count ?? 0, icon: GitBranch },
              { label: "Latest Metrics", value: intelligence?.metrics?.length ?? 0, icon: Network },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <s.icon className="w-4 h-4 mb-2 text-primary" />
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {intelligence?.graph_node_types && Object.keys(intelligence.graph_node_types).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3">Knowledge Graph Structure</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(intelligence.graph_node_types).map(([type, count]) => (
                  <div key={type} className="rounded-lg bg-muted/30 px-4 py-2 flex items-center gap-2">
                    <GitBranch className="w-3 h-3 text-primary" />
                    <span className="text-sm font-medium text-foreground capitalize">{type.replace(/_/g, " ")}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Behavioral Embeddings</h3>
            {!intelligence?.learnings?.length ? (
              <p className="text-sm text-muted-foreground">No embeddings yet. Click "Build Intelligence" to generate them.</p>
            ) : (
              <div className="space-y-2">
                {intelligence.learnings.slice(0, 10).map((l: any) => (
                  <div key={l.id} className="rounded-lg border border-border p-3 flex items-start gap-3">
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">{l.learning_type?.replace(/_/g, " ")}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{l.embedding_summary}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Confidence: {((l.confidence_score ?? 0) * 100).toFixed(0)}%</span>
                        {l.metadata?.affected_categories && <span>Categories: {l.metadata.affected_categories.join(", ")}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Strategic Insights (Shared Intelligence Layer)</h3>
            {!intelligence?.insights?.length ? (
              <p className="text-sm text-muted-foreground">No shared insights yet. Build intelligence to discover patterns.</p>
            ) : (
              <div className="space-y-2">
                {intelligence.insights.slice(0, 8).map((ins: any) => (
                  <div key={ins.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-sm font-medium text-foreground">{ins.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{ins.insight_type}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">Impact: {((ins.impact_score ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ins.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {buildIntel.data?.threshold_recommendations && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Dynamic Threshold Recommendations
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-muted-foreground">Recommended confidence:</span>
                  <span className="ml-2 font-mono font-bold text-foreground">
                    ≥ {(buildIntel.data.threshold_recommendations.confidence_threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-muted-foreground">Recommended high-risk:</span>
                  <span className="ml-2 font-mono font-bold text-foreground">
                    ≥ {buildIntel.data.threshold_recommendations.high_risk_threshold}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{buildIntel.data.threshold_recommendations.reasoning}</p>
              <p className="text-xs text-primary/80">✓ These thresholds are now stored and will be used by the scoring agent for future decisions.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Average Risk by Bill Category</h3>
            {chartData.length === 0 ? (
              <p className="text-muted-foreground text-sm">Score some transactions to see category risk breakdown.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis type="category" dataKey="category" width={120} tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="avgRisk" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.avgRisk >= 65 ? "#ef4444" : entry.avgRisk >= 40 ? "#f97316" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="model" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="font-semibold text-foreground">Intelligence-Enhanced Model Architecture</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Inputs</h4>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>User payment history (last 30 records)</li>
                  <li>Bill category + merchant metadata</li>
                  <li>Requested installment count</li>
                  <li>Customer credit score & risk profile</li>
                  <li className="text-primary">Shared insights from intelligence layer</li>
                  <li className="text-primary">Behavioral learnings (BNPL domain)</li>
                  <li className="text-primary">Knowledge graph patterns</li>
                  <li className="text-primary">Dynamic thresholds from build cycle</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Outputs</h4>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Risk score (0–100)</li>
                  <li>Decision: approve / reject / review</li>
                  <li>Recommended installments</li>
                  <li>Delinquency risk level</li>
                  <li>Early alert trigger</li>
                  <li>Risk factor breakdown</li>
                  <li className="text-primary">Intelligence signals used</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-2 mt-4">
              <h4 className="font-medium text-foreground">Closed-Loop Flow</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {["Score Transaction", "→ Log Decision", "→ Record Outcome", "→ Build Intelligence", "→ Update Thresholds", "→ Detect Anomalies", "→ Score Next Transaction ↻"].map((step, i) => (
                  <span key={i} className={i === 0 || i === 6 ? "text-primary font-medium" : ""}>{step}</span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
