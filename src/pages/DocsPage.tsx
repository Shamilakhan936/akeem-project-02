import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Book, Code, Terminal, Cpu, Workflow, FileText, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const sections = [
  {
    id: "getting-started",
    icon: Book,
    title: "Getting Started",
    desc: "Deploy your first agent in under 5 minutes with our quickstart guide.",
    content: [
      { heading: "1. Create an Account", body: "Sign up at the Synapse dashboard. You'll receive an API key automatically upon registration." },
      { heading: "2. Create Your First Agent", body: "Navigate to Dashboard → Agents → New Agent. Give it a name, assign a domain (e.g. 'ecommerce_fraud'), and click Create." },
      { heading: "3. Seed Demo Data", body: "Click 'Seed Demo' on the dashboard to populate your agent with sample transactions, decision templates, and feedback events." },
      { heading: "4. Run AI Scoring", body: "Go to Transactions, select a pending transaction, and click 'Score with AI'. The agent will analyze the transaction using network intelligence." },
      { heading: "5. Review Outcomes", body: "Mark transactions as 'legitimate' or 'fraud' to feed the reinforcement loop. The network learns from every outcome." },
    ],
    code: `// Quick start with the Synapse SDK
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create an agent
const { data: agent } = await supabase
  .from('agents')
  .insert({ name: 'My First Agent', domain: 'fraud_detection', user_id: userId })
  .select()
  .single();

console.log('Agent created:', agent.id);`,
  },
  {
    id: "api-reference",
    icon: Code,
    title: "API Reference",
    desc: "Full REST and SDK documentation for agent creation, management, and monitoring.",
    content: [
      { heading: "Authentication", body: "All API requests require a Bearer token in the Authorization header. Obtain your token by signing in via the auth endpoint." },
      { heading: "Agents API", body: "CRUD operations on agents. Supports filtering by domain, status, and team_id. Returns performance_score and shared_learnings count." },
      { heading: "Transactions API", body: "Submit transactions for scoring, query history, and record outcomes. Supports batch operations for high-volume processing." },
      { heading: "Intelligence API", body: "Invoke edge functions for AI scoring (score-transaction), network intelligence (propagate_learnings, detect_transfers), and analytics (ab_performance)." },
      { heading: "Webhooks API", body: "Configure external webhook endpoints to receive real-time notifications for anomalies, performance drops, and agent errors." },
    ],
    code: `// Score a transaction via the API
const { data, error } = await supabase.functions.invoke('score-transaction', {
  body: { transaction_id: 'txn_abc123', action: 'score' }
});

// Response
{
  "success": true,
  "result": {
    "risk_score": 23,
    "decision": "approve",
    "confidence": 0.94,
    "risk_factors": [
      { "factor": "amount", "severity": "low", "description": "Within normal range" }
    ]
  }
}`,
  },
  {
    id: "cli-tools",
    icon: Terminal,
    title: "CLI Tools",
    desc: "Command-line interface for deploying, testing, and managing agents at scale.",
    content: [
      { heading: "Installation", body: "Install the Synapse CLI globally via npm: npm install -g @synapse/cli. Requires Node.js 18+." },
      { heading: "Authentication", body: "Run 'synapse login' to authenticate with your API key. Credentials are stored securely in ~/.synapse/config." },
      { heading: "Agent Management", body: "Use 'synapse agents list', 'synapse agents create --name MyAgent --domain fraud', and 'synapse agents deploy <id>' to manage agents." },
      { heading: "Batch Scoring", body: "Process CSV files with 'synapse score --file transactions.csv --agent <id>'. Supports parallel processing up to 50 transactions." },
      { heading: "Monitoring", body: "Stream live agent events with 'synapse logs --agent <id> --follow'. Filter by event type with '--type decision_made'." },
    ],
    code: `# Install the CLI
npm install -g @synapse/cli

# Authenticate
synapse login --key sk_live_your_api_key

# Create an agent
synapse agents create \\
  --name "Fraud Detector" \\
  --domain "ecommerce_fraud" \\
  --description "E-commerce fraud detection agent"

# Score a batch of transactions
synapse score --file ./transactions.csv --agent agent_abc123

# Stream live logs
synapse logs --agent agent_abc123 --follow --type decision_made`,
  },
  {
    id: "agent-config",
    icon: Cpu,
    title: "Agent Configuration",
    desc: "Configure domains, feedback loops, learning rates, and behavioral parameters.",
    content: [
      { heading: "Domains", body: "Agents operate within a specific domain (e.g. ecommerce_fraud, lending_risk, utility_billing). Domains determine which shared intelligence patterns are relevant." },
      { heading: "Performance Scoring", body: "Agents track a performance_score (0-100) that updates based on decision outcomes. The network reinforcement loop applies cross-agent boosts when global accuracy exceeds individual accuracy." },
      { heading: "Decision Templates", body: "Create reusable decision frameworks with configurable thresholds, metrics, and rules. Templates can be shared across agents in the same team." },
      { heading: "Feedback Stages", body: "The feedback pipeline tracks events through stages: action → outcome → global_update. Each stage records reinforcement deltas that adjust agent behavior." },
      { heading: "Team Assignment", body: "Assign agents to teams for collaborative access. Team members can view and manage shared agents based on their role (owner, admin, member)." },
    ],
    code: `// Configure an agent with custom settings
const { data } = await supabase
  .from('agents')
  .update({
    domain: 'ecommerce_fraud',
    status: 'active',
    description: 'High-volume e-commerce fraud detection with cross-domain learning',
  })
  .eq('id', agentId)
  .select()
  .single();

// Create a decision template
await supabase.from('decision_templates').insert({
  name: 'High-Value Transaction Review',
  decision_type: 'fraud_check',
  user_id: userId,
  agent_id: agentId,
  config: { threshold: 75, auto_reject_above: 90 },
  metrics: [
    { name: 'risk_score', weight: 0.6 },
    { name: 'velocity', weight: 0.4 }
  ],
});`,
  },
  {
    id: "integrations",
    icon: Workflow,
    title: "Integrations",
    desc: "Connect with your existing tools — Slack, Zapier, webhooks, and custom APIs.",
    content: [
      { heading: "Webhook Notifications", body: "Configure outbound webhooks to receive real-time alerts when anomalies are detected, agent performance drops, or errors occur. Supports HMAC signing for security." },
      { heading: "Inbound Webhook API", body: "POST transaction data to /functions/v1/webhook with your API key. Supports agent_event, transaction, and learning_update event types." },
      { heading: "REST API", body: "Full CRUD access to all resources via the Supabase client SDK. Compatible with any language that supports HTTP requests." },
      { heading: "Realtime Subscriptions", body: "Subscribe to live database changes using Supabase Realtime. Get instant updates when agents learn, transactions are scored, or insights are generated." },
      { heading: "Export & Reporting", body: "Export transaction data as CSV from the Analytics page. Schedule periodic reports via webhook integrations." },
    ],
    code: `// Set up a webhook for anomaly alerts
await supabase.from('webhook_configs').insert({
  user_id: userId,
  name: 'Slack Alert Hook',
  url: 'https://hooks.slack.com/services/T00/B00/xxxx',
  events: ['anomaly', 'performance_drop', 'agent_error'],
  secret: 'whsec_your_signing_secret',
});

// Listen to real-time agent events
const channel = supabase
  .channel('agent-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_events',
  }, (payload) => {
    console.log('New event:', payload.new);
  })
  .subscribe();`,
  },
  {
    id: "guides",
    icon: FileText,
    title: "Guides & Tutorials",
    desc: "Step-by-step tutorials for common use cases across industries.",
    content: [
      { heading: "E-Commerce Fraud Detection", body: "Build a fraud detection pipeline that scores transactions in real-time, learns from outcomes, and shares patterns across your merchant network. Start with Seed Demo → Score → Record Outcomes → Propagate." },
      { heading: "Cross-Domain Intelligence Transfer", body: "Set up agents in multiple domains (e.g. e-commerce + fintech) and use the 'Detect Transfers' action to identify patterns that transfer across industries. Shared insights appear in the Intelligence page." },
      { heading: "PayLaterr Risk Assessment", body: "Use the PayLaterr module for buy-now-pay-later risk scoring. Seed PayLaterr data, build a knowledge graph of customer behavior, and run AI-powered risk assessments." },
      { heading: "Team Collaboration", body: "Create a team, invite members, and assign agents to the team. Team members can view shared agents and their intelligence, enabling collaborative fraud operations across departments." },
      { heading: "End-to-End Demo Walkthrough", body: "Use the 'Run Demo' wizard on the Dashboard to walk through the complete Synapse learning cycle: Seed → Score → Outcomes → Intelligence → ROI Measurement. Each step executes real AI-powered operations." },
    ],
    code: `// End-to-end fraud detection pipeline

// Step 1: Seed demo data
await supabase.functions.invoke('seed-paylaterr', {
  body: { action: 'seed_all', user_count: 20, txns_per_user: 6 }
});

// Step 2: Batch score all pending transactions
await supabase.functions.invoke('score-transaction', {
  body: { action: 'score_batch' }
});

// Step 3: Propagate learnings across the network
await supabase.functions.invoke('network-intelligence', {
  body: { action: 'propagate_learnings' }
});

// Step 4: Detect cross-domain transfers
await supabase.functions.invoke('network-intelligence', {
  body: { action: 'detect_transfers' }
});

// Step 5: Measure ROI
const { data } = await supabase.functions.invoke('network-intelligence', {
  body: { action: 'ab_performance' }
});
console.log('Accuracy improvement:', data.improvement.accuracy);`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground h-7 w-7"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const active = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <AnimatePresence mode="wait">
            {!active ? (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">Documentation</h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Everything you need to deploy, configure, and scale your AI agents on the Synapse network.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      onClick={() => setActiveSection(s.id)}
                      className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors cursor-pointer group"
                    >
                      <s.icon className="w-8 h-8 text-primary mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key={active.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} className="mb-6 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Docs
                </Button>

                <div className="flex items-center gap-3 mb-8">
                  <active.icon className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">{active.title}</h1>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Content */}
                  <div className="lg:col-span-3 space-y-6">
                    {active.content.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-lg border border-border bg-card p-5"
                      >
                        <h3 className="font-semibold text-foreground mb-2">{item.heading}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Code example */}
                  <div className="lg:col-span-2">
                    <div className="sticky top-24">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Code Example</h3>
                      <div className="relative rounded-xl border border-border bg-muted/50 p-4 overflow-x-auto">
                        <CopyButton text={active.code} />
                        <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">{active.code}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DocsPage;