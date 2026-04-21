import { create } from "zustand";
import type { Interest } from "@/types";

interface InterestState {
  received: Interest[];
  sent: Interest[];
  accepted: Interest[];
  loading: boolean;
  setReceived: (interests: Interest[]) => void;
  setSent: (interests: Interest[]) => void;
  setAccepted: (accepted: Interest[]) => void;
  acceptInterest: (id: string) => Promise<void>;
  declineInterest: (id: string) => Promise<void>;
  withdrawInterest: (id: string) => Promise<void>;
  fetchInterests: () => Promise<void>;
}

export const useInterestStore = create<InterestState>((set, get) => ({
  received: [],
  sent: [],
  accepted: [],
  loading: false,
  setReceived: (received) => set({ received }),
  setSent: (sent) => set({ sent }),
  setAccepted: (accepted) => set({ accepted }),

  fetchInterests: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/interests");
      if (!res.ok) throw new Error("Failed to fetch interests");
      const data = await res.json();
      set({
        received: data.received || [],
        sent: data.sent || [],
        accepted: data.accepted || [],
      });
    } catch (err) {
      console.error("Failed to fetch interests:", err);
    } finally {
      set({ loading: false });
    }
  },

  acceptInterest: async (id: string) => {
    // Optimistic update
    set((state) => ({
      received: state.received.map((i) =>
        i.id === id ? { ...i, status: "accepted" as const } : i
      ),
    }));
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept interest");
    } catch (err) {
      console.error("Accept interest error:", err);
      // Revert on failure
      set((state) => ({
        received: state.received.map((i) =>
          i.id === id ? { ...i, status: "pending" as const } : i
        ),
      }));
    }
  },

  declineInterest: async (id: string) => {
    set((state) => ({
      received: state.received.map((i) =>
        i.id === id ? { ...i, status: "declined" as const } : i
      ),
    }));
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed to decline interest");
    } catch (err) {
      console.error("Decline interest error:", err);
      set((state) => ({
        received: state.received.map((i) =>
          i.id === id ? { ...i, status: "pending" as const } : i
        ),
      }));
    }
  },

  withdrawInterest: async (id: string) => {
    set((state) => ({
      sent: state.sent.map((i) =>
        i.id === id ? { ...i, status: "withdrawn" as const } : i
      ),
    }));
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to withdraw interest");
    } catch (err) {
      console.error("Withdraw interest error:", err);
      set((state) => ({
        sent: state.sent.map((i) =>
          i.id === id ? { ...i, status: "pending" as const } : i
        ),
      }));
    }
  },
}));
