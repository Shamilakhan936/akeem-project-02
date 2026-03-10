import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Ready to join the</span>
            <br />
            <span className="text-gradient-accent">collective?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Deploy your first agent in minutes. Start learning from thousands of agents already in the network.
          </p>
          <Button variant="hero" size="lg" className="px-10 py-6" asChild>
            <Link to="/start-building">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <p className="text-muted-foreground text-sm mt-6">
            No credit card required · 10K free agent-hours
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
