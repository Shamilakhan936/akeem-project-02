import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const merchants = [
  { name: "TechGear Pro", category: "electronics" },
  { name: "Fashion Forward", category: "apparel" },
  { name: "Home Essentials", category: "home_goods" },
  { name: "Quick Pharma", category: "health" },
  { name: "GourmetBox", category: "food_delivery" },
  { name: "GameVault", category: "digital_goods" },
  { name: "AutoParts Direct", category: "automotive" },
  { name: "LuxeWatch Co", category: "luxury" },
  { name: "BookNest", category: "media" },
  { name: "PetPlanet", category: "pet_supplies" },
];

const countries = ["US", "GB", "DE", "FR", "JP", "BR", "IN", "AU", "CA", "NG", "RU", "CN"];
const payments = ["credit_card", "debit_card", "paypal", "apple_pay", "crypto", "wire_transfer"];
const firstNames = ["Alice", "Bob", "Carlos", "Diana", "Erik", "Fiona", "George", "Hannah", "Ivan", "Julia"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function uuid() { return crypto.randomUUID(); }
function genEmail(first: string, last: string) { return `${first.toLowerCase()}.${last.toLowerCase()}@${pick(["gmail.com","yahoo.com","outlook.com","company.com"])}`; }
function genIP() { return `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`; }
function genFingerprint() { return `fp_${Math.random().toString(36).substring(2, 15)}`; }

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
    const count = Math.min(body.count || 25, 100);
    const includeKnowledgeGraph = body.include_knowledge_graph !== false;
    const pilotCompanyId = body.pilot_company_id || null;

    // Get user's agents to assign transactions
    const { data: agents } = await userClient.from("agents").select("id, domain").limit(10);
    const fraudAgent = agents?.find(a => a.domain?.includes("fraud")) || agents?.[0];

    const transactions: any[] = [];
    const customerMap = new Map<string, { id: string; email: string; name: string }>();

    for (let i = 0; i < count; i++) {
      const first = pick(firstNames);
      const last = pick(lastNames);
      const custKey = `${first}_${last}`;
      if (!customerMap.has(custKey)) {
        customerMap.set(custKey, { id: uuid(), email: genEmail(first, last), name: `${first} ${last}` });
      }
      const customer = customerMap.get(custKey)!;
      const merchant = pick(merchants);
      const isFraudulent = Math.random() < 0.15; // 15% fraud rate for demo
      const isHighValue = Math.random() < 0.1;

      let amount: number;
      if (isFraudulent) {
        amount = isHighValue ? 2000 + Math.random() * 8000 : 200 + Math.random() * 1500;
      } else {
        amount = isHighValue ? 500 + Math.random() * 2000 : 15 + Math.random() * 300;
      }
      amount = Math.round(amount * 100) / 100;

      const country = isFraudulent && Math.random() > 0.5 ? pick(["NG", "RU", "CN"]) : pick(countries);
      const payment = isFraudulent && Math.random() > 0.6 ? pick(["crypto", "wire_transfer"]) : pick(payments);

      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      transactions.push({
        user_id: user.id,
        agent_id: fraudAgent?.id || null,
        transaction_ref: `TXN-${Date.now()}-${i.toString().padStart(4, "0")}`,
        amount,
        currency: "USD",
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        customer_email: customer.email,
        customer_id: customer.id,
        payment_method: payment,
        country,
        ip_address: genIP(),
        device_fingerprint: genFingerprint(),
        decision: "pending",
        metadata: {
          is_demo: true,
          simulated_fraud: isFraudulent,
          pilot_company_id: pilotCompanyId,
        },
        created_at: createdAt.toISOString(),
      });
    }

    // Insert in batches
    const batchSize = 25;
    let inserted = 0;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const { error } = await userClient.from("transactions").insert(batch);
      if (!error) inserted += batch.length;
    }

    // Build knowledge graph if requested
    let nodesCreated = 0;
    let edgesCreated = 0;
    if (includeKnowledgeGraph) {
      // Create merchant nodes
      const merchantNodes: any[] = [];
      const usedMerchants = [...new Set(transactions.map(t => t.merchant_name))];
      for (const m of usedMerchants) {
        const mc = merchants.find(x => x.name === m);
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "merchant",
          label: m,
          domain: mc?.category || "unknown",
          properties: { category: mc?.category, transaction_count: transactions.filter(t => t.merchant_name === m).length },
        }).select().single();
        if (data) merchantNodes.push(data);
      }
      nodesCreated += merchantNodes.length;

      // Create customer nodes
      const customerNodes: any[] = [];
      for (const [, cust] of customerMap) {
        const custTxns = transactions.filter(t => t.customer_id === cust.id);
        const { data } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "customer",
          label: cust.name,
          properties: { email: cust.email, transaction_count: custTxns.length, total_spend: custTxns.reduce((s, t) => s + t.amount, 0) },
        }).select().single();
        if (data) customerNodes.push(data);
      }
      nodesCreated += customerNodes.length;

      // Create fraud pattern nodes
      const fraudTxns = transactions.filter(t => t.metadata?.simulated_fraud);
      if (fraudTxns.length > 0) {
        const { data: patternNode } = await userClient.from("knowledge_graph_nodes").insert({
          user_id: user.id,
          node_type: "pattern",
          label: "High-Risk Transaction Pattern",
          domain: "fraud_detection",
          properties: { count: fraudTxns.length, avg_amount: fraudTxns.reduce((s, t) => s + t.amount, 0) / fraudTxns.length },
          weight: 2.0,
        }).select().single();
        if (patternNode) {
          nodesCreated++;
          // Link fraud pattern to merchants involved
          for (const mn of merchantNodes) {
            const hasFraud = fraudTxns.some(t => t.merchant_name === mn.label);
            if (hasFraud) {
              await userClient.from("knowledge_graph_edges").insert({
                user_id: user.id,
                source_node_id: patternNode.id,
                target_node_id: mn.id,
                relationship_type: "flagged_for",
                weight: 1.5,
                properties: { reason: "Associated with simulated fraudulent transactions" },
              });
              edgesCreated++;
            }
          }
        }
      }

      // Create customer-merchant edges
      for (const cn of customerNodes) {
        for (const mn of merchantNodes) {
          const custName = cn.label;
          const merchName = mn.label;
          const custEntry = [...customerMap.values()].find(c => c.name === custName);
          if (!custEntry) continue;
          const txnCount = transactions.filter(t => t.customer_id === custEntry.id && t.merchant_name === merchName).length;
          if (txnCount > 0) {
            await userClient.from("knowledge_graph_edges").insert({
              user_id: user.id,
              source_node_id: cn.id,
              target_node_id: mn.id,
              relationship_type: "transacted_with",
              weight: txnCount,
              properties: { transaction_count: txnCount },
            });
            edgesCreated++;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      transactions_created: inserted,
      knowledge_graph: { nodes: nodesCreated, edges: edgesCreated },
      fraud_rate: `${(transactions.filter(t => t.metadata?.simulated_fraud).length / transactions.length * 100).toFixed(1)}%`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-demo-transactions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
