import { motion } from "framer-motion";
import { Network, TrendingUp, Shield, Clock, GitBranch } from "lucide-react";

const graphMaps = [
  { icon: GitBranch, label: "Behavior patterns" },
  { icon: Network, label: "Entity relationships" },
  { icon: Shield, label: "Risk clusters" },
  { icon: TrendingUp, label: "Strategic patterns" },
  { icon: Clock, label: "Temporal sequences" },
];

const growthOutcomes = [
  "Prediction accuracy improves",
  "Strategy optimization improves",
  "Rare-event detection improves",
];

const KnowledgeGraphSection = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <span className="text-xs text-accent font-medium tracking-wider uppercase">Layer 4</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Cross-Agent</span>{" "}
            <span className="text-gradient-accent">Knowledge Graph</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A shared graph mapping intelligence across every agent. This becomes defensible infrastructure.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">The Graph Maps</h3>
            <div className="space-y-3">
              {graphMaps.map((g) => (
                <div key={g.label} className="flex items-center gap-3">
                  <g.icon className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm text-muted-foreground">{g.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">As the Graph Grows…</h3>
            <div className="space-y-4">
              {growthOutcomes.map((outcome, i) => (
                <div key={outcome} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-foreground text-sm font-medium">{outcome}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default KnowledgeGraphSection;
