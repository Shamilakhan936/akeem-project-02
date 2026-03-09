import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const posts = [
  {
    title: "How Cross-Domain Learning Changes AI Forever",
    excerpt: "When a fraud detection agent in e-commerce discovers a pattern, how does that improve pricing agents in SaaS? Here's the science behind it.",
    date: "Feb 28, 2026",
    tag: "Research",
  },
  {
    title: "Introducing the Synapse Knowledge Graph",
    excerpt: "Our shared knowledge graph now maps over 2 billion entity relationships across 10,000+ agents. Here's what we've learned.",
    date: "Feb 20, 2026",
    tag: "Product",
  },
  {
    title: "Building Your First Agent Swarm",
    excerpt: "A step-by-step guide to deploying a fleet of AI agents that share intelligence and improve collectively.",
    date: "Feb 12, 2026",
    tag: "Tutorial",
  },
  {
    title: "The Compounding Intelligence Flywheel",
    excerpt: "More agents → more data → smarter models → better ROI → more adoption. Why network effects make Synapse unstoppable.",
    date: "Feb 5, 2026",
    tag: "Strategy",
  },
  {
    title: "Enterprise Security for AI Agent Networks",
    excerpt: "How we ensure SOC 2 compliance, end-to-end encryption, and granular access controls across the entire swarm.",
    date: "Jan 29, 2026",
    tag: "Security",
  },
  {
    title: "Agent Performance Benchmarks: Q1 2026",
    excerpt: "Detailed performance benchmarks across industries showing 47% improvement in decision accuracy through shared learning.",
    date: "Jan 22, 2026",
    tag: "Research",
  },
];

const tagColors: Record<string, string> = {
  Research: "bg-primary/10 text-primary",
  Product: "bg-accent/10 text-accent",
  Tutorial: "bg-primary/10 text-primary",
  Strategy: "bg-accent/10 text-accent",
  Security: "bg-muted text-muted-foreground",
};

const BlogPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights on collective AI intelligence, agent swarms, and the future of autonomous systems.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[post.tag] ?? "bg-muted text-muted-foreground"}`}>
                  {post.tag}
                </span>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default BlogPage;
