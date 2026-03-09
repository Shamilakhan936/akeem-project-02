import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Handshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { savePendingEnterprisePartner } from "@/utils/enterprisePartner";

const companySizes = ["1-10", "11-50", "51-200", "200+"];
const useCases = [
  "Fraud detection",
  "Risk operations",
  "Revenue intelligence",
  "Shared agent workflows",
];
const timelines = ["This month", "This quarter", "Next quarter"];

const steps = [
  {
    title: "Tell us about your team",
    description: "We’ll shape the setup for enterprise partners from day one.",
  },
  {
    title: "What are you building first?",
    description: "Pick the highest-value use case so your workspace starts focused.",
  },
  {
    title: "Choose your rollout pace",
    description: "We’ll tailor the next step based on how fast your team wants to launch.",
  },
];

type EnterpriseOnboardingData = {
  companyName: string;
  fullName: string;
  teamSize: string;
  primaryUseCase: string;
  timeline: string;
};

const EnterpriseOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<EnterpriseOnboardingData>({
    companyName: "",
    fullName: "",
    teamSize: "",
    primaryUseCase: "",
    timeline: "",
  });

  const canContinue =
    step === 0
      ? Boolean(data.companyName.trim() && data.fullName.trim() && data.teamSize)
      : step === 1
        ? Boolean(data.primaryUseCase)
        : Boolean(data.timeline);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    savePendingEnterprisePartner(data);
    navigate("/signup", {
      state: {
        enterpriseOnboarding: data,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto flex min-h-screen items-center px-6 py-24">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Handshake className="h-4 w-4" />
              Enterprise partner onboarding
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                Start building with a rollout path made for enterprise teams.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Answer three quick questions and we’ll send you into account setup with the right context for pilots, shared intelligence, and secure deployment.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/70 p-5">
                <Building2 className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Partner-ready setup</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Align your workspace around company profile, team shape, and initial deployment scope.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/70 p-5">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Enterprise-first motion</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  New partners land in a guided flow instead of a generic signup screen.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur"
          >
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Step {step + 1} of {steps.length}</span>
                <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
              </div>
              <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{steps[step].title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{steps[step].description}</p>
              </div>
            </div>

            <div className="space-y-5">
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company name</Label>
                    <Input
                      id="company-name"
                      value={data.companyName}
                      onChange={(event) => setData((current) => ({ ...current, companyName: event.target.value }))}
                      placeholder="Acme Financial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Your name</Label>
                    <Input
                      id="full-name"
                      value={data.fullName}
                      onChange={(event) => setData((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="Jordan Lee"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Team size</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {companySizes.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={data.teamSize === size ? "default" : "outline"}
                          className="justify-center"
                          onClick={() => setData((current) => ({ ...current, teamSize: size }))}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <div className="grid gap-3">
                  {useCases.map((useCase) => (
                    <button
                      key={useCase}
                      type="button"
                      onClick={() => setData((current) => ({ ...current, primaryUseCase: useCase }))}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        data.primaryUseCase === useCase
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm font-medium">{useCase}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid gap-3">
                    {timelines.map((timeline) => (
                      <Button
                        key={timeline}
                        type="button"
                        variant={data.timeline === timeline ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setData((current) => ({ ...current, timeline }))}
                      >
                        {timeline}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">Partner summary</p>
                    <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-4">
                        <dt>Company</dt>
                        <dd className="text-right text-foreground">{data.companyName}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt>Team size</dt>
                        <dd className="text-right text-foreground">{data.teamSize}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt>Use case</dt>
                        <dd className="text-right text-foreground">{data.primaryUseCase}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (step === 0 ? navigate(-1) : setStep((current) => current - 1))}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 0 ? "Back" : "Previous"}
              </Button>
              <Button type="button" onClick={handleNext} disabled={!canContinue}>
                {step === steps.length - 1 ? "Create partner account" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseOnboarding;
