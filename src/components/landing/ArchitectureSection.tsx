import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Deploy Agent",
    description: "Define your agent's domain, capabilities, and goals. Deploy in seconds with our SDK.",
  },
  {
    num: "02",
    title: "Encode Behavior",
    description: "As your agent operates, its decision patterns are encoded into behavioral embeddings.",
  },
  {
    num: "03",
    title: "Share & Learn",
    description: "Embeddings flow through the collective layer. Your agent absorbs strategies from the entire network.",
  },
  {
    num: "04",
    title: "Evolve Together",
    description: "Cross-domain feedback loops create emergent capabilities no single agent could develop alone.",
  },
];

const ArchitectureSection = () => {
  return (
    <section className="py-32 relative" id="architecture">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            The 4-Layer Architecture
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From autonomous agents to collective intelligence — built to compound.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent hidden md:block" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex gap-6 items-start"
              >
                <div className={`text-2xl font-bold shrink-0 w-14 text-right ${i < 2 ? "text-primary" : "text-accent"}`}>
                  {step.num}
                </div>
                <div className="pb-2">
                  <h3 className="text-xl font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
