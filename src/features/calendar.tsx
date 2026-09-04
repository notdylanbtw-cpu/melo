import { INDUSTRY_LABELS } from "@/lib/melo/terminology";
import { useMelo } from "@/lib/melo/store";
import { timeOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);
const DAY = "2026-09-03";
const ROW = 56;

function minsFromIso(iso: string) {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}
function top(iso: string) {
  return ((minsFromIso(iso) - 7 * 60) / 60) * ROW;
}
function height(start: string, end: string) {
  return Math.max(32, ((minsFromIso(end) - minsFromIso(start)) / 60) * ROW);
}

export function CalendarPage() {
  const allStaff = useMelo((s) => s.staff);
  const allJobs = useMelo((s) => s.jobs);
  const holds = useMelo((s) => s.holds);
  const industry = useMelo((s) => s.workspace.industry);
  const labels = INDUSTRY_LABELS[industry];
  const book = useMelo((s) => s.bookSlot);
  const navigate = useNavigate();
  const staff = allStaff.filter((x) => x.id !== "alex");
  const jobs = allJobs.filter((j) => j.scheduledStart?.startsWith(DAY) && j.assigneeId);
  const unscheduled = allJobs.filter((j) => !j.scheduledStart && j.stage !== "won");

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0">
      <div className="melo-scroll min-w-0 flex-1 overflow-auto p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Calendar</h1>
            <p className="text-sm text-muted-foreground">Thursday 3 Sep 2026 · staff week · {labels.jobs.toLowerCase()} and travel buffers</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => {
              const slug = "northside";
              const url = `${window.location.origin}/book/${slug}`;
              void navigator.clipboard.writeText(url);
              toast.success("Booking link copied");
            }}
          >
            Copy booking link
          </button>
        </div>
        {unscheduled.length ? (
          <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
            {unscheduled.map((j) => (
              <button
                key={j.id}
                type="button"
                className="min-w-48 rounded-lg border border-border bg-canvas p-3 text-left"
                onClick={() => book("sam", "2026-09-04T09:00:00+10:00", j.id)}
              >
                <div className="text-sm font-medium">{j.title}</div>
                <div className="text-xs text-primary">{labels.book} Fri 9:00</div>
              </button>
            ))}
          </div>
        ) : null}
        <div className="min-w-[640px] overflow-hidden rounded-xl border border-border bg-canvas">
          <div className="flex border-b border-border">
            <div className="w-16 shrink-0" />
            {staff.map((s) => (
              <div key={s.id} className="flex-1 border-l border-border px-3 py-2 text-sm font-medium">
                {s.name}
                <div className="text-[11px] font-normal text-muted-foreground">{s.role}</div>
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="w-16 shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="border-t border-border pr-2 text-right text-[11px] text-muted-foreground" style={{ height: ROW }}>
                  {h}:00
                </div>
              ))}
            </div>
            {staff.map((s) => (
              <div key={s.id} className="relative flex-1 border-l border-border" style={{ height: HOURS.length * ROW }}>
                {HOURS.map((h) => (
                  <div key={h} className="border-t border-border" style={{ height: ROW }} />
                ))}
                {holds
                  .filter((h) => h.staffId === s.id)
                  .map((h) => (
                    <div
                      key={h.id}
                      className="absolute inset-x-1 overflow-hidden rounded-md border border-dashed border-primary/50 bg-accent/40 px-2 py-1 text-[11px] text-muted-foreground"
                      style={{ top: top(h.start), height: height(h.start, h.end) }}
                    >
                      Travel · {h.label}
                    </div>
                  ))}
                {jobs
                  .filter((j) => j.assigneeId === s.id && j.scheduledStart && j.scheduledEnd)
                  .map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        useMelo.getState().selectJob(j.id);
                        void navigate({ to: "/app/pipeline" });
                      }}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1.5 text-left text-xs text-primary-foreground",
                        s.id === "sam" ? "bg-primary" : "bg-agent-dispatch",
                      )}
                      style={{ top: top(j.scheduledStart!), height: height(j.scheduledStart!, j.scheduledEnd!) }}
                    >
                      <div className="font-semibold">
                        {timeOf(j.scheduledStart!)} · {j.title}
                      </div>
                      <div className="opacity-90">{j.suburb}</div>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="hidden w-[280px] shrink-0 border-l border-border bg-canvas p-4 lg:block">
        <div className="text-sm font-semibold">Unscheduled</div>
        <p className="mt-1 text-xs text-muted-foreground">Drop onto a tech, or book the next open window.</p>
        <ul className="mt-3 space-y-2">
          {unscheduled.length === 0 ? (
            <li className="text-sm text-muted-foreground">Board is clear.</li>
          ) : (
            unscheduled.map((j) => (
              <li key={j.id} className="rounded-lg border border-border p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    useMelo.getState().selectJob(j.id);
                    void navigate({ to: "/app/pipeline" });
                  }}
                >
                  <div className="text-sm font-medium">{j.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {j.suburb} · {j.nextAction}
                  </div>
                </button>
                <button type="button" className="mt-2 text-xs font-medium text-primary" onClick={() => book("sam", "2026-09-04T09:00:00+10:00", j.id)}>
                  {labels.book} Fri 9:00 · Sam
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
