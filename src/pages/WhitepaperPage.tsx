import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Layers, Brain, Network, Shield, Cpu, BarChart3, Rocket, Truck } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const WhitepaperPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="pt-32 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div {...fadeIn} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium tracking-wider uppercase">Research Paper</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Collective Intelligence Agent Networks
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Leveraging Agent-Driven Network Effects for Global Decision Optimization
          </p>
        </motion.div>
      </div>
    </section>

    {/* Content */}
    <section className="pb-24">
      <div className="container mx-auto px-6 max-w-3xl space-y-16">

        {/* Abstract */}
        <WPSection icon={BookOpen} label="Abstract">
          <p>
            This paper presents a framework for autonomous agents in companies that execute decisions and feed structured outcomes into a shared intelligence network. Every action improves the agent network globally. Insights from one industry or company accelerate learning across all others.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Introduction */}
        <WPSection icon={Layers} label="1 — Introduction">
          <h3 className="text-lg font-semibold text-foreground mb-2">The Limitations of Siloed AI</h3>
          <p>
            Traditional AI deployments operate in isolation — models trained on a single company's data, optimizing for narrow objectives. Knowledge stays locked within organizational boundaries, unable to benefit from patterns discovered elsewhere.
          </p>
          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Motivation for Distributed Agent Networks</h3>
          <p>
            By connecting autonomous agents across organizations and industries, we create a shared intelligence substrate where every decision, outcome, and correction contributes to a global learning loop. The result: agents that compound intelligence at network scale.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Architecture */}
        <WPSection icon={Cpu} label="2 — Architecture">
          <h3 className="text-lg font-semibold text-foreground mb-2">Local Agents & Shared Intelligence Layer</h3>
          <p>
            Each organization deploys domain-specific local agents (e.g., Sales, Fraud Detection, Logistics). These agents operate autonomously, making decisions within their defined scope. Their structured outcomes — decision results, error corrections, behavioral embeddings — flow into a centralized Shared Intelligence Layer.
          </p>
          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Feedback Loop Engine</h3>
          <p>
            Every agent action triggers a continuous reinforcement cycle: Action → Outcome → Reinforcement Update → Global Update → Policy Refinement → Propagation to All Agents. This creates a system where the network becomes smarter with every interaction.
          </p>
          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Cross-Agent Knowledge Graph</h3>
          <p>
            A shared graph maps behavior patterns, entity relationships, risk clusters, strategic patterns, and temporal sequences across every agent in the network. As the graph grows, prediction accuracy, strategy optimization, and rare-event detection all improve.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Learning Algorithms */}
        <WPSection icon={Brain} label="3 — Learning Algorithms">
          <h3 className="text-lg font-semibold text-foreground mb-2">Core Methods</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><span className="text-foreground font-medium">Reinforcement Learning</span> — Agents learn optimal policies from outcome feedback across the network.</li>
            <li><span className="text-foreground font-medium">Graph Neural Networks</span> — Encode relational structure from the cross-agent knowledge graph for pattern detection.</li>
            <li><span className="text-foreground font-medium">Transformers</span> — Process sequential decision data and contextual metadata at scale.</li>
          </ul>
          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Privacy-Preserving Learning</h3>
          <p>
            Federated learning ensures models are trained across distributed data without raw data ever leaving organizational boundaries. Differential privacy guarantees prevent reverse-engineering of individual contributions.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Network Effects */}
        <WPSection icon={Network} label="4 — Network Effects & Moat">
          <h3 className="text-lg font-semibold text-foreground mb-2">Agent Proliferation → Performance</h3>
          <p>
            Each new agent added to the network increases the diversity and volume of behavioral data. This creates compounding returns: more agents → richer patterns → better decisions → more agents. The intelligence layer becomes a defensible moat that grows with adoption.
          </p>
          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Cross-Domain Transfer</h3>
          <p>
            Patterns detected in one vertical — e.g., fraud behavior in e-commerce — directly inform and improve agents in entirely different domains like financial services or healthcare. This cross-pollination is impossible in siloed deployments.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Security */}
        <WPSection icon={Shield} label="5 — Security & Privacy">
          <p>
            The platform is built on SOC 2 compliant infrastructure with end-to-end encryption for all data in transit and at rest. Agent contributions are anonymized before entering the shared intelligence layer. Federated updates ensure that raw data never crosses organizational boundaries — only model gradients and behavioral embeddings are shared.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Implementation */}
        <WPSection icon={Cpu} label="6 — Implementation Details">
          <p>
            The system is built on a modern stack optimized for low-latency agent orchestration. Key components include distributed event streaming for real-time feedback propagation, vector storage for behavioral embeddings, a graph database for the cross-agent knowledge graph, and a feature engineering pipeline that continuously transforms raw outcomes into structured training signals.
          </p>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Use Cases — Supply Chain */}
        <WPSection icon={Truck} label="7 — Vertical Example: Supply Chain Optimization">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Problem</h4>
              <p className="text-sm text-muted-foreground">Logistics companies struggle with route optimization, inventory allocation, and predictive maintenance.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Local Agent Actions</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                <li>Route selection for trucks</li>
                <li>Inventory restocking decisions</li>
                <li>Predictive maintenance scheduling</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Shared Intelligence Layer</h4>
              <p className="text-sm text-muted-foreground">Aggregates historical route efficiency, warehouse load patterns, and equipment failure signals. Updates global supply chain optimization models.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Feedback Loop</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                <li>Route success/failure → outcome metrics → reinforcement learning update</li>
                <li>Inventory accuracy → restock timing optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Cross-Agent Knowledge Graph</h4>
              <p className="text-sm text-muted-foreground">Connects suppliers, warehouses, trucks, and events. Detects bottlenecks and patterns across companies.</p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
              <h4 className="text-sm font-semibold text-primary mb-1">Outcome</h4>
              <ul className="list-disc list-inside text-sm text-primary/80 space-y-0.5">
                <li>15–25% reduction in delivery delays</li>
                <li>Improved inventory efficiency</li>
                <li>Global learning across all participating companies</li>
              </ul>
            </div>
          </div>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Evaluation */}
        <WPSection icon={BarChart3} label="8 — Evaluation Metrics">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { metric: "Decision Accuracy", desc: "Measured against baseline single-agent performance across identical scenarios." },
              { metric: "ROI Improvement", desc: "Cost savings and revenue uplift attributed to network-enhanced agent decisions." },
              { metric: "Rare-Event Detection", desc: "Precision and recall for anomalies that individual agents would miss." },
            ].map((m) => (
              <div key={m.metric} className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-1">{m.metric}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </WPSection>

        <Separator className="opacity-30" />

        {/* Roadmap */}
        <WPSection icon={Rocket} label="9 — Roadmap & Future Work">
          <div className="space-y-3">
            {[
              { phase: "Open Agent SDK", desc: "A public SDK enabling any developer to deploy agents that plug into the collective intelligence network." },
              { phase: "Cross-Industry Expansion", desc: "Extending the knowledge graph to cover 10+ verticals with domain-specific agent templates." },
              { phase: "Autonomous Agent Orchestration", desc: "Agents that self-organize, delegate sub-tasks, and coordinate complex multi-step workflows without human intervention." },
            ].map((r, i) => (
              <div key={r.phase} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{r.phase}</h4>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </WPSection>

      </div>
    </section>

    <Footer />
  </div>
);

/* ── Reusable section wrapper ── */
function WPSection({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{label}</h2>
      </div>
      <div className="text-muted-foreground leading-relaxed space-y-3 pl-7">
        {children}
      </div>
    </motion.div>
  );
}

export default WhitepaperPage;
