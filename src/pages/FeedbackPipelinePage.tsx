import { motion } from "framer-motion";
import { ArrowRight, Activity, CheckCircle2, AlertCircle, Zap, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedbackEvents } from "@/hooks/useDecisions";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const stageConfig: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  action: { label: "Agent Action", icon: Zap, color: "text-primary bg-primary/10 border-primary/20" },
  outcome: { label: "Outcome", icon: CheckCircle2, color: "text-chart-2 bg-chart-2/10 border-chart-2/20" },
  reinforcement: { label: "Reinforcement", icon: Activity, color: "text-accent bg-accent/10 border-accent/20" },
  global_update: { label: "Global Update", icon: Radio, color: "text-chart-4 bg-chart-4/10 border-chart-4/20" },
  policy_refinement: { label: "Policy Refinement", icon: Activity, color: "text-chart-5 bg-chart-5/10 border-chart-5/20" },
  propagation: { label: "Propagation", icon: ArrowRight, color: "text-primary bg-primary/10 border-primary/20" },
};

const stages = ["action", "outcome", "reinforcement", "global_update", "policy_refinement", "propagation"];

const FeedbackPipelinePage = () => {
  const { data: events, isLoading } = useFeedbackEvents();
  const queryClient = useQueryClient();

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("feedback-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedback_events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["feedback-events"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Group events by stage for the pipeline visualization
  const stageCounts = stages.reduce((acc, s) => {
    acc[s] = events?.filter((e) => e.stage === s).length || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback Pipeline</h1>
        <p className="text-muted-foreground text-sm mt-1">Structured feedback loop: Action → Outcome → Reinforcement → Global Update → Propagation</p>
      </div>

      {/* Pipeline visualization */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-[700px]">
          {stages.map((stage, i) => {
            const cfg = stageConfig[stage];
            const Icon = cfg.icon;
            return (
              <div key={stage} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border ${cfg.color} min-w-[110px]`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold text-center">{cfg.label}</span>
                  <span className="text-lg font-bold">{stageCounts[stage]}</span>
                </motion.div>
                {i < stages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live pulse */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {events?.length || 0} total feedback events recorded
        </span>
      </div>

      {/* Event feed */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Events</h2>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl mb-2" />)
        ) : events?.length ? (
          <div className="space-y-2">
            {events.slice(0, 20).map((ev, i) => {
              const cfg = stageConfig[ev.stage] || stageConfig.action;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card>
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <div className={`p-1.5 rounded-md border shrink-0 ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{ev.action_taken}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                          {ev.outcome && <span className="text-[11px] text-muted-foreground truncate">{ev.outcome}</span>}
                          {ev.outcome_score != null && (
                            <span className="text-[11px] text-muted-foreground">Score: {ev.outcome_score}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No feedback events yet. Events are logged when agents make decisions.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FeedbackPipelinePage;
