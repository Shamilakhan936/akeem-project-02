import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Webhook can be called with either:
    // 1. Authorization header (authenticated user)
    // 2. x-webhook-secret header (external system)
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = req.headers.get("x-webhook-secret");

    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error } = await userClient.auth.getUser();
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    } else if (webhookSecret) {
      // Validate webhook secret - stored as WEBHOOK_SECRET in secrets
      const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
      if (!expectedSecret || webhookSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // For external webhooks, we need a target user_id in the payload
    } else {
      return new Response(JSON.stringify({ error: "Missing authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event_type, payload } = body;

    if (!event_type || !payload) {
      return new Response(JSON.stringify({ error: "Missing event_type or payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For external webhooks, require user_id in payload
    const targetUserId = userId || payload.user_id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing user_id for external webhook" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = {};

    // ── agent_event: Log an agent event ──
    if (event_type === "agent_event") {
      const { agent_id, type, description, metadata } = payload;
      if (!agent_id || !type || !description) {
        return new Response(JSON.stringify({ error: "agent_event requires agent_id, type, description" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await adminClient.from("agent_events").insert({
        agent_id, user_id: targetUserId, event_type: type, description, metadata: metadata || {},
      }).select().single();
      if (error) throw error;
      results.agent_event = data;
    }

    // ── feedback: Log a feedback event ──
    else if (event_type === "feedback") {
      const { agent_id, stage, action_taken, outcome, outcome_score, reinforcement_delta, decision_template_id } = payload;
      if (!agent_id || !action_taken) {
        return new Response(JSON.stringify({ error: "feedback requires agent_id, action_taken" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await adminClient.from("feedback_events").insert({
        user_id: targetUserId, agent_id, stage: stage || "action", action_taken,
        outcome: outcome || null, outcome_score: outcome_score || null,
        reinforcement_delta: reinforcement_delta || 0,
        decision_template_id: decision_template_id || null,
      }).select().single();
      if (error) throw error;
      results.feedback_event = data;
    }

    // ── metric: Record an intelligence metric ──
    else if (event_type === "metric") {
      const { metric_name, metric_value } = payload;
      if (!metric_name || metric_value === undefined) {
        return new Response(JSON.stringify({ error: "metric requires metric_name, metric_value" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await adminClient.from("intelligence_metrics").insert({
        metric_name, metric_value, created_by: targetUserId,
      }).select().single();
      if (error) throw error;
      results.metric = data;
    }

    // ── agent_update: Update agent status/performance ──
    else if (event_type === "agent_update") {
      const { agent_id, status, performance_score, shared_learnings } = payload;
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "agent_update requires agent_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const updates: Record<string, any> = {};
      if (status) updates.status = status;
      if (performance_score !== undefined) updates.performance_score = performance_score;
      if (shared_learnings !== undefined) updates.shared_learnings = shared_learnings;

      const { data, error } = await adminClient.from("agents").update(updates).eq("id", agent_id).select().single();
      if (error) throw error;
      results.agent = data;

      // Create notification for significant changes
      if (status === "error" || (performance_score !== undefined && performance_score < 50)) {
        await adminClient.from("notifications").insert({
          user_id: targetUserId,
          title: status === "error" ? "Agent Error Detected" : "Performance Drop Alert",
          message: `Agent ${data.name} ${status === "error" ? "encountered an error" : `performance dropped to ${performance_score}%`}`,
          event_type: "alert",
          agent_id,
        });
      }
    }

    // ── batch: Process multiple events ──
    else if (event_type === "batch") {
      const { events } = payload;
      if (!Array.isArray(events)) {
        return new Response(JSON.stringify({ error: "batch requires events array" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      results.processed = events.length;
      results.errors = [];
      for (const evt of events) {
        try {
          const innerResp = await fetch(req.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
              ...(webhookSecret ? { "x-webhook-secret": webhookSecret } : {}),
            },
            body: JSON.stringify({ event_type: evt.event_type, payload: { ...evt.payload, user_id: targetUserId } }),
          });
          if (!innerResp.ok) results.errors.push({ event: evt.event_type, error: await innerResp.text() });
        } catch (e) {
          results.errors.push({ event: evt.event_type, error: String(e) });
        }
      }
    }

    else {
      return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
