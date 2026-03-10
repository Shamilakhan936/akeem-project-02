import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const flywheelSteps = [
  "More companies deploy agents",
  "More decisions are executed",
  "More outcomes are observed",
  "Models get smarter",
  "Agent accuracy improves",
  "ROI improves",
  "More companies join",
];

const FlywheelSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">The</span>{" "}
            <span className="text-accent">Flywheel</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Compounding intelligence. Each cycle makes the next one stronger.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Circular layout */}
          <div className="flex justify-center mb-8">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  <RefreshCw className="w-6 h-6 text-primary" />
                </motion.div>
              </div>

              {/* Steps around circle */}
              {flywheelSteps.map((step, i) => {
                const angle = (i / flywheelSteps.length) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const radius = 42; // percentage
                const x = 50 + radius * Math.cos(rad);
                const y = 50 + radius * Math.sin(rad);

                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="w-28 md:w-32 text-center">
                      <div className="text-xs font-bold text-primary mb-0.5">0{i + 1}</div>
                      <div className="text-xs md:text-sm text-foreground font-medium leading-tight">{step}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FlywheelSection;
