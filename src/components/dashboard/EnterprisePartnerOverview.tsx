import { Building2, CheckCircle2, CircleDashed, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  EnterprisePartnerOnboardingRecord,
  PartnerHandoffRecord,
} from "@/hooks/useEnterprisePartnerOnboarding";

type EnterprisePartnerOverviewProps = {
  onboarding: EnterprisePartnerOnboardingRecord;
  handoff: PartnerHandoffRecord | null | undefined;
  agentsCount: number;
  teamsCount: number;
  onCreateAgent: () => void;
  onInviteTeam: () => void;
};

export function EnterprisePartnerOverview({
  onboarding,
  handoff,
  agentsCount,
  teamsCount,
  onCreateAgent,
  onInviteTeam,
}: EnterprisePartnerOverviewProps) {
  const checklist = [
    {
      title: `Partner profile captured for ${onboarding.company_name}`,
      description: `Your ${onboarding.primary_use_case} onboarding details are saved in the backend.`,
      complete: true,
      actionLabel: null,
      action: null,
    },
    {
      title: `Launch your first ${onboarding.primary_use_case.toLowerCase()} agent`,
      description: `Get the first workflow live so the team can validate value during ${onboarding.deployment_timeline.toLowerCase()}.`,
      complete: agentsCount > 0,
      actionLabel: agentsCount > 0 ? null : "Create agent",
      action: agentsCount > 0 ? null : onCreateAgent,
    },
    {
      title: `Invite your core ${onboarding.team_size} delivery team`,
      description: "Bring the initial stakeholders into the workspace so rollout stays coordinated.",
      complete: teamsCount > 0,
      actionLabel: teamsCount > 0 ? null : "Open teams",
      action: teamsCount > 0 ? null : onInviteTeam,
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Enterprise partner workspace
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Welcome, {onboarding.company_name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your workspace is tailored for {onboarding.primary_use_case.toLowerCase()} with a {onboarding.deployment_timeline.toLowerCase()} rollout plan.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Partner handoff</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Rocket className="h-4 w-4 text-primary" />
            <span>{handoff ? `Queued · ${handoff.status}` : "Preparing handoff"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {checklist.map((item) => {
          const StatusIcon = item.complete ? CheckCircle2 : CircleDashed;

          return (
            <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
                <StatusIcon className={`h-5 w-5 shrink-0 ${item.complete ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              {item.actionLabel && item.action && (
                <Button variant="outline" size="sm" className="mt-4" onClick={item.action}>
                  {item.title.includes("delivery team") && <Users className="h-4 w-4" />}
                  {item.actionLabel}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
