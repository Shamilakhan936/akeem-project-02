export type EnterprisePartnerDraft = {
  companyName: string;
  fullName: string;
  teamSize: string;
  primaryUseCase: string;
  timeline: string;
};

const ENTERPRISE_PARTNER_STORAGE_KEY = "enterprise-partner-onboarding";

export const getPendingEnterprisePartner = (): EnterprisePartnerDraft | null => {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(ENTERPRISE_PARTNER_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as EnterprisePartnerDraft;
  } catch {
    window.localStorage.removeItem(ENTERPRISE_PARTNER_STORAGE_KEY);
    return null;
  }
};

export const savePendingEnterprisePartner = (data: EnterprisePartnerDraft) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENTERPRISE_PARTNER_STORAGE_KEY, JSON.stringify(data));
};

export const clearPendingEnterprisePartner = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ENTERPRISE_PARTNER_STORAGE_KEY);
};
