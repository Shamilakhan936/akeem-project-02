import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, Loader2, Sparkles,
  ChevronDown, ArrowUpDown, Database, Search, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

const decisionColors: Record<string, string> = {
  approve: "bg-green-500/10 text-green-600 border-green-500/20",
  reject: "bg-destructive/10 text-destructive border-destructive/20",
  review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  pending: "bg-muted text-muted-foreground border-border",
};

const riskColor = (score: number) => {
  if (score >= 70) return "text-destructive";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
};

const TransactionsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", user?.id, filter],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("decision", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = transactions.filter(t =>
    !search || t.transaction_ref?.toLowerCase().includes(search.toLowerCase()) ||
    t.merchant_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: transactions.length,
    approved: transactions.filter(t => t.decision === "approve").length,
    rejected: transactions.filter(t => t.decision === "reject").length,
    pending: transactions.filter(t => t.decision === "pending").length,
    review: transactions.filter(t => t.decision === "review").length,
    avgRisk: transactions.length ? (transactions.reduce((s, t) => s + (t.risk_score || 0), 0) / transactions.length).toFixed(1) : "0",
    totalVolume: transactions.reduce((s, t) => s + Number(t.amount || 0), 0),
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-demo-transactions", {
        body: { count: 30, include_knowledge_graph: true },
      });
      if (error) throw error;
      toast.success(`Generated ${data.transactions_created} transactions, ${data.knowledge_graph.nodes} graph nodes`);
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchScore = async () => {
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-transaction", {
        body: { action: "score_batch" },
      });
      if (error) throw error;
      toast.success(`Scored ${data.scored} transactions with AI`);
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      toast.error(e.message || "Scoring failed");
    } finally {
      setScoring(false);
    }
  };

  const handleScoreSingle = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("score-transaction", {
        body: { transaction_id: id, action: "score" },
      });
      if (error) throw error;
      toast.success(`Risk: ${data.result.risk_score}% → ${data.result.decision}`);
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      toast.error(e.message || "Scoring failed");
    }
  };

  const handleOverride = async (id: string, decision: string) => {
    const { error } = await supabase.from("transactions").update({
      decision,
      decided_by: "manual",
      decided_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Transaction ${decision}d manually`);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelected(null);
    }
  };

  const handleRecordOutcome = async (id: string, outcome: string) => {
    try {
      const { error } = await supabase.functions.invoke("score-transaction", {
        body: { transaction_id: id, action: "record_outcome", outcome, outcome_score: outcome === "legitimate" ? 1 : 0 },
      });
      if (error) throw error;
      toast.success(`Outcome recorded: ${outcome}`);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Processing</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered fraud detection & risk scoring</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            <Database className="w-4 h-4 mr-1" />{generating ? "Generating…" : "Generate Demo Data"}
          </Button>
          <Button size="sm" onClick={handleBatchScore} disabled={scoring || stats.pending === 0}>
            <Sparkles className="w-4 h-4 mr-1" />{scoring ? "Scoring…" : `AI Score (${stats.pending} pending)`}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Approved", value: stats.approved },
          { label: "Rejected", value: stats.rejected },
          { label: "Review", value: stats.review },
          { label: "Pending", value: stats.pending },
          { label: "Avg Risk", value: `${stats.avgRisk}%` },
          { label: "Volume", value: `$${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <div className="text-lg font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approve">Approved</SelectItem>
            <SelectItem value="reject">Rejected</SelectItem>
            <SelectItem value="review">Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <ShieldQuestion className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No transactions yet. Generate demo data to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Ref</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Merchant</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Risk</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Decision</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Country</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((txn) => (
                  <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-foreground">{txn.transaction_ref}</td>
                    <td className="p-3">
                      <div className="text-foreground">{txn.merchant_name}</div>
                      <div className="text-xs text-muted-foreground">{txn.merchant_category}</div>
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${riskColor(txn.risk_score || 0)}`}>{txn.risk_score || 0}%</span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={decisionColors[txn.decision] || decisionColors.pending}>
                        {txn.decision === "approve" && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {txn.decision === "reject" && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {txn.decision}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{txn.country}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}</td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(txn)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {txn.decision === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => handleScoreSingle(txn.id)}>
                            <Sparkles className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Transaction {selected?.transaction_ref}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Amount:</span> <span className="text-foreground font-medium">${Number(selected.amount).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">Currency:</span> <span className="text-foreground">{selected.currency}</span></div>
                <div><span className="text-muted-foreground">Merchant:</span> <span className="text-foreground">{selected.merchant_name}</span></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{selected.merchant_category}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{selected.customer_email}</span></div>
                <div><span className="text-muted-foreground">Payment:</span> <span className="text-foreground">{selected.payment_method}</span></div>
                <div><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{selected.country}</span></div>
                <div><span className="text-muted-foreground">IP:</span> <span className="text-foreground font-mono text-xs">{selected.ip_address}</span></div>
              </div>

              <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                  <span className={`font-bold ${riskColor(selected.risk_score || 0)}`}>{selected.risk_score || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Decision</span>
                  <Badge variant="outline" className={decisionColors[selected.decision]}>{selected.decision}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Decided By</span>
                  <span className="text-sm text-foreground">{selected.decided_by || "—"}</span>
                </div>
                {selected.decision_confidence > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="text-sm text-foreground">{(selected.decision_confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Risk Factors */}
              {selected.risk_factors && Array.isArray(selected.risk_factors) && selected.risk_factors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Risk Factors</h4>
                  {selected.risk_factors.map((rf: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{rf.factor}</span>
                        <Badge variant="outline" className="text-xs">{rf.severity}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{rf.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                {selected.decision === "pending" && (
                  <Button size="sm" onClick={() => handleScoreSingle(selected.id)}>
                    <Sparkles className="w-4 h-4 mr-1" />AI Score
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleOverride(selected.id, "approve")}>
                  <ShieldCheck className="w-4 h-4 mr-1" />Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOverride(selected.id, "reject")}>
                  <ShieldAlert className="w-4 h-4 mr-1" />Reject
                </Button>
                {!selected.outcome && selected.decision !== "pending" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleRecordOutcome(selected.id, "legitimate")}>
                      ✅ Legitimate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRecordOutcome(selected.id, "fraud")}>
                      🚨 Fraud
                    </Button>
                  </>
                )}
              </div>

              {selected.outcome && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <span className="text-sm text-muted-foreground">Outcome: </span>
                  <span className="text-sm font-medium text-foreground">{selected.outcome}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TransactionsPage;
