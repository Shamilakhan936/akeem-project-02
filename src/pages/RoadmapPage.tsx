import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Target, ClipboardList, Bot, Brain, RefreshCw, BarChart3, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const phases = [
  {
    num: "01",
    icon: Target,
    title: "Industry & Pilot Selection",
    status: "active" as const,
    summary: "Pick one vertical, 1–3 companies willing to provide data.",
    details: [
      "Identify high-impact vertical with structured decision data (e.g., logistics, fintech, e-commerce)",
      "Recruit 1–3 pilot companies with measurable decision workflows",
      "Negotiate data-sharing agreements with clear privacy boundaries",
      "Define success criteria and timeline for the pilot phase",
    ],
  },
  {
    num: "02",
    icon: ClipboardList,
    title: "Define Decisions & Metrics",
    status: "active" as const,
    summary: "Map the exact decisions agents will make and how to measure them.",
    details: [
      "Fraud approval / rejection — precision, recall, false positive rate",
      "Route optimization — delivery time, fuel cost, on-time %",
      "Inventory restock — stockout rate, overstock cost, reorder accuracy",
      "Ad budget allocation — ROAS, CPA, conversion lift",
    ],
  },
  {
    num: "03",
    icon: Bot,
    title: "Build MVP Agent",
    status: "upcoming" as const,
    summary: "Simple ML baseline with structured logging for every decision.",
    details: [
      "Deploy a lightweight decision agent (gradient-boosted model or rules-based) per pilot company",
      "Instrument every decision with structured outcome logging — action, context, result, timestamp",
      "Establish a feedback collection pipeline: decision → outcome → labeled training signal",
      "Baseline performance metrics before network intelligence is applied",
    ],
  },
  {
    num: "04",
    icon: Brain,
    title: "Deploy Shared Intelligence Layer",
    status: "upcoming" as const,
    summary: "Aggregation, anonymization, embeddings, and the knowledge graph.",
    details: [
      "Aggregate decision outcomes and error corrections across pilot agents",
      "Apply anonymization and differential privacy before cross-company data enters the shared layer",
      "Generate behavioral embeddings from agent decision patterns",
      "Build the initial cross-agent knowledge graph — entities, relationships, temporal patterns",
    ],
  },
  {
    num: "05",
    icon: RefreshCw,
    title: "Implement Feedback Loops",
    status: "upcoming" as const,
    summary: "Local agents consume global intelligence and improve continuously.",
    details: [
      "Each agent pulls insights from the shared intelligence layer after every decision cycle",
      "Reinforcement learning updates refine local agent policies using global patterns",
      "Track per-agent improvement trajectories — before vs. after network intelligence",
      "Detect and surface cross-domain strategy transfers between pilot companies",
    ],
  },
  {
    num: "06",
    icon: BarChart3,
    title: "Measure & Improve",
    status: "upcoming" as const,
    summary: "Prove the value, then use results to attract more companies.",
    details: [
      "Decision accuracy improvement — target 15–30% over baseline",
      "ROI quantification — cost savings, revenue uplift, error reduction",
      "Rare-event detection rate — anomalies caught that individual agents missed",
      "Package results into case studies for next-wave customer acquisition",
    ],
  },
  {
    num: "07",
    icon: Rocket,
    title: "Scale Across Companies & Verticals",
    status: "future" as const,
    summary: "Activate cross-company network effects, then expand cross-industry.",
    details: [
      "Onboard 10+ companies in the initial vertical — network effects kick in",
      "Open the agent SDK for third-party developers to build on the intelligence layer",
      "Expand to adjacent verticals where cross-domain transfer creates immediate value",
      "Build the autonomous agent orchestration layer — agents that self-organize and coordinate",
    ],
  },
];

const statusConfig = {
  active: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  upcoming: { label: "Upcoming", className: "bg-muted text-muted-foreground border-border" },
  future: { label: "Future", className: "bg-accent/10 text-accent border-accent/20" },
};

const RoadmapPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <section className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <Rocket className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium tracking-wider uppercase">Launch Plan</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Go-To-Market Roadmap
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From pilot selection to cross-industry network effects — the 7-phase playbook.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/60 via-accent/30 to-transparent hidden md:block" />

          <Accordion type="multiple" defaultValue={["01", "02"]} className="space-y-4">
            {phases.map((phase, i) => {
              const status = statusConfig[phase.status];
              return (
                <motion.div
                  key={phase.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <AccordionItem value={phase.num} className="border border-border rounded-xl overflow-hidden bg-card">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4 text-left w-full pr-4">
                        <div className="relative z-10 w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <phase.icon className={`w-5 h-5 ${phase.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground">{phase.num}</span>
                            <h3 className="font-semibold text-foreground text-sm">{phase.title}</h3>
                            <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{phase.summary}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="pl-[60px] space-y-2">
                        {phase.details.map((detail, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <Button variant="default" size="lg" className="px-8 py-6 gap-2" asChild>
            <Link to="/signup">Join the Pilot Program <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>

    <Footer />
  </div>
);

export default RoadmapPage;
