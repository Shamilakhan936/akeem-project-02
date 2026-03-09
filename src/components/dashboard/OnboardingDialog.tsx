import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Bot, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getPendingEnterprisePartner } from "@/utils/enterprisePartner";

const steps = [
  {
    icon: Bot,
    title: "Create Your First Agent",
    description: "Agents are autonomous AI workers that operate in specific domains like fraud detection, customer support, or sales optimization.",
    tip: "💡 Tip: Use 'Seed Demo' on the dashboard to create sample agents instantly.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "Monitor your agents' activity, view analytics, and track learnings shared across your swarm intelligence network.",
    tip: "💡 Tip: Run 'AI Analysis' to generate cross-domain insights automatically.",
  },
  {
    icon: Sparkles,
    title: "Shared Intelligence",
    description: "As agents learn, their insights are shared across the network — creating a collective intelligence that improves every agent.",
    tip: "💡 Tip: Try the 'Run Demo' wizard to see the full end-to-end learning cycle.",
  },
];

export function OnboardingDialog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const { data: agents } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id").limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: enterpriseOnboarding, isLoading: enterpriseLoading } = useQuery({
    queryKey: ["enterprise-onboarding-check", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_partner_onboarding")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const isEnterpriseAuthProfile = user?.user_metadata?.partner_tier === "enterprise";
    const hasPendingEnterprisePartner = Boolean(getPendingEnterprisePartner());

    if (enterpriseLoading) return;

    if (enterpriseOnboarding || (isEnterpriseAuthProfile && hasPendingEnterprisePartner)) {
      setOpen(false);
      return;
    }

    if (agents && agents.length === 0) {
      const dismissed = localStorage.getItem(`onboarding-dismissed-${user?.id}`);
      if (!dismissed) setOpen(true);
    }
  }, [agents, enterpriseLoading, enterpriseOnboarding, user]);

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${user?.id}`, "true");
    setOpen(false);
  };

  const handleGetStarted = () => {
    handleDismiss();
    navigate("/dashboard/agents");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-primary" />
            <DialogTitle className="text-foreground">Welcome to Synapse</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Build your collective intelligence network
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-3"
          >
            {(() => {
              const Icon = steps[step].icon;
              return <Icon className="w-10 h-10 text-primary mx-auto" />;
            })()}
            <h3 className="font-semibold text-foreground text-lg">{steps[step].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{steps[step].description}</p>
            <p className="text-xs text-primary/80 mt-2">{steps[step].tip}</p>
          </motion.div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
            Skip
          </Button>
          {step < steps.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={handleGetStarted}>
              Create Your First Agent
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
