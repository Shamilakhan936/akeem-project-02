import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Globe, Zap, Target } from "lucide-react";

const values = [
  { icon: Users, title: "Collective Over Individual", desc: "We believe AI agents are more powerful when they learn together. Every deployment strengthens the entire network." },
  { icon: Globe, title: "Cross-Domain Intelligence", desc: "Intelligence shouldn't be siloed. Patterns in one industry can unlock breakthroughs in another." },
  { icon: Zap, title: "Compounding Returns", desc: "Our flywheel effect means the more agents join, the smarter every agent becomes — exponential improvement." },
  { icon: Target, title: "Mission-Driven", desc: "We're building the infrastructure for the next era of AI — where machines don't just compute, they collaborate." },
];

const AboutPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-foreground">About </span>
            <span className="text-gradient-primary">Synapse</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We're building the collective intelligence layer for AI agents. A network where every agent deployed makes the entire swarm smarter, creating compounding returns across industries.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <v.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Join the collective</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            We're always looking for brilliant minds who want to shape the future of AI collaboration.
          </p>
          <Button variant="hero" size="lg" className="px-8 py-6" asChild>
            <Link to="/signup">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
    <Footer />
  </div>
);

export default AboutPage;
