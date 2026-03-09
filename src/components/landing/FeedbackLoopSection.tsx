import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  { label: "Agent Action", color: "text-primary" },
  { label: "Outcome", color: "text-primary" },
  { label: "Reinforcement Update", color: "text-accent" },
  { label: "Global Update", color: "text-accent" },
  { label: "Policy Refinement", color: "text-accent" },
  { label: "Propagation to All Agents", color: "text-primary" },
];

const FeedbackLoopSection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <span className="text-xs text-primary font-medium tracking-wider uppercase">Layer 3</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Feedback Loop Engine
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every action creates structured feedback. Continuous reinforcement learning at network scale.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2 md:gap-0"
        >
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="px-4 py-3 rounded-lg border border-border bg-card text-center">
                <span className={`text-sm font-medium ${step.color}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-primary font-medium">Continuous loop — every cycle makes the network smarter</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeedbackLoopSection;
