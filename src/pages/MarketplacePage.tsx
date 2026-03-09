import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Code2, Copy, ExternalLink, Key, Package, Plug, BookOpen,
  ChevronRight, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const endpoints = [
  {
    method: "POST",
    path: "/functions/v1/webhook",
    name: "Ingest Events",
    description: "Send agent events, feedback, metrics, or batch data into the network.",
    body: `{
  "event_type": "agent_event",
  "payload": {
    "agent_id": "AGENT_UUID",
    "type": "decision_made",
    "description": "Approved transaction #1234"
  }
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/score-transaction",
    name: "Score Transaction",
    description: "Submit a transaction for AI fraud risk scoring.",
    body: `{
  "transaction_id": "TXN_UUID",
  "action": "score"
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/score-transaction",
    name: "Batch Score",
    description: "Score all pending transactions at once.",
    body: `{
  "action": "score_batch"
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/score-transaction",
    name: "Record Outcome",
    description: "Feed back transaction outcomes for reinforcement learning.",
    body: `{
  "transaction_id": "TXN_UUID",
  "action": "record_outcome",
  "outcome": "legitimate",
  "outcome_score": 1.0
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/network-intelligence",
    name: "Propagate Learnings",
    description: "Trigger network-wide reinforcement learning propagation.",
    body: `{
  "action": "propagate_learnings"
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/network-intelligence",
    name: "Detect Cross-Domain Transfers",
    description: "AI-powered detection of transferable patterns across domains.",
    body: `{
  "action": "detect_transfers"
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/analyze-intelligence",
    name: "Analyze Intelligence",
    description: "Run cross-agent AI analysis to discover shared insights.",
    body: `{
  "action": "analyze_agents"
}`,
  },
  {
    method: "POST",
    path: "/functions/v1/generate-demo-transactions",
    name: "Generate Demo Data",
    description: "Generate realistic e-commerce transaction data with knowledge graph.",
    body: `{
  "count": 25,
  "include_knowledge_graph": true
}`,
  },
];

const sdkCode = `// Install: npm install @synapse/sdk
import { SynapseClient } from '@synapse/sdk';

const client = new SynapseClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: '${import.meta.env.VITE_SUPABASE_URL}/functions/v1',
});

// Score a transaction
const result = await client.transactions.score('txn_id');
console.log(result.risk_score, result.decision);

// Record outcome for reinforcement learning
await client.transactions.recordOutcome('txn_id', {
  outcome: 'legitimate',
  score: 1.0,
});

// Trigger network intelligence propagation
const update = await client.network.propagateLearnings();
console.log(\`Updated \${update.agents_updated} agents\`);

// Detect cross-domain transfers
const transfers = await client.network.detectTransfers();
transfers.forEach(t => {
  console.log(\`\${t.source_domain} → \${t.target_domain}: \${t.pattern_name}\`);
});

// Send a webhook event
await client.events.send({
  event_type: 'agent_event',
  payload: {
    agent_id: 'agent_uuid',
    type: 'decision_made',
    description: 'Approved order #5678',
  },
});`;

const MarketplacePage = () => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API & SDK</h1>
        <p className="text-sm text-muted-foreground mt-1">Integrate third-party agents into the network</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api"><Terminal className="w-4 h-4 mr-1.5" />API Reference</TabsTrigger>
          <TabsTrigger value="sdk"><Code2 className="w-4 h-4 mr-1.5" />SDK</TabsTrigger>
          <TabsTrigger value="quickstart"><BookOpen className="w-4 h-4 mr-1.5" />Quick Start</TabsTrigger>
        </TabsList>

        {/* API Reference */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">All API requests require a Bearer token in the Authorization header.</p>
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground">
                Authorization: Bearer YOUR_API_TOKEN
              </div>
            </CardContent>
          </Card>

          {endpoints.map((ep, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">{ep.method}</Badge>
                      {ep.name}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyCode(`curl -X ${ep.method} ${baseUrl}${ep.path} \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.body}'`)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{ep.description}</p>
                  <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground overflow-x-auto">
                    <span className="text-foreground">{ep.method}</span> {baseUrl}{ep.path}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
                    {ep.body}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* SDK */}
        <TabsContent value="sdk">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />JavaScript / TypeScript SDK
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyCode(sdkCode)}>
                  <Copy className="w-3.5 h-3.5 mr-1" />Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted/50 p-4 font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                {sdkCode}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Start */}
        <TabsContent value="quickstart">
          <div className="space-y-4">
            {[
              { step: "1", title: "Get Your API Key", desc: "Navigate to Pilot Companies and copy your company's API key. This key authenticates all requests." },
              { step: "2", title: "Create an Agent", desc: "Use the Agents page or API to create a fraud detection agent. Assign it a domain (e.g., 'fraud_detection')." },
              { step: "3", title: "Ingest Transactions", desc: "POST transaction data via the webhook or generate demo data to test the pipeline." },
              { step: "4", title: "Score with AI", desc: "Call the score-transaction endpoint to get AI-powered risk scores and approve/reject decisions." },
              { step: "5", title: "Record Outcomes", desc: "Feed back real outcomes (legitimate/fraud) to train the reinforcement learning loop." },
              { step: "6", title: "Propagate Learnings", desc: "Trigger network-wide learning propagation to boost all agents with shared intelligence." },
              { step: "7", title: "Measure Network Effect", desc: "Check the Network Effect dashboard to see baseline vs. network-enhanced performance." },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="pt-5 pb-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{s.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default MarketplacePage;
