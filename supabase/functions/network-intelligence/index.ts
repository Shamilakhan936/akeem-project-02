import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateInput(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  if (!body.action || typeof body.action !== "string") return { valid: false, error: "Missing 'action'" };
  const validActions = ["propagate_learnings", "detect_transfers", "network_effect_comparison", "onboard_pilots", "network_roi", "ab_performance"];
  if (!validActions.includes(body.action)) return { valid: false, error: `Unknown action '${body.action}'` };
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return jsonRes({ error: "AI not configured" }, 503);

    let body: any;
    try { body = await req.json(); } catch { return jsonRes({ error: "Invalid JSON body" }, 400); }
    const validation = validateInput(body);
    if (!validation.valid) return jsonRes({ error: validation.error }, 400);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonRes({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { action } = body;

    // ── Propagate Reinforcement Learning ──
    if (action === "propagate_learnings") {
      const [outcomesRes, agentsRes] = await Promise.all([
        userClient.from("transactions").select("*").not("outcome", "is", null).order("outcome_at", { ascending: false }).limit(50),
        userClient.from("agents").select("*"),
      ]);

      const recentOutcomes = outcomesRes.data;
      const agents = agentsRes.data;
      if (!agents?.length) return jsonRes({ message: "No agents" });

      const totalDecided = recentOutcomes?.length || 0;
      const correctDecisions = recentOutcomes?.filter(t =>
        (t.decision === "approve" && t.outcome === "legitimate") ||
        (t.decision === "reject" && t.outcome === "fraud")
      ).length || 0;
      const accuracy = totalDecided > 0 ? (correctDecisions / totalDecided) * 100 : 0;
      const falsePositives = recentOutcomes?.filter(t => t.decision === "reject" && t.outcome === "legitimate").length || 0;
      const fpRate = totalDecided > 0 ? (falsePositives / totalDecided) * 100 : 0;

      const updates: any[] = [];
      for (const agent of agents) {
        const agentTxns = recentOutcomes?.filter(t => t.agent_id === agent.id) || [];
        const agentCorrect = agentTxns.filter(t =>
          (t.decision === "approve" && t.outcome === "legitimate") ||
          (t.decision === "reject" && t.outcome === "fraud")
        ).length;
        const agentAccuracy = agentTxns.length > 0 ? (agentCorrect / agentTxns.length) * 100 : agent.performance_score || 50;
        const networkBoost = accuracy > agentAccuracy ? (accuracy - agentAccuracy) * 0.3 : 0;
        const newScore = Math.min(100, agentAccuracy + networkBoost);

        await Promise.all([
          userClient.from("agents").update({
            performance_score: newScore,
            shared_learnings: (agent.shared_learnings || 0) + 1,
          }).eq("id", agent.id),
          userClient.from("feedback_events").insert({
            user_id: user.id, agent_id: agent.id, stage: "global_update",
            action_taken: `Network reinforcement: accuracy ${agentAccuracy.toFixed(1)}% → ${newScore.toFixed(1)}% (network boost: +${networkBoost.toFixed(1)}%)`,
            outcome_score: newScore / 100, reinforcement_delta: networkBoost / 100,
          }),
          userClient.from("agent_learnings").insert({
            agent_id: agent.id, user_id: user.id, learning_type: "reinforcement",
            embedding_summary: `Policy refinement cycle: network accuracy ${accuracy.toFixed(1)}%, agent accuracy ${agentAccuracy.toFixed(1)}%, boost ${networkBoost.toFixed(1)}%`,
            confidence_score: newScore / 100, domain: agent.domain,
          }),
        ]);

        updates.push({ agent_id: agent.id, name: agent.name, old_score: agent.performance_score, new_score: newScore, boost: networkBoost });
      }

      const now = new Date().toISOString();
      await adminClient.from("intelligence_metrics").insert([
        { metric_name: "network_accuracy", metric_value: accuracy, created_by: user.id, recorded_at: now },
        { metric_name: "false_positive_rate", metric_value: fpRate, created_by: user.id, recorded_at: now },
        { metric_name: "reinforcement_cycles", metric_value: 1, created_by: user.id, recorded_at: now },
      ]);

      return jsonRes({ success: true, accuracy, fp_rate: fpRate, agents_updated: updates.length, updates });
    }

    // ── Cross-Domain Transfer Detection ──
    if (action === "detect_transfers") {
      const [learningsRes, agentsRes, insightsRes] = await Promise.all([
        userClient.from("agent_learnings").select("*").order("created_at", { ascending: false }).limit(100),
        userClient.from("agents").select("*"),
        userClient.from("shared_insights").select("*").eq("status", "active").limit(20),
      ]);

      const agents = agentsRes.data;
      if (!agents?.length || agents.length < 2) return jsonRes({ transfers: [], message: "Need at least 2 agents" });

      const domains = [...new Set(agents.map(a => a.domain).filter(Boolean))];
      if (domains.length < 2) return jsonRes({ transfers: [], message: "Need agents in at least 2 domains" });

      const prompt = `You are a cross-domain intelligence transfer analyst. Analyze these agents across different domains and identify transferable patterns.

Agents: ${JSON.stringify(agents.map(a => ({ name: a.name, domain: a.domain, performance: a.performance_score, learnings: a.shared_learnings })))}
Recent learnings: ${JSON.stringify(learningsRes.data?.slice(0, 30).map(l => ({ domain: l.domain, type: l.learning_type, summary: l.embedding_summary, confidence: l.confidence_score })) || [])}
Existing insights: ${JSON.stringify(insightsRes.data?.map(i => ({ type: i.insight_type, title: i.title, domains: i.source_domains })) || [])}
Domains: ${domains.join(", ")}

Identify patterns from one domain that could benefit another.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a cross-domain intelligence transfer specialist." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_transfers",
              description: "Report cross-domain intelligence transfers",
              parameters: {
                type: "object",
                properties: {
                  transfers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_domain: { type: "string" },
                        target_domain: { type: "string" },
                        pattern_name: { type: "string" },
                        description: { type: "string" },
                        confidence: { type: "number" },
                        estimated_impact: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["source_domain", "target_domain", "pattern_name", "description", "confidence", "estimated_impact", "recommendation"],
                    },
                  },
                },
                required: ["transfers"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_transfers" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return jsonRes({ error: "Rate limit exceeded." }, 429);
        if (status === 402) return jsonRes({ error: "AI credits exhausted." }, 402);
        const errText = await aiResponse.text();
        console.error("Transfer detection failed:", status, errText);
        return jsonRes({ error: "Transfer detection failed" }, 502);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let transfers: any[] = [];
      if (toolCall?.function?.arguments) {
        transfers = JSON.parse(toolCall.function.arguments).transfers || [];
      }

      for (const t of transfers) {
        await adminClient.from("shared_insights").insert({
          insight_type: "cross_domain", title: t.pattern_name,
          description: `${t.description}\n\nRecommendation: ${t.recommendation}`,
          source_domains: [t.source_domain, t.target_domain],
          source_agent_count: agents.length, confidence: t.confidence,
          impact_score: t.confidence * 0.8, created_by: user.id,
        });
      }

      return jsonRes({ transfers, stored: transfers.length });
    }

    // ── Network Effect Comparison ──
    if (action === "network_effect_comparison") {
      const [txnRes, agentRes] = await Promise.all([
        userClient.from("transactions").select("agent_id, decision, outcome, risk_score, created_at, decided_by").not("outcome", "is", null),
        userClient.from("agents").select("id, name, domain, performance_score, shared_learnings, created_at"),
      ]);

      const transactions = txnRes.data;
      const agents = agentRes.data;
      if (!transactions?.length || !agents?.length) return jsonRes({ comparisons: [], message: "Need transaction outcomes" });

      const calcAccuracy = (txns: any[]) => {
        if (!txns.length) return 0;
        return (txns.filter(t => (t.decision === "approve" && t.outcome === "legitimate") || (t.decision === "reject" && t.outcome === "fraud")).length / txns.length) * 100;
      };
      const calcFPR = (txns: any[]) => {
        if (!txns.length) return 0;
        return (txns.filter(t => t.decision === "reject" && t.outcome === "legitimate").length / txns.length) * 100;
      };

      const comparisons = agents.map(agent => {
        const agentTxns = transactions.filter(t => t.agent_id === agent.id);
        const aiDecided = agentTxns.filter(t => t.decided_by === "ai_agent");
        const manualDecided = agentTxns.filter(t => t.decided_by === "manual");
        return {
          agent_id: agent.id, agent_name: agent.name, domain: agent.domain,
          total_outcomes: agentTxns.length, ai_decisions: aiDecided.length, manual_decisions: manualDecided.length,
          ai_accuracy: calcAccuracy(aiDecided), manual_accuracy: calcAccuracy(manualDecided), overall_accuracy: calcAccuracy(agentTxns),
          ai_fpr: calcFPR(aiDecided), manual_fpr: calcFPR(manualDecided),
          network_performance: agent.performance_score, shared_learnings: agent.shared_learnings,
          accuracy_improvement: calcAccuracy(aiDecided) - calcAccuracy(manualDecided),
          fpr_improvement: calcFPR(manualDecided) - calcFPR(aiDecided),
        };
      });

      return jsonRes({ comparisons });
    }

    // ── A/B Performance (before/after network effect) ──
    if (action === "ab_performance") {
      const [txnRes, metricsRes, scaleRes, agentsRes] = await Promise.all([
        userClient.from("transactions").select("agent_id, decision, outcome, risk_score, decided_by, decided_at, metadata").not("outcome", "is", null),
        userClient.from("intelligence_metrics").select("*").in("metric_name", ["network_accuracy", "false_positive_rate", "reinforcement_cycles"]).order("recorded_at", { ascending: true }),
        userClient.from("network_scale").select("*").order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
        userClient.from("agents").select("id, name, domain, performance_score, shared_learnings, created_at"),
      ]);

      const transactions = txnRes.data || [];
      const metrics = metricsRes.data || [];
      const agents = agentsRes.data || [];

      // Split transactions into early (first half) vs recent (second half) to simulate before/after
      const sorted = [...transactions].sort((a, b) => (a.decided_at || "").localeCompare(b.decided_at || ""));
      const midpoint = Math.floor(sorted.length / 2);
      const early = sorted.slice(0, midpoint);
      const recent = sorted.slice(midpoint);

      const calcStats = (txns: any[]) => {
        if (!txns.length) return { accuracy: 0, fpr: 0, count: 0, avgRisk: 0 };
        const correct = txns.filter(t => (t.decision === "approve" && t.outcome === "legitimate") || (t.decision === "reject" && t.outcome === "fraud")).length;
        const fp = txns.filter(t => t.decision === "reject" && t.outcome === "legitimate").length;
        const avgRisk = txns.reduce((s, t) => s + (t.risk_score ?? 0), 0) / txns.length;
        return { accuracy: (correct / txns.length) * 100, fpr: (fp / txns.length) * 100, count: txns.length, avgRisk };
      };

      const beforeStats = calcStats(early);
      const afterStats = calcStats(recent);

      // Accuracy over time from metrics
      const accuracyTimeline = metrics
        .filter(m => m.metric_name === "network_accuracy")
        .map(m => ({ date: m.recorded_at, value: m.metric_value }));

      const fprTimeline = metrics
        .filter(m => m.metric_name === "false_positive_rate")
        .map(m => ({ date: m.recorded_at, value: m.metric_value }));

      const reinforcementCount = metrics.filter(m => m.metric_name === "reinforcement_cycles").reduce((s, m) => s + m.metric_value, 0);

      return jsonRes({
        before: beforeStats,
        after: afterStats,
        improvement: {
          accuracy: afterStats.accuracy - beforeStats.accuracy,
          fpr: beforeStats.fpr - afterStats.fpr,
          risk_reduction: beforeStats.avgRisk - afterStats.avgRisk,
        },
        accuracy_timeline: accuracyTimeline,
        fpr_timeline: fprTimeline,
        reinforcement_cycles: reinforcementCount,
        total_agents: agents.length,
        total_transactions: transactions.length,
        scale: scaleRes.data,
      });
    }

    // ── Simulate Pilot Company Onboarding ──
    if (action === "onboard_pilots") {
      const pilots = [
        { name: "ShopGuard (E-commerce)", domain: "ecommerce_fraud", industry: "e-commerce", vertical: "retail" },
        { name: "UtilityShield (Utilities)", domain: "utility_billing", industry: "utilities", vertical: "energy" },
        { name: "LendSafe (Fintech)", domain: "lending_risk", industry: "fintech", vertical: "lending" },
      ];

      const createdAgents: any[] = [];
      const createdCompanies: any[] = [];

      for (const pilot of pilots) {
        const { data: existing } = await userClient.from("pilot_companies").select("id").eq("name", pilot.name).maybeSingle();
        if (existing) continue;

        const { data: company } = await userClient.from("pilot_companies").insert({
          user_id: user.id, name: pilot.name, industry: pilot.industry, vertical: pilot.vertical, status: "active",
          baseline_fraud_rate: 3 + Math.random() * 4, baseline_false_positive_rate: 8 + Math.random() * 7,
          current_fraud_rate: 1 + Math.random() * 2, current_false_positive_rate: 3 + Math.random() * 4,
          total_transactions: Math.floor(500 + Math.random() * 2000), total_decisions: Math.floor(400 + Math.random() * 1500),
        }).select().single();
        if (company) createdCompanies.push(company);

        const { data: agent } = await userClient.from("agents").insert({
          user_id: user.id, name: `${pilot.name} Agent`,
          description: `AI agent for ${pilot.industry} – ${pilot.domain.replace(/_/g, " ")}`,
          domain: pilot.domain, status: "active",
          performance_score: 60 + Math.random() * 25, shared_learnings: Math.floor(5 + Math.random() * 20),
        }).select().single();
        if (agent) createdAgents.push(agent);

        if (agent) {
          const categories = pilot.domain === "ecommerce_fraud"
            ? ["electronics", "fashion", "digital_goods", "marketplace"]
            : pilot.domain === "utility_billing"
            ? ["electricity", "water", "gas", "internet"]
            : ["personal_loan", "business_loan", "credit_line", "mortgage"];
          const outcomes = ["legitimate", "fraud", "legitimate", "legitimate", "legitimate"];

          const txnInserts = [];
          for (let i = 0; i < 15; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const decision = Math.random() > 0.15 ? "approve" : "reject";
            const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
            txnInserts.push({
              user_id: user.id, agent_id: agent.id,
              transaction_ref: `${pilot.domain}-${Date.now()}-${i}`,
              amount: Math.round((50 + Math.random() * 2000) * 100) / 100,
              merchant_name: `${pilot.name.split(" ")[0]} Merchant ${i + 1}`,
              merchant_category: cat,
              customer_id: `cust-${pilot.domain}-${Math.floor(Math.random() * 10)}`,
              customer_email: `user${Math.floor(Math.random() * 10)}@${pilot.domain.replace(/_/g, "")}.com`,
              country: ["US", "UK", "DE", "IN"][Math.floor(Math.random() * 4)],
              decision, decided_by: "ai_agent", decided_at: new Date().toISOString(),
              risk_score: Math.round(Math.random() * 80),
              decision_confidence: 0.6 + Math.random() * 0.35,
              outcome, outcome_at: new Date().toISOString(),
              outcome_score: outcome === "legitimate" ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3,
              metadata: { pilot_company: pilot.name, industry: pilot.industry },
            });
          }
          await userClient.from("transactions").insert(txnInserts);

          await userClient.from("agent_learnings").insert({
            agent_id: agent.id, user_id: user.id, learning_type: "behavioral",
            embedding_summary: `${pilot.industry} domain patterns: category risk profiles for ${categories.join(", ")}`,
            confidence_score: 0.7 + Math.random() * 0.25, domain: pilot.domain,
          });
        }
      }

      // Update network scale
      const [agentsAll, companiesAll, txnsAll, learningsAll] = await Promise.all([
        userClient.from("agents").select("id"),
        userClient.from("pilot_companies").select("id"),
        userClient.from("transactions").select("id"),
        userClient.from("agent_learnings").select("id"),
      ]);

      await adminClient.from("network_scale").insert({
        total_companies: companiesAll.data?.length || 0, total_agents: agentsAll.data?.length || 0,
        total_decisions: txnsAll.data?.length || 0, total_cross_domain_transfers: learningsAll.data?.length || 0,
        verticals: [...new Set(pilots.map(p => p.vertical))],
        avg_accuracy_improvement: 15 + Math.random() * 10, avg_roi_improvement: 20 + Math.random() * 15,
        avg_error_reduction: 25 + Math.random() * 10, created_by: user.id,
      });

      return jsonRes({
        success: true, companies_created: createdCompanies.length, agents_created: createdAgents.length,
        transactions_per_pilot: 15, message: `Onboarded ${createdCompanies.length} pilot companies with agents and transaction history`,
      });
    }

    // ── Network ROI Summary ──
    if (action === "network_roi") {
      const [agentsRes, companiesRes, txnRes, insightsRes, learningsRes, scaleRes] = await Promise.all([
        userClient.from("agents").select("id, name, domain, performance_score, shared_learnings"),
        userClient.from("pilot_companies").select("*"),
        userClient.from("transactions").select("decision, outcome, decided_by, agent_id, risk_score").not("outcome", "is", null),
        userClient.from("shared_insights").select("id, insight_type, confidence, source_domains").eq("status", "active"),
        userClient.from("agent_learnings").select("id, domain, confidence_score"),
        userClient.from("network_scale").select("*").order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const agents = agentsRes.data || [];
      const transactions = txnRes.data || [];
      const learnings = learningsRes.data || [];
      const domains = [...new Set(agents.map(a => a.domain).filter(Boolean))];

      const domainStats = domains.map(domain => {
        const domainAgents = agents.filter(a => a.domain === domain);
        const agentIds = domainAgents.map(a => a.id);
        const domainTxns = transactions.filter(t => agentIds.includes(t.agent_id));
        const correct = domainTxns.filter(t => (t.decision === "approve" && t.outcome === "legitimate") || (t.decision === "reject" && t.outcome === "fraud")).length;
        const accuracy = domainTxns.length > 0 ? (correct / domainTxns.length) * 100 : 0;
        const domainLearnings = learnings.filter(l => l.domain === domain);
        const avgConfidence = domainLearnings.length ? domainLearnings.reduce((s, l) => s + (l.confidence_score || 0), 0) / domainLearnings.length : 0;
        return { domain: domain!, agents: domainAgents.length, transactions: domainTxns.length, accuracy, learnings: domainLearnings.length, avg_confidence: avgConfidence };
      });

      const crossDomainInsights = (insightsRes.data || []).filter(i => i.insight_type === "cross_domain").length;

      return jsonRes({
        total_agents: agents.length, total_companies: companiesRes.data?.length || 0,
        total_transactions: transactions.length, total_insights: insightsRes.data?.length || 0,
        total_learnings: learnings.length, cross_domain_insights: crossDomainInsights,
        domains: domainStats, scale: scaleRes.data,
      });
    }

    return jsonRes({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("network-intelligence error:", e);
    return jsonRes({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
