import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { uid } from "@/lib/utils";
import { createAdminSeed } from "./seed";
import type { AdminData, TicketStatus } from "./types";

type AdminState = AdminData & {
  selectedTicketId: string;
  replyTicket: (id: string, text: string) => void;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  selectTicket: (id: string) => void;
};

const seed = createAdminSeed();

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      ...seed,
      selectedTicketId: seed.tickets.find((t) => t.status === "open")?.id ?? seed.tickets[0]!.id,
      selectTicket: (id) => set({ selectedTicketId: id }),
      replyTicket: (id, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const now = new Date().toISOString();
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "waiting" as const,
                  updatedAt: now,
                  messages: [
                    ...t.messages,
                    { id: uid("tm"), at: now, from: "melo" as const, author: "Melo", text: trimmed },
                  ],
                }
              : t,
          ),
        }));
        toast.success("Reply sent");
      },
      setTicketStatus: (id, status) => {
        set((s) => ({
          tickets: s.tickets.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
        }));
        toast.success(status === "closed" ? "Ticket closed" : "Status updated");
      },
    }),
    {
      name: "melo-hq-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tenants: s.tenants,
        series: s.series,
        content: s.content,
        tickets: s.tickets,
        selectedTicketId: s.selectedTicketId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AdminData> & { selectedTicketId?: string };
        return {
          ...current,
          tenants: p.tenants?.length ? p.tenants : current.tenants,
          series: p.series?.length ? p.series : current.series,
          content: p.content?.length ? p.content : current.content,
          tickets: p.tickets?.length ? p.tickets : current.tickets,
          selectedTicketId: p.selectedTicketId ?? current.selectedTicketId,
        };
      },
    },
  ),
);

export function tenantName(id: string) {
  return useAdmin.getState().tenants.find((t) => t.id === id)?.name ?? id;
}
