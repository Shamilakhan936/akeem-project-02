import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateAction(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  if (!body.action || typeof body.action !== "string") return { valid: false, error: "Missing 'action'" };
  if (!["build_intelligence", "get_summary", "detect_anomalies"].includes(body.action)) {
    return { valid: false, error: `Unknown action '${body.action}'` };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "AI not configured" }, 503);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    const validation = validateAction(body);
    if (!validation.valid) return json({ error: validation.error }, 400);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { action } = body;

    // ── Build behavioral embeddings + knowledge graph + patterns ──
    if (action === "build_intelligence") {
      const { data: allTxns } = await userClient
        .from("transactions")
        .select("*")
        .not("metadata->bill_category", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!allTxns?.length) return json({ message: "No BNPL transactions found. Seed data first." });

      const scored = allTxns.filter((t: any) => t.decision !== "pending");
      const pending = allTxns.filter((t: any) => t.decision === "pending");

      // Aggregate per-customer repayment patterns
      const customerMap: Record<string, any[]> = {};
      for (const t of allTxns) {
        const cid = t.customer_id || "unknown";
        if (!customerMap[cid]) customerMap[cid] = [];
        customerMap[cid].push(t);
      }

      const customerProfiles = Object.entries(customerMap).map(([cid, txns]) => {
        const s = txns.filter((t: any) => t.decision !== "pending");
        const avgRisk = s.length ? s.reduce((a: number, t: any) => a + (t.risk_score ?? 0), 0) / s.length : 0;
        const approvalRate = s.length ? s.filter((t: any) => t.decision === "approve").length / s.length : 0;
        const categories = [...new Set(txns.map((t: any) => t.metadata?.bill_category || t.merchant_category))];
        const totalAmount = txns.reduce((a: number, t: any) => a + t.amount, 0);
        const earlyAlerts = s.filter((t: any) => t.metadata?.early_alert).length;
        return { customer_id: cid, txn_count: txns.length, avg_risk: avgRisk, approval_rate: approvalRate, categories, total_amount: totalAmount, early_alerts: earlyAlerts };
      });

      // Aggregate per-category risk signals
      const catMap: Record<string, { risks: number[]; amounts: number[]; decisions: string[] }> = {};
      for (const t of scored) {
        const cat = t.metadata?.bill_category || t.merchant_category || "unknown";
        if (!catMap[cat]) catMap[cat] = { risks: [], amounts: [], decisions: [] };
        catMap[cat].risks.push(t.risk_score ?? 0);
        catMap[cat].amounts.push(t.amount);
        catMap[cat].decisions.push(t.decision);
      }
      const categoryProfiles = Object.entries(catMap).map(([cat, d]) => ({
        category: cat,
        avg_risk: d.risks.reduce((a, b) => a + b, 0) / d.risks.length,
        avg_amount: d.amounts.reduce((a, b) => a + b, 0) / d.amounts.length,
        approval_rate: d.decisions.filter((x) => x === "approve").length / d.decisions.length,
        reject_rate: d.decisions.filter((x) => x === "reject").length / d.decisions.length,
        count: d.risks.length,
      }));

      const { data: agent } = await userClient.from("agents").select("id, name, domain").eq("domain", "bnpl").limit(1).maybeSingle();

      const prompt = `You are a BNPL intelligence analyst. Analyze this PayLaterr data to build the shared intelligence layer.

Customer repayment profiles (${customerProfiles.length} customers):
${JSON.stringify(customerProfiles.slice(0, 20))}

Bill category risk profiles:
${JSON.stringify(categoryProfiles)}

Transaction summary: ${scored.length} scored, ${pending.length} pending, total value $${allTxns.reduce((s: number, t: any) => s + t.amount, 0).toFixed(0)}

Generate:
1. Behavioral embeddings: summarize user repayment patterns, bill category risk, payment timing trends
2. Knowledge graph patterns: identify relationships (users → bills → merchants → outcomes → risk clusters)
3. Strategic insights for the shared intelligence layer
4. Dynamic threshold recommendations based on observed data`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a BNPL intelligence analyst building behavioral embeddings and knowledge graph patterns from payment data." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "build_intelligence_layer",
              description: "Build the shared intelligence layer",
              parameters: {
                type: "object",
                properties: {
                  behavioral_embeddings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        embedding_type: { type: "string", enum: ["repayment_pattern", "category_risk", "timing_trend", "risk_cluster"] },
                        summary: { type: "string" },
                        confidence: { type: "number" },
                        affected_categories: { type: "array", items: { type: "string" } },
                      },
                      required: ["embedding_type", "summary", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  knowledge_graph_patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern_name: { type: "string" },
                        source_type: { type: "string" },
                        target_type: { type: "string" },
                        relationship: { type: "string" },
                        description: { type: "string" },
                        strength: { type: "number" },
                      },
                      required: ["pattern_name", "source_type", "target_type", "relationship", "description", "strength"],
                      additionalProperties: false,
                    },
                  },
                  strategic_insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insight_type: { type: "string", enum: ["pattern", "anomaly", "strategy", "cross_domain"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        confidence: { type: "number" },
                        impact_score: { type: "number" },
                      },
                      required: ["insight_type", "title", "description", "confidence", "impact_score"],
                      additionalProperties: false,
                    },
                  },
                  threshold_recommendations: {
                    type: "object",
                    properties: {
                      confidence_threshold: { type: "number" },
                      high_risk_threshold: { type: "number" },
                      reasoning: { type: "string" },
                    },
                    required: ["confidence_threshold", "high_risk_threshold", "reasoning"],
                    additionalProperties: false,
                  },
                },
                required: ["behavioral_embeddings", "knowledge_graph_patterns", "strategic_insights", "threshold_recommendations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "build_intelligence_layer" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return json({ error: "Rate limit exceeded." }, 429);
        if (status === 402) return json({ error: "AI credits exhausted." }, 402);
        const errText = await aiResponse.text();
        console.error("AI failed:", status, errText);
        return json({ error: `AI failed (${status})` }, 502);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return json({ error: "AI returned no intelligence" }, 502);

      const result = JSON.parse(toolCall.function.arguments);

      // Store behavioral embeddings
      let embeddingsStored = 0;
      if (agent) {
        for (const emb of result.behavioral_embeddings || []) {
          await userClient.from("agent_learnings").insert({
            agent_id: agent.id, user_id: user.id,
            learning_type: emb.embedding_type,
            embedding_summary: emb.summary,
            confidence_score: emb.confidence,
            domain: "bnpl",
            metadata: { affected_categories: emb.affected_categories, generated_at: new Date().toISOString() },
          });
          embeddingsStored++;
        }
      }

      // Store knowledge graph patterns
      let graphNodesCreated = 0, graphEdgesCreated = 0;
      for (const pattern of result.knowledge_graph_patterns || []) {
        const { data: srcNode } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id, label: pattern.pattern_name, node_type: pattern.source_type,
          domain: "bnpl", weight: pattern.strength, properties: { relationship: pattern.relationship, description: pattern.description },
        }).select("id").single();
        const { data: tgtNode } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id, label: `${pattern.target_type}: ${pattern.pattern_name}`, node_type: pattern.target_type,
          domain: "bnpl", weight: pattern.strength, properties: { description: pattern.description },
        }).select("id").single();
        if (srcNode && tgtNode) {
          await userClient.from("knowledge_graph_edges").insert({
            user_id: user.id, source_node_id: srcNode.id, target_node_id: tgtNode.id,
            relationship_type: pattern.relationship, weight: pattern.strength, properties: { pattern_name: pattern.pattern_name },
          });
          graphEdgesCreated++;
        }
        graphNodesCreated += 2;
      }

      // Store strategic insights
      let insightsStored = 0;
      for (const insight of result.strategic_insights || []) {
        await adminClient.from("shared_insights").insert({
          insight_type: insight.insight_type, title: insight.title, description: insight.description,
          confidence: insight.confidence, impact_score: insight.impact_score,
          source_domains: ["bnpl"], source_agent_count: 1, created_by: user.id,
          metadata: { source: "paylaterr-intelligence", generated_at: new Date().toISOString() },
        });
        insightsStored++;
      }

      // Store threshold recommendations as metrics for the scoring agent to consume
      const now = new Date().toISOString();
      await adminClient.from("intelligence_metrics").insert([
        { metric_name: "bnpl_embeddings_generated", metric_value: embeddingsStored, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_graph_patterns", metric_value: graphEdgesCreated, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_insights_generated", metric_value: insightsStored, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_customers_profiled", metric_value: customerProfiles.length, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_transactions_analyzed", metric_value: allTxns.length, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_recommended_confidence", metric_value: result.threshold_recommendations.confidence_threshold, created_by: user.id, recorded_at: now },
        { metric_name: "bnpl_recommended_risk_threshold", metric_value: result.threshold_recommendations.high_risk_threshold, created_by: user.id, recorded_at: now },
      ]);

      return json({
        success: true,
        embeddings_stored: embeddingsStored,
        graph_nodes_created: graphNodesCreated,
        graph_edges_created: graphEdgesCreated,
        insights_stored: insightsStored,
        customers_profiled: customerProfiles.length,
        transactions_analyzed: allTxns.length,
        threshold_recommendations: result.threshold_recommendations,
        behavioral_embeddings: result.behavioral_embeddings,
        knowledge_graph_patterns: result.knowledge_graph_patterns,
        strategic_insights: result.strategic_insights,
      });
    }

    // ── Get intelligence summary ──
    if (action === "get_summary") {
      const [learningsRes, insightsRes, graphRes, metricsRes] = await Promise.all([
        userClient.from("agent_learnings").select("*").eq("domain", "bnpl").order("created_at", { ascending: false }).limit(30),
        userClient.from("shared_insights").select("*").contains("source_domains", ["bnpl"]).eq("status", "active").order("created_at", { ascending: false }).limit(20),
        userClient.from("knowledge_graph_nodes").select("id, node_type, label, domain, weight").eq("domain", "bnpl").limit(100),
        userClient.from("intelligence_metrics").select("*").like("metric_name", "bnpl_%").order("recorded_at", { ascending: false }).limit(20),
      ]);

      const nodeTypeCounts: Record<string, number> = {};
      for (const n of graphRes.data || []) {
        nodeTypeCounts[n.node_type] = (nodeTypeCounts[n.node_type] || 0) + 1;
      }

      return json({
        learnings: learningsRes.data || [],
        insights: insightsRes.data || [],
        graph_node_count: graphRes.data?.length || 0,
        graph_node_types: nodeTypeCounts,
        metrics: metricsRes.data || [],
      });
    }

    // ── Detect Anomalies (Real-Time Alerting) ──
    if (action === "detect_anomalies") {
      // Fetch recent scored transactions
      const { data: recentTxns } = await userClient
        .from("transactions")
        .select("*")
        .not("metadata->bill_category", "is", null)
        .neq("decision", "pending")
        .order("decided_at", { ascending: false })
        .limit(100);

      if (!recentTxns?.length) return json({ anomalies: [], message: "No scored transactions to analyze" });

      // Compute per-category stats for anomaly detection
      const catStats: Record<string, { risks: number[]; rejects: number; total: number; earlyAlerts: number; amounts: number[] }> = {};
      for (const t of recentTxns) {
        const cat = t.metadata?.bill_category || t.merchant_category || "unknown";
        if (!catStats[cat]) catStats[cat] = { risks: [], rejects: 0, total: 0, earlyAlerts: 0, amounts: [] };
        catStats[cat].risks.push(t.risk_score ?? 0);
        catStats[cat].amounts.push(t.amount);
        catStats[cat].total++;
        if (t.decision === "reject") catStats[cat].rejects++;
        if (t.metadata?.early_alert) catStats[cat].earlyAlerts++;
      }

      const anomalies: any[] = [];
      const { data: agent } = await userClient.from("agents").select("id").eq("domain", "bnpl").limit(1).maybeSingle();

      for (const [cat, stats] of Object.entries(catStats)) {
        const avgRisk = stats.risks.reduce((a, b) => a + b, 0) / stats.risks.length;
        const rejectRate = stats.rejects / stats.total;
        const alertRate = stats.earlyAlerts / stats.total;

        // Spike: reject rate > 40% or avg risk > 70 or alert rate > 30%
        if (rejectRate > 0.4 || avgRisk > 70 || alertRate > 0.3) {
          const severity = avgRisk > 80 || rejectRate > 0.6 ? "critical" : avgRisk > 70 || rejectRate > 0.4 ? "high" : "medium";
          const anomaly = {
            category: cat,
            severity,
            avg_risk: Math.round(avgRisk),
            reject_rate: Math.round(rejectRate * 100),
            alert_rate: Math.round(alertRate * 100),
            transaction_count: stats.total,
            message: `${cat}: avg risk ${avgRisk.toFixed(0)}%, reject rate ${(rejectRate * 100).toFixed(0)}%, alert rate ${(alertRate * 100).toFixed(0)}%`,
          };
          anomalies.push(anomaly);

          // Create notification for each anomaly
          if (agent) {
            await userClient.from("notifications").insert({
              user_id: user.id,
              agent_id: agent.id,
              title: `🚨 Anomaly: ${cat}`,
              message: anomaly.message,
              event_type: "anomaly_alert",
            });
          }
        }
      }

      // Check for repeat late payers (customers with 3+ early alerts)
      const customerAlerts: Record<string, number> = {};
      for (const t of recentTxns) {
        if (t.metadata?.early_alert && t.customer_id) {
          customerAlerts[t.customer_id] = (customerAlerts[t.customer_id] || 0) + 1;
        }
      }

      const repeatOffenders = Object.entries(customerAlerts)
        .filter(([, count]) => count >= 2)
        .map(([cid, count]) => ({ customer_id: cid, alert_count: count }));

      if (repeatOffenders.length > 0 && agent) {
        await userClient.from("notifications").insert({
          user_id: user.id,
          agent_id: agent.id,
          title: `⚠️ ${repeatOffenders.length} Repeat Late Payer(s)`,
          message: `${repeatOffenders.length} customers have multiple delinquency alerts. Review risk profiles.`,
          event_type: "repeat_offender_alert",
        });
      }

      return json({
        anomalies,
        repeat_offenders: repeatOffenders,
        categories_analyzed: Object.keys(catStats).length,
        transactions_analyzed: recentTxns.length,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("paylaterr-intelligence error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
