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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI not configured");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { transaction_id, action } = await req.json();

    // ── Score a single transaction ──
    if (action === "score") {
      const { data: txn, error: txnErr } = await userClient
        .from("transactions")
        .select("*")
        .eq("id", transaction_id)
        .single();
      if (txnErr || !txn) throw new Error("Transaction not found");

      // Get historical patterns for context
      const { data: recentTxns } = await userClient
        .from("transactions")
        .select("amount, merchant_category, country, risk_score, decision, outcome")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: insights } = await userClient
        .from("shared_insights")
        .select("title, description, confidence, insight_type")
        .eq("status", "active")
        .limit(10);

      const prompt = `You are an AI fraud detection engine for e-commerce transactions. Analyze this transaction and assign a risk score.

Transaction to analyze:
${JSON.stringify({
  amount: txn.amount,
  currency: txn.currency,
  merchant_name: txn.merchant_name,
  merchant_category: txn.merchant_category,
  payment_method: txn.payment_method,
  country: txn.country,
  customer_id: txn.customer_id,
})}

Historical patterns (last 50 transactions):
${JSON.stringify(recentTxns?.slice(0, 20) || [])}

Network intelligence insights:
${JSON.stringify(insights || [])}

Score the transaction using the provided tool.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert fraud detection AI. Analyze transactions for fraud risk based on amount, merchant, location, payment method, and historical patterns." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_transaction",
              description: "Assign a fraud risk score and decision to the transaction",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100, higher = more risky" },
                  decision: { type: "string", enum: ["approve", "reject", "review"] },
                  confidence: { type: "number", description: "Decision confidence 0-1" },
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
                },
                required: ["risk_score", "decision", "confidence", "risk_factors"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_transaction" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI scoring failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error("AI returned no score");

      const result = JSON.parse(toolCall.function.arguments);

      // Update the transaction
      await userClient.from("transactions").update({
        risk_score: result.risk_score,
        risk_factors: result.risk_factors,
        decision: result.decision,
        decision_confidence: result.confidence,
        decided_by: "ai_agent",
        decided_at: new Date().toISOString(),
      }).eq("id", transaction_id);

      // Log the event
      if (txn.agent_id) {
        await userClient.from("agent_events").insert({
          agent_id: txn.agent_id,
          user_id: user.id,
          event_type: "decision_made",
          description: `Transaction ${txn.transaction_ref}: ${result.decision} (risk: ${result.risk_score}%, confidence: ${(result.confidence * 100).toFixed(0)}%)`,
          metadata: { transaction_id, risk_score: result.risk_score, decision: result.decision },
        });

        // Create feedback event
        await userClient.from("feedback_events").insert({
          user_id: user.id,
          agent_id: txn.agent_id,
          stage: "action",
          action_taken: `${result.decision} transaction ${txn.transaction_ref}`,
          outcome_score: result.confidence,
          metadata: { transaction_id, risk_factors: result.risk_factors },
        });
      }

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Batch score all pending transactions ──
    if (action === "score_batch") {
      const { data: pendingTxns } = await userClient
        .from("transactions")
        .select("id")
        .eq("decision", "pending")
        .limit(20);

      if (!pendingTxns?.length) {
        return new Response(JSON.stringify({ scored: 0, message: "No pending transactions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let scored = 0;
      for (const txn of pendingTxns) {
        try {
          const innerReq = new Request(req.url, {
            method: "POST",
            headers: req.headers,
            body: JSON.stringify({ transaction_id: txn.id, action: "score" }),
          });
          // Recursive scoring via direct logic would be complex, so just do inline
          scored++;
        } catch { /* continue */ }
      }

      // Simplified: score each with random AI-like scoring for batch
      const { data: recentTxns } = await userClient
        .from("transactions")
        .select("*")
        .eq("decision", "pending")
        .limit(20);

      const batchPrompt = `You are an AI fraud detection engine. Score these ${recentTxns?.length || 0} pending transactions and decide approve/reject/review for each.

Transactions:
${JSON.stringify(recentTxns?.map(t => ({
  id: t.id,
  ref: t.transaction_ref,
  amount: t.amount,
  merchant: t.merchant_name,
  category: t.merchant_category,
  country: t.country,
  payment: t.payment_method,
})) || [])}

Use the tool to return decisions for all transactions.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert fraud detection AI for e-commerce." },
            { role: "user", content: batchPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "batch_score",
              description: "Score multiple transactions at once",
              parameters: {
                type: "object",
                properties: {
                  decisions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        transaction_id: { type: "string" },
                        risk_score: { type: "number" },
                        decision: { type: "string", enum: ["approve", "reject", "review"] },
                        confidence: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["transaction_id", "risk_score", "decision", "confidence", "reason"],
                    },
                  },
                },
                required: ["decisions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "batch_score" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("Batch scoring failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let decisions: any[] = [];
      if (toolCall?.function?.arguments) {
        decisions = JSON.parse(toolCall.function.arguments).decisions || [];
      }

      for (const d of decisions) {
        await userClient.from("transactions").update({
          risk_score: d.risk_score,
          decision: d.decision,
          decision_confidence: d.confidence,
          decided_by: "ai_agent",
          decided_at: new Date().toISOString(),
          risk_factors: [{ factor: "batch_analysis", severity: d.risk_score > 70 ? "high" : d.risk_score > 40 ? "medium" : "low", description: d.reason }],
        }).eq("id", d.transaction_id);
      }

      return new Response(JSON.stringify({ scored: decisions.length, decisions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Record outcome ──
    if (action === "record_outcome") {
      const { outcome, outcome_score } = await req.json();
      const { data: txn } = await userClient.from("transactions").select("*").eq("id", transaction_id).single();
      if (!txn) throw new Error("Transaction not found");

      await userClient.from("transactions").update({
        outcome,
        outcome_score,
        outcome_at: new Date().toISOString(),
      }).eq("id", transaction_id);

      // Feed back into the reinforcement loop
      if (txn.agent_id) {
        const isCorrect = (txn.decision === "approve" && outcome === "legitimate") || 
                         (txn.decision === "reject" && outcome === "fraud");
        const delta = isCorrect ? 0.05 : -0.1;

        await userClient.from("feedback_events").insert({
          user_id: user.id,
          agent_id: txn.agent_id,
          stage: "outcome",
          action_taken: `Outcome recorded for ${txn.transaction_ref}: ${outcome}`,
          outcome,
          outcome_score,
          reinforcement_delta: delta,
        });

        // Update agent performance
        const { data: agent } = await userClient.from("agents").select("performance_score").eq("id", txn.agent_id).single();
        if (agent) {
          const newScore = Math.max(0, Math.min(100, (agent.performance_score || 50) + delta * 100));
          await userClient.from("agents").update({ performance_score: newScore }).eq("id", txn.agent_id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-transaction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
