import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default thresholds (overridden by intelligence layer)
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_HIGH_RISK_THRESHOLD = 65;
const MAX_BATCH_SIZE = 20;

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateInput(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  const { action } = body;
  if (!action || typeof action !== "string") return { valid: false, error: "Missing or invalid 'action'" };
  if (!["score", "score_batch"].includes(action)) return { valid: false, error: `Unknown action '${action}'. Use 'score' or 'score_batch'.` };
  if (action === "score" && (!body.transaction_id || typeof body.transaction_id !== "string")) {
    return { valid: false, error: "Missing or invalid 'transaction_id' for score action" };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return jsonRes({ error: "AI not configured" }, 503);

    // Parse and validate input
    let body: any;
    try { body = await req.json(); } catch { return jsonRes({ error: "Invalid JSON body" }, 400); }

    const validation = validateInput(body);
    if (!validation.valid) return jsonRes({ error: validation.error }, 400);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonRes({ error: "Unauthorized" }, 401);

    const { transaction_id, action } = body;

    // ── Fetch dynamic thresholds from intelligence layer ──
    async function getIntelligenceThresholds() {
      try {
        const { data: metrics } = await userClient
          .from("intelligence_metrics")
          .select("metric_name, metric_value")
          .in("metric_name", ["bnpl_recommended_confidence", "bnpl_recommended_risk_threshold"])
          .order("recorded_at", { ascending: false })
          .limit(2);

        let confidence = DEFAULT_CONFIDENCE_THRESHOLD;
        let riskThreshold = DEFAULT_HIGH_RISK_THRESHOLD;
        for (const m of metrics || []) {
          if (m.metric_name === "bnpl_recommended_confidence") confidence = m.metric_value;
          if (m.metric_name === "bnpl_recommended_risk_threshold") riskThreshold = m.metric_value;
        }
        return { confidence, riskThreshold };
      } catch {
        return { confidence: DEFAULT_CONFIDENCE_THRESHOLD, riskThreshold: DEFAULT_HIGH_RISK_THRESHOLD };
      }
    }

    // ── Query shared intelligence context for scoring ──
    async function getIntelligenceContext(billCategory: string | null) {
      const [insightsRes, learningsRes, graphRes] = await Promise.all([
        userClient.from("shared_insights")
          .select("title, description, confidence, insight_type")
          .eq("status", "active")
          .order("confidence", { ascending: false })
          .limit(5),
        userClient.from("agent_learnings")
          .select("embedding_summary, confidence_score, learning_type")
          .eq("domain", "bnpl")
          .order("confidence_score", { ascending: false })
          .limit(5),
        billCategory
          ? userClient.from("knowledge_graph_nodes")
              .select("label, node_type, weight, properties")
              .eq("domain", "bnpl")
              .order("weight", { ascending: false })
              .limit(10)
          : Promise.resolve({ data: [] }),
      ]);

      return {
        insights: insightsRes.data || [],
        learnings: learningsRes.data || [],
        graphPatterns: graphRes.data || [],
      };
    }

    // ── Score a single BNPL transaction ──
    if (action === "score") {
      const { data: txn, error: txnErr } = await userClient
        .from("transactions")
        .select("*")
        .eq("id", transaction_id)
        .single();
      if (txnErr || !txn) return jsonRes({ error: "Transaction not found" }, 404);

      // Parallel fetch: history, intelligence context, thresholds
      const [historyRes, intelligence, thresholds] = await Promise.all([
        userClient.from("transactions")
          .select("amount, merchant_category, outcome, outcome_score, decision, risk_score, metadata")
          .eq("customer_id", txn.customer_id)
          .order("created_at", { ascending: false })
          .limit(30),
        getIntelligenceContext(txn.metadata?.bill_category || txn.merchant_category),
        getIntelligenceThresholds(),
      ]);

      const history = historyRes.data || [];

      const prompt = `You are an AI BNPL (Buy Now Pay Later) risk assessment engine for PayLaterr. Analyze this bill payment installment request.

DYNAMIC THRESHOLDS (from shared intelligence layer):
- Confidence threshold: ${thresholds.confidence} (flag for review if below)
- High-risk threshold: ${thresholds.riskThreshold} (flag as high risk if above)

Transaction to evaluate:
${JSON.stringify({
  amount: txn.amount,
  merchant: txn.merchant_name,
  bill_category: txn.metadata?.bill_category || txn.merchant_category,
  bill_name: txn.metadata?.bill_name,
  installments: txn.metadata?.installments,
  customer_credit_score: txn.metadata?.credit_score,
  customer_risk_profile: txn.metadata?.risk_profile,
})}

Customer payment history (${history.length} records):
${JSON.stringify(history.slice(0, 15).map(h => ({
  amount: h.amount,
  category: h.merchant_category,
  outcome: h.outcome,
  score: h.outcome_score,
  risk: h.risk_score,
})))}

SHARED INTELLIGENCE LAYER:
Network insights: ${JSON.stringify(intelligence.insights)}
Behavioral learnings: ${JSON.stringify(intelligence.learnings.map(l => l.embedding_summary))}
Knowledge graph patterns: ${JSON.stringify(intelligence.graphPatterns.map(g => ({ label: g.label, type: g.node_type, weight: g.weight })))}

Use these intelligence signals to calibrate your risk assessment. If network patterns indicate this bill category or customer profile has elevated risk, adjust accordingly.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert BNPL risk assessment AI for bill payments. Evaluate installment requests based on user payment history, bill category risk, and shared network intelligence. Use dynamic thresholds from the intelligence layer." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "evaluate_bnpl",
              description: "Evaluate a BNPL installment request",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100" },
                  decision: { type: "string", enum: ["approve", "reject", "review"] },
                  confidence: { type: "number", description: "Decision confidence 0-1" },
                  recommended_installments: { type: "number", description: "Recommended installments (2-12)" },
                  delinquency_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  early_alert: { type: "boolean" },
                  alert_message: { type: "string" },
                  risk_factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        description: { type: "string" },
                      },
                      required: ["factor", "severity", "description"],
                    },
                  },
                  reasoning: { type: "string" },
                  intelligence_used: { type: "array", items: { type: "string" }, description: "Which intelligence signals influenced the decision" },
                },
                required: ["risk_score", "decision", "confidence", "recommended_installments", "delinquency_risk", "early_alert", "risk_factors", "reasoning"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "evaluate_bnpl" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return jsonRes({ error: "Rate limit exceeded. Try again shortly." }, 429);
        if (status === 402) return jsonRes({ error: "AI credits exhausted." }, 402);
        const errText = await aiResponse.text();
        console.error("AI scoring failed:", status, errText);
        return jsonRes({ error: `AI scoring failed (${status})` }, 502);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return jsonRes({ error: "AI returned no score" }, 502);

      const result = JSON.parse(toolCall.function.arguments);

      // Update transaction with intelligence metadata
      await userClient.from("transactions").update({
        risk_score: result.risk_score,
        risk_factors: result.risk_factors,
        decision: result.decision,
        decision_confidence: result.confidence,
        decided_by: "ai_agent",
        decided_at: new Date().toISOString(),
        metadata: {
          ...txn.metadata,
          recommended_installments: result.recommended_installments,
          delinquency_risk: result.delinquency_risk,
          early_alert: result.early_alert,
          alert_message: result.alert_message,
          reasoning: result.reasoning,
          intelligence_used: result.intelligence_used || [],
          thresholds_applied: thresholds,
        },
      }).eq("id", transaction_id);

      // Log agent event + feedback
      if (txn.agent_id) {
        const eventPromises = [
          userClient.from("agent_events").insert({
            agent_id: txn.agent_id,
            user_id: user.id,
            event_type: "bnpl_decision",
            description: `BNPL ${result.decision}: ${txn.metadata?.bill_name || "bill"} $${txn.amount} (risk: ${result.risk_score}%, delinquency: ${result.delinquency_risk})`,
            metadata: { transaction_id, ...result, thresholds },
          }),
          userClient.from("feedback_events").insert({
            user_id: user.id,
            agent_id: txn.agent_id,
            stage: "action",
            action_taken: `${result.decision} BNPL for ${txn.metadata?.bill_name}: $${txn.amount} × ${result.recommended_installments} installments`,
            outcome_score: result.confidence,
            metadata: { transaction_id, delinquency_risk: result.delinquency_risk, early_alert: result.early_alert, intelligence_signals: intelligence.insights.length + intelligence.learnings.length },
          }),
        ];

        if (result.early_alert) {
          eventPromises.push(
            userClient.from("notifications").insert({
              user_id: user.id,
              agent_id: txn.agent_id,
              title: "⚠️ Early Delinquency Alert",
              message: result.alert_message || `High missed payment risk detected for ${txn.metadata?.bill_name}`,
              event_type: "delinquency_alert",
            })
          );
        }

        await Promise.all(eventPromises);
      }

      return jsonRes({ success: true, result, thresholds_used: thresholds });
    }

    // ── Batch score all pending BNPL transactions ──
    if (action === "score_batch") {
      const { data: pending } = await userClient
        .from("transactions")
        .select("id")
        .eq("decision", "pending")
        .limit(MAX_BATCH_SIZE);

      if (!pending?.length) return jsonRes({ scored: 0, message: "No pending BNPL transactions" });

      let scored = 0;
      const results: any[] = [];
      const errors: string[] = [];

      for (const txn of pending) {
        try {
          const innerResp = await fetch(req.url, {
            method: "POST",
            headers: { Authorization: authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({ transaction_id: txn.id, action: "score" }),
          });
          const body = await innerResp.json();
          if (innerResp.ok && body.success) {
            results.push(body.result);
            scored++;
          } else {
            errors.push(`${txn.id}: ${body.error || "Unknown error"}`);
          }
        } catch (e) {
          errors.push(`${txn.id}: ${e instanceof Error ? e.message : "Failed"}`);
        }
      }

      return jsonRes({ scored, total: pending.length, results, errors: errors.length ? errors : undefined });
    }

    return jsonRes({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("score-paylaterr error:", e);
    return jsonRes({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
