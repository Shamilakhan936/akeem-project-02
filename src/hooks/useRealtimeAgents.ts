import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeAgents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-agents")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        if (payload.eventType === "UPDATE") {
          const agent = payload.new as any;
          if (agent.status === "active") {
            toast.success(`${agent.name} is now active`);
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_events" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["agent-events"] });
        queryClient.invalidateQueries({ queryKey: ["recent-events"] });
        const evt = payload.new as any;
        if (evt.event_type === "cross_domain_transfer") {
          toast.info("Cross-domain learning transfer detected");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedback_events" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["feedback-events"] });
        const fb = payload.new as any;
        if (fb.stage === "propagation") {
          toast.success("Intelligence propagated across network");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shared_insights" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["shared-insights"] });
        queryClient.invalidateQueries({ queryKey: ["intelligence-metrics"] });
        toast.info("New shared insight discovered");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
