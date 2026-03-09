import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── PayLaterr BNPL domain data ──
const billCategories = [
  { name: "Electricity", category: "utilities", avgAmount: 120, riskWeight: 0.2 },
  { name: "Internet", category: "utilities", avgAmount: 65, riskWeight: 0.1 },
  { name: "Rent", category: "housing", avgAmount: 1500, riskWeight: 0.4 },
  { name: "Insurance", category: "insurance", avgAmount: 280, riskWeight: 0.15 },
  { name: "Phone Plan", category: "telecom", avgAmount: 85, riskWeight: 0.1 },
  { name: "Water", category: "utilities", avgAmount: 55, riskWeight: 0.15 },
  { name: "Gas", category: "utilities", avgAmount: 90, riskWeight: 0.2 },
  { name: "Streaming", category: "entertainment", avgAmount: 35, riskWeight: 0.05 },
  { name: "Gym Membership", category: "health", avgAmount: 50, riskWeight: 0.05 },
  { name: "Car Payment", category: "auto", avgAmount: 450, riskWeight: 0.35 },
  { name: "Student Loan", category: "education", avgAmount: 350, riskWeight: 0.3 },
  { name: "Medical Bill", category: "health", avgAmount: 600, riskWeight: 0.45 },
];

const merchantProviders = [
  "ConEdison", "Verizon", "T-Mobile", "AT&T", "Xfinity", "Geico",
  "Progressive", "Planet Fitness", "Netflix", "Spotify", "State Farm",
  "BlueCross", "Navient", "SoFi", "Chase", "Capital One",
];

const firstNames = ["Aisha", "Marcus", "Sofia", "James", "Priya", "Diego", "Mia", "Liam", "Zara", "Noah",
  "Chloe", "Ethan", "Amara", "Oliver", "Luna", "Kai", "Nadia", "Leo", "Fatima", "Ryan"];
const lastNames = ["Okonkwo", "Chen", "Patel", "Williams", "Garcia", "Kim", "Johnson", "Singh", "Brown", "Ali",
  "Martinez", "Thompson", "Nguyen", "Davis", "Hernandez", "Wilson", "Lee", "Moore", "Taylor", "Jackson"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function genEmail(f: string, l: string) { return `${f.toLowerCase()}.${l.toLowerCase()}@${pick(["gmail.com", "yahoo.com", "outlook.com", "icloud.com"])}`; }
function genPhone() { return `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const action = body.action || "seed_all";

    // ════════════════════════════════════════════════
    // ACTION: seed_all — Create PayLaterr agent + data
    // ════════════════════════════════════════════════
    if (action === "seed_all") {
      const userCount = body.user_count || 20;
      const txnsPerUser = body.txns_per_user || 6;

      // 1. Create PayLaterr agent
      const { data: agent, error: agentErr } = await userClient.from("agents").insert({
        user_id: user.id,
        name: "PayLaterr BNPL Agent",
        description: "Buy-now-pay-later agent analyzing payment history, bill categories, repayment schedules. Outputs: installment approval, recommended bill splits, early missed payment alerts.",
        domain: "bnpl",
        status: "active",
        performance_score: 72,
        shared_learnings: 0,
      }).select().single();
      if (agentErr) throw new Error(`Failed to create agent: ${agentErr.message}`);

      // 2. Create decision templates
      const templates = [
        {
          user_id: user.id,
          agent_id: agent.id,
          name: "Installment Approval",
          decision_type: "approval",
          description: "Evaluate user creditworthiness for BNPL installment plans based on repayment history and bill risk.",
          config: { max_installments: 12, min_credit_score: 40, max_amount: 5000 },
          metrics: [
            { name: "approval_rate", value: 0 },
            { name: "default_rate", value: 0 },
            { name: "avg_repayment_time", value: 0 },
          ],
        },
        {
          user_id: user.id,
          agent_id: agent.id,
          name: "Bill Split Recommendation",
          decision_type: "recommendation",
          description: "Recommend optimal bill splitting strategy based on user income patterns and payment timing.",
          config: { split_options: [2, 3, 4, 6], priority_bills: ["housing", "utilities"] },
          metrics: [
            { name: "user_satisfaction", value: 0 },
            { name: "completion_rate", value: 0 },
          ],
        },
        {
          user_id: user.id,
          agent_id: agent.id,
          name: "Delinquency Early Alert",
          decision_type: "alert",
          description: "Predict missed payments 7-14 days before due date based on behavioral signals and payment history.",
          config: { alert_window_days: 14, sensitivity: "medium", channels: ["push", "email"] },
          metrics: [
            { name: "prediction_accuracy", value: 0 },
            { name: "prevented_defaults", value: 0 },
          ],
        },
      ];
      await userClient.from("decision_templates").insert(templates);

      // 3. Create PayLaterr pilot company
      const { data: pilot } = await userClient.from("pilot_companies").insert({
        user_id: user.id,
        name: "PayLaterr",
        industry: "fintech",
        vertical: "bnpl",
        status: "active",
        baseline_fraud_rate: 8.5,
        baseline_false_positive_rate: 22,
        current_fraud_rate: 8.5,
        current_false_positive_rate: 22,
        metadata: { product: "bill-payment-bnpl", launch_date: new Date().toISOString() },
      }).select().single();

      // 4. Generate users & transactions
      const customers: Array<{ id: string; name: string; email: string; phone: string; creditScore: number; riskProfile: string }> = [];
      for (let i = 0; i < userCount; i++) {
        const first = pick(firstNames);
        const last = pick(lastNames);
        const creditScore = Math.floor(30 + Math.random() * 70);
        const riskProfile = creditScore > 70 ? "low" : creditScore > 45 ? "medium" : "high";
        customers.push({
          id: crypto.randomUUID(),
          name: `${first} ${last}`,
          email: genEmail(first, last),
          phone: genPhone(),
          creditScore,
          riskProfile,
        });
      }

      const transactions: any[] = [];
      const now = new Date();

      for (const cust of customers) {
        // Each user has recurring bills
        const userBills = [];
        const billCount = 3 + Math.floor(Math.random() * 4);
        const selectedBills = [...billCategories].sort(() => Math.random() - 0.5).slice(0, billCount);

        for (const bill of selectedBills) {
          for (let m = 0; m < txnsPerUser; m++) {
            const daysAgo = m * 30 + Math.floor(Math.random() * 5);
            const createdAt = new Date(now);
            createdAt.setDate(createdAt.getDate() - daysAgo);

            // Payment behavior based on risk profile
            const willDefault = cust.riskProfile === "high" ? Math.random() < 0.35 :
                               cust.riskProfile === "medium" ? Math.random() < 0.12 :
                               Math.random() < 0.03;
            const willPayLate = !willDefault && (
              cust.riskProfile === "high" ? Math.random() < 0.4 :
              cust.riskProfile === "medium" ? Math.random() < 0.15 :
              Math.random() < 0.05
            );

            const amount = bill.avgAmount * (0.85 + Math.random() * 0.3);
            const installments = pick([2, 3, 4]);
            const installmentAmount = Math.round(amount / installments * 100) / 100;

            let outcome: string | null = null;
            let outcomeScore: number | null = null;
            let outcomeAt: string | null = null;

            if (m > 0) { // Historical transactions have outcomes
              if (willDefault) {
                outcome = "defaulted";
                outcomeScore = 0;
              } else if (willPayLate) {
                outcome = "paid_late";
                outcomeScore = 0.5;
              } else {
                outcome = "paid_on_time";
                outcomeScore = 1.0;
              }
              const outDate = new Date(createdAt);
              outDate.setDate(outDate.getDate() + (willPayLate ? 35 + Math.floor(Math.random() * 20) : 28 + Math.floor(Math.random() * 3)));
              outcomeAt = outDate.toISOString();
            }

            transactions.push({
              user_id: user.id,
              agent_id: agent.id,
              transaction_ref: `PL-${Date.now()}-${transactions.length.toString().padStart(5, "0")}`,
              amount: Math.round(amount * 100) / 100,
              currency: "USD",
              merchant_name: pick(merchantProviders),
              merchant_category: bill.category,
              customer_email: cust.email,
              customer_id: cust.id,
              payment_method: pick(["bank_transfer", "debit_card", "credit_card"]),
              country: "US",
              decision: m === 0 ? "pending" : (willDefault && Math.random() < 0.3 ? "reject" : "approve"),
              decided_by: m === 0 ? "pending" : "ai_agent",
              decided_at: m === 0 ? null : createdAt.toISOString(),
              decision_confidence: m === 0 ? 0 : 0.6 + Math.random() * 0.35,
              risk_score: m === 0 ? 0 : Math.round((1 - cust.creditScore / 100) * 100 * bill.riskWeight + Math.random() * 20),
              outcome,
              outcome_score: outcomeScore,
              outcome_at: outcomeAt,
              metadata: {
                is_demo: true,
                platform: "paylaterr",
                bill_name: bill.name,
                bill_category: bill.category,
                installments,
                installment_amount: installmentAmount,
                credit_score: cust.creditScore,
                risk_profile: cust.riskProfile,
                pilot_company_id: pilot?.id,
              },
              risk_factors: m > 0 ? [
                { factor: "credit_score", severity: cust.riskProfile === "high" ? "high" : cust.riskProfile === "medium" ? "medium" : "low", description: `Credit score: ${cust.creditScore}` },
                { factor: "bill_risk", severity: bill.riskWeight > 0.3 ? "high" : bill.riskWeight > 0.15 ? "medium" : "low", description: `${bill.name}: risk weight ${bill.riskWeight}` },
              ] : [],
              created_at: createdAt.toISOString(),
            });
          }
        }
      }

      // Insert transactions in batches
      let txInserted = 0;
      const batchSize = 25;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { error } = await userClient.from("transactions").insert(batch);
        if (!error) txInserted += batch.length;
      }

      // 5. Build knowledge graph
      let nodesCreated = 0;
      let edgesCreated = 0;

      // User nodes
      const userNodes: any[] = [];
      for (const cust of customers.slice(0, 15)) { // cap for perf
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "customer",
          label: cust.name,
          domain: "bnpl",
          weight: cust.creditScore / 100,
          properties: { email: cust.email, credit_score: cust.creditScore, risk_profile: cust.riskProfile },
        }).select().single();
        if (data) userNodes.push(data);
      }
      nodesCreated += userNodes.length;

      // Bill category nodes
      const billNodes: any[] = [];
      for (const bill of billCategories) {
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "merchant",
          label: bill.name,
          domain: bill.category,
          weight: bill.riskWeight,
          properties: { category: bill.category, avg_amount: bill.avgAmount, risk_weight: bill.riskWeight },
        }).select().single();
        if (data) billNodes.push(data);
      }
      nodesCreated += billNodes.length;

      // Risk cluster nodes
      const riskClusters = ["Low Risk Payers", "Medium Risk Payers", "High Risk Payers", "Late Payment Pattern", "Default Risk Pattern"];
      const clusterNodes: any[] = [];
      for (const label of riskClusters) {
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "pattern",
          label,
          domain: "bnpl",
          weight: label.includes("High") || label.includes("Default") ? 2.5 : label.includes("Medium") || label.includes("Late") ? 1.5 : 0.5,
          properties: { type: "risk_cluster" },
        }).select().single();
        if (data) clusterNodes.push(data);
      }
      nodesCreated += clusterNodes.length;

      // Payment outcome node
      const outcomeLabels = ["On-Time Payment", "Late Payment", "Default"];
      const outcomeNodes: any[] = [];
      for (const label of outcomeLabels) {
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "order",
          label,
          domain: "bnpl",
          weight: label === "Default" ? 3.0 : label === "Late Payment" ? 2.0 : 1.0,
          properties: { type: "payment_outcome" },
        }).select().single();
        if (data) outcomeNodes.push(data);
      }
      nodesCreated += outcomeNodes.length;

      // Edges: users → bills, users → risk clusters, bills → outcomes
      for (const un of userNodes) {
        const custData = customers.find(c => c.name === un.label);
        if (!custData) continue;

        // User → bill categories they pay
        const custTxns = transactions.filter(t => t.customer_id === custData.id);
        const custBills = [...new Set(custTxns.map(t => t.metadata?.bill_name))];
        for (const billName of custBills) {
          const bn = billNodes.find(b => b.label === billName);
          if (bn) {
            await userClient.from("knowledge_graph_edges").insert({
              user_id: user.id,
              source_node_id: un.id,
              target_node_id: bn.id,
              relationship_type: "pays_bill",
              weight: custTxns.filter(t => t.metadata?.bill_name === billName).length,
            });
            edgesCreated++;
          }
        }

        // User → risk cluster
        const cluster = custData.riskProfile === "low" ? clusterNodes[0] : custData.riskProfile === "medium" ? clusterNodes[1] : clusterNodes[2];
        if (cluster) {
          await userClient.from("knowledge_graph_edges").insert({
            user_id: user.id,
            source_node_id: un.id,
            target_node_id: cluster.id,
            relationship_type: "belongs_to",
            weight: 1,
          });
          edgesCreated++;
        }
      }

      // Bills → payment outcomes
      for (const bn of billNodes) {
        for (const on of outcomeNodes) {
          await userClient.from("knowledge_graph_edges").insert({
            user_id: user.id,
            source_node_id: bn.id,
            target_node_id: on.id,
            relationship_type: "results_in",
            weight: on.label === "On-Time Payment" ? 3 : on.label === "Late Payment" ? 1.5 : 0.5,
          });
          edgesCreated++;
        }
      }

      // Risk clusters → outcomes
      for (const cn of clusterNodes) {
        if (cn.label.includes("Default")) {
          const defaultNode = outcomeNodes.find(o => o.label === "Default");
          if (defaultNode) {
            await userClient.from("knowledge_graph_edges").insert({
              user_id: user.id, source_node_id: cn.id, target_node_id: defaultNode.id,
              relationship_type: "predicts", weight: 2.5,
            });
            edgesCreated++;
          }
        }
        if (cn.label.includes("Late")) {
          const lateNode = outcomeNodes.find(o => o.label === "Late Payment");
          if (lateNode) {
            await userClient.from("knowledge_graph_edges").insert({
              user_id: user.id, source_node_id: cn.id, target_node_id: lateNode.id,
              relationship_type: "predicts", weight: 2.0,
            });
            edgesCreated++;
          }
        }
      }

      // 6. Create agent learnings from historical outcomes
      const learnings = [
        { type: "behavioral", summary: "Users with credit scores below 45 have 35% default rate on utility bills. Recommend max 2 installments for high-risk users.", confidence: 0.85 },
        { type: "pattern", summary: "Late payments cluster around month-end (25th-31st). Users paying on the 1st-5th have 95% on-time rate.", confidence: 0.92 },
        { type: "risk_signal", summary: "Medical bills and car payments show highest default correlation. Housing bills (rent) have moderate risk but highest impact.", confidence: 0.78 },
        { type: "behavioral", summary: "Users who pay 3+ bills on time for 2+ months drop default risk by 40%. Recommend credit score upgrade after consistent payment.", confidence: 0.88 },
        { type: "cross_domain", summary: "Payment timing patterns from utility bills predict debit card transaction fraud risk with 72% accuracy. Cross-domain signal detected.", confidence: 0.72 },
      ];
      for (const l of learnings) {
        await userClient.from("agent_learnings").insert({
          user_id: user.id,
          agent_id: agent.id,
          learning_type: l.type,
          embedding_summary: l.summary,
          confidence_score: l.confidence,
          domain: "bnpl",
        });
      }

      // 7. Create feedback events from historical decisions
      const historicalTxns = transactions.filter(t => t.outcome);
      for (const txn of historicalTxns.slice(0, 50)) {
        const isCorrect = (txn.decision === "approve" && txn.outcome === "paid_on_time") ||
                         (txn.decision === "reject" && txn.outcome === "defaulted");
        await userClient.from("feedback_events").insert({
          user_id: user.id,
          agent_id: agent.id,
          stage: "outcome",
          action_taken: `${txn.decision} installment for ${txn.metadata.bill_name} ($${txn.amount.toFixed(2)})`,
          outcome: txn.outcome,
          outcome_score: txn.outcome_score,
          reinforcement_delta: isCorrect ? 0.05 : -0.1,
          metadata: {
            platform: "paylaterr",
            bill_category: txn.metadata.bill_category,
            credit_score: txn.metadata.credit_score,
            risk_profile: txn.metadata.risk_profile,
          },
        });
      }

      // 8. Create shared insights
      const insights = [
        {
          title: "High-risk bill categories identified",
          description: "Medical bills (45% risk weight) and car payments (35%) show significantly higher default rates than utilities (10-20%). Recommend stricter approval for these categories.",
          insight_type: "pattern",
          confidence: 0.88,
          source_domains: ["bnpl", "utilities", "health", "auto"],
          source_agent_count: 1,
          impact_score: 8.5,
        },
        {
          title: "Payment timing predicts default risk",
          description: "Users who consistently pay between the 1st-5th of the month have 95% on-time rates. Late-month payers (25th+) show 3x higher default rates. Recommend adjusting due dates for at-risk users.",
          insight_type: "pattern",
          confidence: 0.92,
          source_domains: ["bnpl", "payment_timing"],
          source_agent_count: 1,
          impact_score: 9.2,
        },
        {
          title: "Cross-domain: BNPL repayment signals predict e-commerce fraud",
          description: "Users with consistent BNPL repayment history show 72% lower fraud rates in e-commerce transactions. This signal can improve fraud detection when integrated into the network.",
          insight_type: "cross_domain",
          confidence: 0.72,
          source_domains: ["bnpl", "e-commerce", "fraud_detection"],
          source_agent_count: 1,
          impact_score: 7.8,
        },
      ];
      for (const ins of insights) {
        await userClient.from("shared_insights").insert({ ...ins, created_by: user.id });
      }

      // 9. Record network scale
      await userClient.from("network_scale").insert({
        created_by: user.id,
        total_agents: 1,
        total_companies: 1,
        total_decisions: txInserted,
        total_cross_domain_transfers: 1,
        verticals: ["bnpl"],
        avg_accuracy_improvement: 0,
        avg_roi_improvement: 0,
        avg_error_reduction: 0,
      });

      return new Response(JSON.stringify({
        success: true,
        agent: { id: agent.id, name: agent.name },
        pilot: { id: pilot?.id, name: "PayLaterr" },
        transactions_created: txInserted,
        customers: customers.length,
        knowledge_graph: { nodes: nodesCreated, edges: edgesCreated },
        decision_templates: templates.length,
        learnings: learnings.length,
        feedback_events: Math.min(historicalTxns.length, 50),
        insights: insights.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-paylaterr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
