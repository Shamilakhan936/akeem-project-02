import { motion } from "framer-motion";
import { Bot, ShieldCheck, Package, DollarSign, Truck, Scale } from "lucide-react";

const agentTypes = [
  { icon: DollarSign, name: "Sales Optimization", domain: "Revenue" },
  { icon: ShieldCheck, name: "Fraud Detection", domain: "Security" },
  { icon: Package, name: "Procurement", domain: "Operations" },
  { icon: DollarSign, name: "Dynamic Pricing", domain: "Strategy" },
  { icon: Truck, name: "Supply Chain", domain: "Logistics" },
  { icon: Scale, name: "Legal Review", domain: "Compliance" },
];

const capabilities = [
  "Acts autonomously",
  "Makes decisions",
  "Executes workflows",
  "Collects outcome feedback",
];

const FeaturesSection = () => {
  return (
    <section className="py-16 relative" id="agents">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <span className="text-xs text-primary font-medium tracking-wider uppercase">Layer 1</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Local Autonomous</span>{" "}
            <span className="text-accent">Agents</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Each company deploys domain-specific AI agents that operate independently — making decisions, executing workflows, and learning from outcomes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {agentTypes.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <agent.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{agent.name}</h3>
                  <span className="text-xs text-muted-foreground">{agent.domain}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {capabilities.map((cap) => (
            <div
              key={cap}
              className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground"
            >
              <Bot className="w-3.5 h-3.5 inline mr-2 text-primary" />
              {cap}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
