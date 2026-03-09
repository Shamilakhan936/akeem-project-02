import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type EnterpriseOnboardingState = {
  companyName: string;
  fullName: string;
  teamSize: string;
  primaryUseCase: string;
  timeline: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const onboardingData = (location.state as { enterpriseOnboarding?: EnterpriseOnboardingState } | null)?.enterpriseOnboarding;
  const isEnterprisePartner = Boolean(onboardingData);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(onboardingData?.fullName ?? "");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          ...(onboardingData
            ? {
                company_name: onboardingData.companyName,
                team_size: onboardingData.teamSize,
                primary_use_case: onboardingData.primaryUseCase,
                deployment_timeline: onboardingData.timeline,
                partner_tier: "enterprise",
              }
            : {}),
        },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account!");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Brain className="w-7 h-7 text-primary" />
            <span className="font-bold text-xl text-foreground">Synapse</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isEnterprisePartner ? "Create your partner account" : "Create your account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEnterprisePartner
              ? `Continue setup for ${onboardingData?.companyName} with enterprise onboarding already configured.`
              : "Start building intelligent agents"}
          </p>
          {isEnterprisePartner && (
            <p className="text-xs text-primary mt-3">
              {onboardingData?.teamSize} team · {onboardingData?.primaryUseCase}
            </p>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
