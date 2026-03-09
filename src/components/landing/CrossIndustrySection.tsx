import { motion } from "framer-motion";
import { ShoppingCart, Landmark, Truck, Heart, Monitor, Factory } from "lucide-react";

const industries = [
  { icon: ShoppingCart, name: "E-commerce" },
  { icon: Landmark, name: "Banking" },
  { icon: Truck, name: "Logistics" },
  { icon: Heart, name: "Healthcare" },
  { icon: Monitor, name: "SaaS" },
  { icon: Factory, name: "Manufacturing" },
];

const examples = [
  {
    from: "E-commerce",
    to: "Fintech",
    insight: "A fraud behavior pattern detected in e-commerce predicts anomalies in financial transactions.",
  },
  {
    from: "Logistics",
    to: "SaaS",
    insight: "A pricing optimization pattern in logistics informs dynamic pricing agents in SaaS platforms.",
  },
];

const CrossIndustrySection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Intelligence that</span>{" "}
            <span className="text-gradient-accent">transcends verticals</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Imagine 10,000 agents across six industries. Patterns flow between domains that would never connect otherwise.
          </p>
        </motion.div>

        {/* Industry pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {industries.map((ind, i) => (
            <motion.div
              key={ind.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card"
            >
              <ind.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{ind.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Cross-domain examples */}
        <div className="grid md:grid-cols-2 gap-6">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{ex.from}</span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{ex.to}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{ex.insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrossIndustrySection;
