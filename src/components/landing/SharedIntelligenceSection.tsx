import { motion } from "framer-motion";
import { Brain, AlertTriangle, GitMerge, BarChart3, Lightbulb } from "lucide-react";

const aggregates = [
  { icon: GitMerge, label: "Decision outcomes" },
  { icon: AlertTriangle, label: "Error corrections" },
  { icon: Brain, label: "Behavioral embeddings" },
  { icon: BarChart3, label: "Performance metrics" },
  { icon: Lightbulb, label: "Contextual metadata" },
];

const layerCapabilities = [
  "Learns cross-industry patterns",
  "Identifies anomaly clusters",
  "Detects emerging strategies",
  "Improves optimization policies",
];

const SharedIntelligenceSection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <span className="text-xs text-accent font-medium tracking-wider uppercase">Layer 2 — The Moat</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Shared</span>{" "}
            <span className="text-gradient-accent">Intelligence Layer</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            All agents connect to a central intelligence network. Every agent benefits from patterns discovered everywhere else.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* What it aggregates */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Network Aggregates</h3>
            <div className="space-y-3">
              {aggregates.map((a) => (
                <div key={a.label} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                    <a.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-muted-foreground">{a.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What it does */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-accent/20 bg-accent/5 p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">This Layer…</h3>
            <div className="space-y-3">
              {layerCapabilities.map((cap, i) => (
                <div key={cap} className="flex items-start gap-3">
                  <span className="text-accent font-bold text-sm mt-0.5">0{i + 1}</span>
                  <span className="text-foreground text-sm">{cap}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SharedIntelligenceSection;
