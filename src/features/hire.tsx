import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AgentPortrait } from "@/components/melo/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMelo } from "@/lib/melo/store";
import type { MarketplaceAgent } from "@/lib/melo/types";

export function HirePage() {
  const market = useMelo((s) => s.marketplace);
  const hired = useMelo((s) => s.agents);
  const hire = useMelo((s) => s.hireSpecialist);
  const [preview, setPreview] = useState<MarketplaceAgent | null>(null);
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Hire</h1>
        <p className="text-sm text-muted-foreground">Specialists preview against Northside Plumbing data before they join the firm. Hired AI agents can handle calls, not just writing.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {market.map((m) => {
          const already = hired.some((a) => a.marketplaceId === m.id);
          return (
            <article key={m.id} className="flex flex-col rounded-xl border border-border bg-canvas p-4">
              <div className="flex gap-3">
                <AgentPortrait agent={m} size={56} />
                <div>
                  <h2 className="font-semibold">{m.name}</h2>
                  <div className="text-xs text-muted-foreground">{m.role}{m.pack ? ` · ${m.pack}` : ""}</div>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{m.blurb}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreview(m)}>
                  Preview
                </Button>
                <Button size="sm" disabled={already} onClick={() => hire(m.id)}>
                  {already ? "Hired" : "Hire"}
                </Button>
              </div>
            </article>
          );
        })}
        <article className="flex flex-col justify-between rounded-xl border border-dashed border-border bg-canvas p-4">
          <div>
            <h2 className="font-semibold">Create your own</h2>
            <p className="mt-3 text-sm text-muted-foreground">Name a specialist, pick tools and autopilot. Helix can assign them the same morning.</p>
          </div>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/app/firm" })}>
              Open Firm
            </Button>
          </div>
        </article>
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent>
          {preview ? (
            <>
              <DialogTitle>{preview.name}</DialogTitle>
              <DialogDescription>{preview.role} · preview on this workspace</DialogDescription>
              <div className="mt-3 flex gap-3">
                <AgentPortrait agent={preview} size={64} />
                <p className="text-sm leading-relaxed">{preview.preview}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    hire(preview.id);
                    setPreview(null);
                    void navigate({ to: "/app/firm" });
                  }}
                >
                  Hire to firm
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
