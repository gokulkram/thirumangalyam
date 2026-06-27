import { create } from "zustand";
import type { MatchCard } from "@/types";

interface MatchState {
  dailyMatches: MatchCard[];
  newMatches: MatchCard[];
  starMatches: MatchCard[];
  shortlist: Set<string>;
  loading: boolean;
  setDailyMatches: (matches: MatchCard[]) => void;
  setNewMatches: (matches: MatchCard[]) => void;
  setStarMatches: (matches: MatchCard[]) => void;
  toggleShortlist: (profileId: string) => Promise<void>;
  isShortlisted: (profileId: string) => boolean;
  fetchMatches: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  dailyMatches: [],
  newMatches: [],
  starMatches: [],
  shortlist: new Set(),
  loading: false,
  setDailyMatches: (dailyMatches) => set({ dailyMatches }),
  setNewMatches: (newMatches) => set({ newMatches }),
  setStarMatches: (starMatches) => set({ starMatches }),

  fetchMatches: async () => {
    set({ loading: true });
    try {
      const [matchRes, shortlistRes] = await Promise.all([
        fetch("/api/matches?page=1&limit=30"),
        fetch("/api/shortlist"),
      ]);

      if (matchRes.ok) {
        const data = await matchRes.json();
        const profiles: MatchCard[] = data.profiles || [];
        set({ dailyMatches: profiles.slice(0, 10) });
        set({ newMatches: profiles.filter((p) => p.isOnline).slice(0, 10) });
        set({ starMatches: profiles.filter((p) => (p.compatibilityScore ?? 0) > 50).slice(0, 10) });
      }

      if (shortlistRes.ok) {
        const data = await shortlistRes.json();
        const ids = (data.shortlist || []).map((s: any) => s.shortlistedUserId?.toString() || s.id);
        set({ shortlist: new Set(ids) });
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      set({ loading: false });
    }
  },

  toggleShortlist: async (userId) => {
    const wasShortlisted = get().shortlist.has(userId);

    // Optimistic update keyed by userId
    set((state) => {
      const next = new Set(state.shortlist);
      if (wasShortlisted) next.delete(userId);
      else next.add(userId);
      return { shortlist: next };
    });

    try {
      const res = await fetch("/api/shortlist", {
        method: wasShortlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlistedUserId: userId }),
      });
      if (!res.ok) throw new Error("Failed to update shortlist");
    } catch (err) {
      console.error("Shortlist toggle error:", err);
      // Revert on failure
      set((state) => {
        const next = new Set(state.shortlist);
        if (wasShortlisted) next.add(userId);
        else next.delete(userId);
        return { shortlist: next };
      });
    }
  },

  isShortlisted: (userId) => get().shortlist.has(userId),
}));
