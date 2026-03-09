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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { action } = await req.json();

    // ── Analyze Agents ──
    if (action === "analyze_agents") {
      const { data: agents } = await userClient.from("agents").select("id, name, domain, status, performance_score, shared_learnings");
      const { data: events } = await userClient.from("agent_events").select("agent_id, event_type, description, created_at").order("created_at", { ascending: false }).limit(50);

      if (!agents?.length) {
        return new Response(JSON.stringify({ insights: [], message: "No agents found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!lovableKey) throw new Error("AI not configured");

      const prompt = `You are an AI intelligence analyst for an agent network platform. Analyze these agents and their recent events to identify cross-agent patterns, anomalies, and strategic insights.

Agents: ${JSON.stringify(agents)}
Recent Events: ${JSON.stringify(events || [])}

Return insights using the tool provided.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a network intelligence analyst. Identify patterns across AI agents." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_insights",
                description: "Report discovered cross-agent intelligence insights",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          insight_type: { type: "string", enum: ["pattern", "anomaly", "strategy", "cross_domain"] },
                          title: { type: "string" },
                          description: { type: "string" },
                          source_domains: { type: "array", items: { type: "string" } },
                          confidence: { type: "number" },
                          impact_score: { type: "number" },
                        },
                        required: ["insight_type", "title", "description", "confidence", "impact_score"],
                      },
                    },
                  },
                  required: ["insights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_insights" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI analysis failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let insights: any[] = [];

      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      }

      for (const insight of insights) {
        await adminClient.from("shared_insights").insert({
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          source_domains: insight.source_domains || [],
          source_agent_count: agents.length,
          confidence: insight.confidence,
          impact_score: insight.impact_score,
          created_by: user.id,
        });
      }

      for (const agent of agents) {
        await userClient.from("agent_learnings").insert({
          agent_id: agent.id,
          user_id: user.id,
          learning_type: "behavioral",
          embedding_summary: `Analysis cycle: ${insights.length} patterns detected across ${agents.length} agents`,
          confidence_score: insights.length > 0 ? insights.reduce((s: number, i: any) => s + (i.confidence || 0), 0) / insights.length : 0,
          domain: agent.domain,
        });
      }

      const now = new Date().toISOString();
      await adminClient.from("intelligence_metrics").insert([
        { metric_name: "network_agents", metric_value: agents.length, created_by: user.id, recorded_at: now },
        { metric_name: "total_learnings", metric_value: insights.length, created_by: user.id, recorded_at: now },
        { metric_name: "prediction_accuracy", metric_value: Math.min(95, 70 + agents.length * 3), created_by: user.id, recorded_at: now },
      ]);

      return new Response(JSON.stringify({ insights, agent_count: agents.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Analyze Feedback Loop ──
    if (action === "analyze_feedback") {
      const { data: feedbackEvents } = await userClient.from("feedback_events").select("*").order("created_at", { ascending: false }).limit(100);
      const { data: templates } = await userClient.from("decision_templates").select("*");
      const { data: agents } = await userClient.from("agents").select("id, name, domain, performance_score");

      if (!feedbackEvents?.length) {
        return new Response(JSON.stringify({ analysis: null, message: "No feedback data yet" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!lovableKey) throw new Error("AI not configured");

      const prompt = `Analyze this agent feedback pipeline data. Identify which decision types perform best, which agents are improving fastest, and recommend reinforcement adjustments.

Feedback Events: ${JSON.stringify(feedbackEvents.slice(0, 50))}
Decision Templates: ${JSON.stringify(templates || [])}
Agents: ${JSON.stringify(agents || [])}

Use the tool to return structured recommendations.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a reinforcement learning analyst. Optimize agent feedback loops for maximum performance." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_feedback_analysis",
                description: "Return structured feedback loop analysis and recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    top_performing_decision_type: { type: "string" },
                    avg_outcome_score: { type: "number" },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          action: { type: "string" },
                          reason: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["action", "reason", "priority"],
                      },
                    },
                  },
                  required: ["summary", "recommendations"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_feedback_analysis" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("Feedback analysis failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let analysis = null;

      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      }

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Seed Demo Data ──
    if (action === "seed_demo") {
      // Create demo agents
      const domains = ["fraud_detection", "route_optimization", "inventory_management", "ad_budget_allocation", "customer_churn"];
      const agentNames = ["Sentinel Alpha", "RouteBot Pro", "StockPulse", "AdVantage AI", "RetainEngine"];
      const statuses = ["active", "active", "active", "training", "active"];

      const createdAgents: any[] = [];
      for (let i = 0; i < 5; i++) {
        const { data, error } = await userClient.from("agents").insert({
          user_id: user.id,
          name: agentNames[i],
          description: `AI agent specialized in ${domains[i].replace(/_/g, " ")}`,
          domain: domains[i],
          status: statuses[i],
          performance_score: 65 + Math.random() * 30,
          shared_learnings: Math.floor(Math.random() * 150),
        }).select().single();
        if (!error && data) createdAgents.push(data);
      }

      // Create decision templates
      const decisionTypes = [
        { type: "fraud_approval", name: "Fraud Approval/Rejection", metrics: [{ name: "false_positive_rate", target: 2, unit: "%" }, { name: "detection_accuracy", target: 98, unit: "%" }] },
        { type: "route_optimization", name: "Route Optimization", metrics: [{ name: "delivery_time_reduction", target: 15, unit: "%" }, { name: "fuel_savings", target: 12, unit: "%" }] },
        { type: "inventory_restock", name: "Inventory Restock", metrics: [{ name: "stockout_reduction", target: 90, unit: "%" }, { name: "overstock_reduction", target: 25, unit: "%" }] },
        { type: "ad_budget", name: "Ad Budget Allocation", metrics: [{ name: "roas_improvement", target: 35, unit: "%" }, { name: "cpa_reduction", target: 20, unit: "%" }] },
      ];

      for (let i = 0; i < decisionTypes.length; i++) {
        await userClient.from("decision_templates").insert({
          user_id: user.id,
          decision_type: decisionTypes[i].type,
          name: decisionTypes[i].name,
          description: `Automated ${decisionTypes[i].name.toLowerCase()} decisions`,
          agent_id: createdAgents[i]?.id || null,
          metrics: decisionTypes[i].metrics as any,
        });
      }

      // Create feedback events across stages
      const stages = ["action", "outcome", "reinforcement", "global_update", "policy_refinement", "propagation"];
      for (const agent of createdAgents) {
        for (const stage of stages) {
          await userClient.from("feedback_events").insert({
            user_id: user.id,
            agent_id: agent.id,
            stage,
            action_taken: `${stage} executed for ${agent.name}`,
            outcome: stage === "outcome" ? "positive" : null,
            outcome_score: stage === "outcome" ? 0.7 + Math.random() * 0.3 : null,
            reinforcement_delta: stage === "reinforcement" ? (Math.random() * 0.2 - 0.05) : 0,
          });
        }
      }

      // Create agent events
      const eventTypes = ["status_change", "learning_shared", "decision_made", "performance_update", "cross_domain_transfer"];
      for (const agent of createdAgents) {
        for (let j = 0; j < 4; j++) {
          const et = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          await userClient.from("agent_events").insert({
            agent_id: agent.id,
            user_id: user.id,
            event_type: et,
            description: `${agent.name}: ${et.replace(/_/g, " ")} event recorded`,
          });
        }
      }

      // Create network scale snapshots
      for (let d = 0; d < 14; d++) {
        const date = new Date();
        date.setDate(date.getDate() - (13 - d));
        await adminClient.from("network_scale").insert({
          total_companies: 3 + d,
          total_agents: 10 + d * 5,
          total_decisions: 500 + d * 200,
          total_cross_domain_transfers: 5 + d * 3,
          verticals: ["fintech", "logistics", "retail", "adtech"].slice(0, Math.min(4, 2 + Math.floor(d / 4))),
          avg_accuracy_improvement: 12 + d * 1.5,
          avg_roi_improvement: 8 + d * 2,
          avg_error_reduction: 15 + d * 1.2,
          created_by: user.id,
          recorded_at: date.toISOString(),
        });
      }

      // Create intelligence metrics
      const metricNames = ["prediction_accuracy", "network_agents", "cross_domain_transfers", "total_learnings"];
      for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - d));
        for (const mn of metricNames) {
          await adminClient.from("intelligence_metrics").insert({
            metric_name: mn,
            metric_value: mn === "prediction_accuracy" ? 75 + d * 3 : 10 + d * 8,
            created_by: user.id,
            recorded_at: date.toISOString(),
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        seeded: { agents: createdAgents.length, decision_templates: decisionTypes.length, feedback_stages: stages.length * createdAgents.length }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
