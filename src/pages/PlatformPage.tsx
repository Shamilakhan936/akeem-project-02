import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Bot, Brain, Zap, Network, Shield, Globe, ArrowRight } from "lucide-react";

const features = [
  { icon: Bot, title: "Autonomous Agents", desc: "Deploy domain-specific AI agents that act, decide, and learn independently across your workflows." },
  { icon: Brain, title: "Shared Intelligence", desc: "Every agent contributes to and benefits from a collective knowledge layer spanning all deployments." },
  { icon: Zap, title: "Real-time Feedback", desc: "Continuous reinforcement learning at network scale — every action creates structured feedback loops." },
  { icon: Network, title: "Knowledge Graph", desc: "A shared graph mapping behavior patterns, entity relationships, and strategic insights across industries." },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant infrastructure with end-to-end encryption and granular access controls." },
  { icon: Globe, title: "Cross-Industry Intelligence", desc: "Patterns detected in one vertical inform and improve agents across entirely different domains." },
];

const PlatformPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-foreground">The </span>
            <span className="text-gradient-primary">Platform</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Synapse is the infrastructure layer for collective AI intelligence. Deploy agents that get smarter with every interaction across the network.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"
            >
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="px-8 py-6" asChild>
            <Link to="/signup">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PlatformPage;
