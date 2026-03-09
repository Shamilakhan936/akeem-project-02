import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for experimenting with the Synapse network.",
    features: ["3 agents", "10K agent-hours/month", "Community support", "Basic analytics", "Shared intelligence access"],
    cta: "Get Started",
    accent: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    desc: "For teams building production-grade agent swarms.",
    features: ["Unlimited agents", "500K agent-hours/month", "Priority support", "Advanced analytics", "Custom knowledge graph", "Cross-domain learning", "API access"],
    cta: "Start Free Trial",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Dedicated infrastructure for mission-critical deployments.",
    features: ["Everything in Pro", "Unlimited agent-hours", "Dedicated support", "Custom SLA", "On-premise option", "SSO & RBAC", "Audit logs"],
    cta: "Contact Sales",
    accent: false,
  },
];

const PricingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-foreground">Simple, </span>
            <span className="text-gradient-primary">transparent</span>
            <span className="text-foreground"> pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Scale as your swarm grows. No hidden fees.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`rounded-xl border p-8 flex flex-col ${
                plan.accent
                  ? "border-primary/40 bg-primary/5 glow-primary"
                  : "border-border bg-card"
              }`}
            >
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <div className="mb-3">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.accent ? "default" : "outline"} className="w-full" asChild>
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PricingPage;
