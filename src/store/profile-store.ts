import { create } from "zustand";
import type { Profile, PartnerPreferences } from "@/types";

interface ProfileState {
  profile: Profile | null;
  partnerPreferences: PartnerPreferences | null;
  onboardingStep: number;
  setProfile: (profile: Profile) => void;
  setPartnerPreferences: (prefs: PartnerPreferences) => void;
  setOnboardingStep: (step: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  partnerPreferences: null,
  onboardingStep: 1,
  setProfile: (profile) => set({ profile }),
  setPartnerPreferences: (partnerPreferences) => set({ partnerPreferences }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
}));
