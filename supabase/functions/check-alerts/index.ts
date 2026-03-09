import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check all agents for performance issues
    const { data: agents } = await userClient.from("agents").select("*");
    if (!agents?.length) {
      return new Response(JSON.stringify({ alerts: [], message: "No agents" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alerts: any[] = [];

    for (const agent of agents) {
      // Performance drop alert
      if (agent.performance_score !== null && agent.performance_score < 50) {
        alerts.push({
          type: "performance_drop",
          agent_id: agent.id,
          agent_name: agent.name,
          value: agent.performance_score,
          message: `${agent.name} performance is critically low at ${agent.performance_score}%`,
        });
      }

      // Stale agent alert (no events in 7 days)
      const { data: recentEvents } = await userClient
        .from("agent_events")
        .select("id")
        .eq("agent_id", agent.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!recentEvents?.length && agent.status === "active") {
        alerts.push({
          type: "stale_agent",
          agent_id: agent.id,
          agent_name: agent.name,
          message: `${agent.name} has had no activity in 7 days`,
        });
      }

      // Error status alert
      if (agent.status === "error") {
        alerts.push({
          type: "agent_error",
          agent_id: agent.id,
          agent_name: agent.name,
          message: `${agent.name} is in error state`,
        });
      }
    }

    // Check for negative reinforcement trends
    const { data: recentFeedback } = await userClient
      .from("feedback_events")
      .select("reinforcement_delta, agent_id")
      .eq("stage", "reinforcement")
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentFeedback?.length) {
      const avgDelta = recentFeedback.reduce((s, f) => s + (f.reinforcement_delta || 0), 0) / recentFeedback.length;
      if (avgDelta < -0.05) {
        alerts.push({
          type: "negative_reinforcement",
          message: `Network reinforcement trend is negative (avg delta: ${avgDelta.toFixed(3)}). Review decision policies.`,
        });
      }
    }

    // Create notifications for new alerts
    for (const alert of alerts) {
      // Check if similar notification already exists (within 24h)
      const { data: existing } = await adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_type", "alert")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .ilike("title", `%${alert.agent_name || alert.type}%`)
        .limit(1);

      if (!existing?.length) {
        await adminClient.from("notifications").insert({
          user_id: user.id,
          title: alert.type === "performance_drop" ? "⚠️ Performance Drop"
            : alert.type === "stale_agent" ? "💤 Inactive Agent"
            : alert.type === "agent_error" ? "🚨 Agent Error"
            : "📉 Negative Trend",
          message: alert.message,
          event_type: "alert",
          agent_id: alert.agent_id || null,
        });
      }
    }

    return new Response(JSON.stringify({ alerts, count: alerts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
