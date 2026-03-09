import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Play, Database, Zap, Brain, BarChart3, CheckCircle2,
  Loader2, ChevronRight, ChevronLeft, Rocket, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
  { id: "seed", title: "Seed Data", desc: "Generate realistic BNPL transactions with customers and knowledge graph.", icon: Database },
  { id: "score", title: "AI Scoring", desc: "Score all pending transactions with the intelligence-powered BNPL agent.", icon: Zap },
  { id: "outcomes", title: "Record Outcomes", desc: "Simulate real-world outcomes for reinforcement learning.", icon: CheckCircle2 },
  { id: "intelligence", title: "Build Intelligence", desc: "Generate behavioral embeddings, knowledge graph patterns, and shared insights.", icon: Brain },
  { id: "roi", title: "Measure ROI", desc: "Propagate learnings and see before/after network performance.", icon: BarChart3 },
];

interface StepResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export default function DemoWizard() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, StepResult>>({});

  const runStep = async (stepIndex: number) => {
    setRunning(true);
    try {
      const step = steps[stepIndex];
      let result: StepResult;

      if (step.id === "seed") {
        const { data, error } = await supabase.functions.invoke("seed-paylaterr", {
          body: { action: "seed_all", user_count: 15, txns_per_user: 5 },
        });
        if (error) throw error;
        result = {
          success: true,
          message: `Seeded ${data.transactions_created} transactions across ${data.customers} customers`,
          details: { transactions: data.transactions_created, customers: data.customers, graph_nodes: data.knowledge_graph?.nodes },
        };
      } else if (step.id === "score") {
        const { data, error } = await supabase.functions.invoke("score-paylaterr", {
          body: { action: "score_batch" },
        });
        if (error) throw error;
        result = {
          success: true,
          message: `Scored ${data.scored}/${data.total} transactions`,
          details: { scored: data.scored, total: data.total, errors: data.errors?.length || 0 },
        };
      } else if (step.id === "outcomes") {
        const { data: txns } = await supabase
          .from("transactions")
          .select("id, decision, risk_score")
          .not("metadata->bill_category", "is", null)
          .neq("decision", "pending")
          .is("outcome", null)
          .limit(50);

        let recorded = 0;
        for (const txn of txns || []) {
          const isFraud = (txn.risk_score ?? 0) > 70 ? Math.random() > 0.4 : Math.random() > 0.85;
          const outcome = isFraud ? "fraud" : "legitimate";
          await supabase.from("transactions").update({
            outcome, outcome_score: isFraud ? 0 : 1,
            outcome_at: new Date().toISOString(),
          }).eq("id", txn.id);
          recorded++;
        }
        result = {
          success: true,
          message: `Recorded ${recorded} outcomes for reinforcement learning`,
          details: { recorded },
        };
      } else if (step.id === "intelligence") {
        const { data, error } = await supabase.functions.invoke("paylaterr-intelligence", {
          body: { action: "build_intelligence" },
        });
        if (error) throw error;
        result = {
          success: true,
          message: `Built ${data.embeddings_stored} embeddings, ${data.graph_edges_created} graph patterns, ${data.insights_stored} insights`,
          details: data,
        };
      } else {
        const { error: propError } = await supabase.functions.invoke("network-intelligence", {
          body: { action: "propagate_learnings" },
        });
        if (propError) throw propError;

        const { data, error } = await supabase.functions.invoke("network-intelligence", {
          body: { action: "ab_performance" },
        });
        if (error) throw error;

        const accImprove = data?.improvement?.accuracy?.toFixed(1) ?? "0";
        const fprImprove = data?.improvement?.fpr?.toFixed(1) ?? "0";
        const totalTxns = data?.total_transactions ?? 0;

        result = {
          success: true,
          message: `ROI measured across ${totalTxns} transactions: accuracy ${Number(accImprove) >= 0 ? "+" : ""}${accImprove}%, FPR ${Number(fprImprove) >= 0 ? "+" : ""}${fprImprove}% reduction`,
          details: {
            before: data?.before,
            after: data?.after,
            improvement: data?.improvement,
            reinforcement_cycles: data?.reinforcement_cycles,
            total_agents: data?.total_agents,
          },
        };
      }

      setResults((prev) => ({ ...prev, [stepIndex]: result }));
      toast.success(result.message);

      if (stepIndex < steps.length - 1) {
        setTimeout(() => setCurrentStep(stepIndex + 1), 800);
      }
    } catch (e: any) {
      setResults((prev) => ({ ...prev, [stepIndex]: { success: false, message: e.message } }));
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const progress = (Object.keys(results).length / steps.length) * 100;
  const allDone = Object.keys(results).length === steps.length && Object.values(results).every((r) => r.success);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setCurrentStep(0); setResults({}); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Rocket className="w-4 h-4 mr-1" /> Run Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" /> End-to-End Demo
          </DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="h-2" />

        {/* Step indicators */}
        <div className="flex justify-between px-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => !running && setCurrentStep(i)}
              className={`flex flex-col items-center gap-1 transition-all ${
                i === currentStep ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                results[i]?.success ? "bg-green-500/10 border-green-500 text-green-500"
                : results[i] && !results[i].success ? "bg-destructive/10 border-destructive text-destructive"
                : i === currentStep ? "bg-primary/10 border-primary text-primary"
                : "bg-muted border-border text-muted-foreground"
              }`}>
                {results[i]?.success ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Current step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />; })()}
                  <div>
                    <h3 className="font-semibold text-foreground">{steps[currentStep].title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{steps[currentStep].desc}</p>
                  </div>
                </div>

                {results[currentStep] && (
                  <div className={`rounded-lg p-3 text-sm ${results[currentStep].success ? "bg-green-500/5 border border-green-500/20 text-green-600" : "bg-destructive/5 border border-destructive/20 text-destructive"}`}>
                    {results[currentStep].message}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentStep === 0 || running}
                    onClick={() => setCurrentStep((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>

                  <div className="flex gap-2">
                    {!results[currentStep] && (
                      <Button size="sm" disabled={running} onClick={() => runStep(currentStep)}>
                        {running ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {running ? "Running…" : "Run Step"}
                      </Button>
                    )}
                    {results[currentStep]?.success && currentStep < steps.length - 1 && (
                      <Button size="sm" variant="outline" onClick={() => setCurrentStep((p) => p + 1)}>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {allDone && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-foreground">Demo Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Explore PayLaterr, Network Effect, and Analytics to see the results.
            </p>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
