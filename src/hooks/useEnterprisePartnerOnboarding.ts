import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearPendingEnterprisePartner,
  getPendingEnterprisePartner,
} from "@/utils/enterprisePartner";

export type EnterprisePartnerOnboardingRecord = {
  id: string;
  user_id: string;
  company_name: string;
  team_size: string;
  primary_use_case: string;
  deployment_timeline: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PartnerHandoffRecord = {
  id: string;
  user_id: string;
  enterprise_onboarding_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  team_size: string;
  primary_use_case: string;
  deployment_timeline: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export const useEnterprisePartnerOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasAttemptedSync = useRef(false);
  const pendingPartnerData = getPendingEnterprisePartner();
  const isEnterpriseAuthProfile = user?.user_metadata?.partner_tier === "enterprise";

  const { data: onboarding, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ["enterprise-partner-onboarding", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_partner_onboarding")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as EnterprisePartnerOnboardingRecord | null;
    },
    enabled: !!user,
  });

  const { data: handoff, isLoading: isLoadingHandoff } = useQuery({
    queryKey: ["partner-handoff", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_handoffs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PartnerHandoffRecord | null;
    },
    enabled: !!user,
  });

  const syncPartnerOnboarding = useMutation({
    mutationFn: async () => {
      if (!user || !pendingPartnerData) return null;

      const { data: onboardingRecord, error: onboardingError } = await supabase
        .from("enterprise_partner_onboarding")
        .upsert(
          {
            user_id: user.id,
            company_name: pendingPartnerData.companyName,
            team_size: pendingPartnerData.teamSize,
            primary_use_case: pendingPartnerData.primaryUseCase,
            deployment_timeline: pendingPartnerData.timeline,
            source: "website_onboarding",
            status: "submitted",
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (onboardingError) throw onboardingError;

      const { data: existingHandoff, error: handoffLookupError } = await supabase
        .from("partner_handoffs")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (handoffLookupError) throw handoffLookupError;

      if (!existingHandoff) {
        const { error: handoffError } = await supabase.from("partner_handoffs").insert({
          user_id: user.id,
          enterprise_onboarding_id: onboardingRecord.id,
          company_name: pendingPartnerData.companyName,
          contact_name: pendingPartnerData.fullName,
          contact_email: user.email ?? null,
          team_size: pendingPartnerData.teamSize,
          primary_use_case: pendingPartnerData.primaryUseCase,
          deployment_timeline: pendingPartnerData.timeline,
          status: "new",
        });

        if (handoffError) throw handoffError;
      }

      const { data: existingNotification, error: notificationLookupError } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_type", "enterprise_partner_handoff")
        .limit(1)
        .maybeSingle();

      if (notificationLookupError) throw notificationLookupError;

      if (!existingNotification) {
        const { error: notificationError } = await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Enterprise onboarding received",
          message: `We queued a partner handoff for ${pendingPartnerData.companyName} and tailored your workspace for ${pendingPartnerData.primaryUseCase}.`,
          event_type: "enterprise_partner_handoff",
          agent_id: null,
        });

        if (notificationError) throw notificationError;
      }

      clearPendingEnterprisePartner();
      return onboardingRecord as EnterprisePartnerOnboardingRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprise-partner-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["partner-handoff"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      hasAttemptedSync.current = false;
    },
  });

  useEffect(() => {
    hasAttemptedSync.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isEnterpriseAuthProfile || !pendingPartnerData || hasAttemptedSync.current) return;
    hasAttemptedSync.current = true;
    syncPartnerOnboarding.mutate();
  }, [isEnterpriseAuthProfile, pendingPartnerData, syncPartnerOnboarding, user]);

  return {
    onboarding,
    handoff,
    isEnterprisePartner: Boolean(onboarding || (pendingPartnerData && isEnterpriseAuthProfile)),
    isLoading: isLoadingOnboarding || isLoadingHandoff || syncPartnerOnboarding.isPending,
  };
};
