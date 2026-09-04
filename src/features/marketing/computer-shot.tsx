import { MeloMark } from "@/components/brand/melo-mark";

const TILES = [
  { name: "Gmail", src: "/logos/gmail.svg?v=real" },
  { name: "Xero", src: "/logos/xero.svg?v=real" },
  { name: "Jobber", src: "/logos/jobber.svg?v=badge" },
  { name: "ServiceM8", src: "/logos/servicem8.png?v=live" },
  { name: "Fergus", src: "/logos/fergus.png?v=live" },
  { name: "Inbox", src: null },
];

const STEPS = [
  "Open Jobber",
  "Click “New job”",
  "Type client + suburb",
  "Save",
];

export function ComputerShot() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#111113] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/8 px-3 py-1.5 text-xs text-white/50">
          <span className="size-1.5 rounded-full bg-[#3DDB8A]" />
          ap-sydney-1 · Melo Computer
        </div>
        <span className="hidden rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-ink sm:inline">Teach a task</span>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative min-h-[280px] bg-[#0c0c0e] p-6 sm:min-h-[340px] sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-sm text-white/70">
            <MeloMark className="size-5" />
            <span className="font-medium text-white">Your office</span>
            <span className="text-white/35">desk</span>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-5">
            {TILES.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-2">
                <div className="grid size-12 place-items-center rounded-[14px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:size-14">
                  {t.src ? (
                    <img src={t.src} alt="" className="size-7 object-contain sm:size-8" />
                  ) : (
                    <MeloMark className="size-7" />
                  )}
                </div>
                <div className="text-[11px] text-white/55">{t.name}</div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0c0e]" />
        </div>
        <aside className="hidden border-l border-white/10 bg-[#161618] p-4 lg:block">
          <div className="text-[11px] font-medium uppercase tracking-wide text-white/40">Taught tasks</div>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white">Jobber job from quote</span>
              <span className="rounded-full bg-[#3DDB8A]/15 px-2 py-0.5 text-[10px] font-medium text-[#3DDB8A]">On</span>
            </div>
            <ol className="mt-3 space-y-1.5 text-[12px] text-white/50">
              {STEPS.map((s, i) => (
                <li key={s}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
            <div className="mt-3 text-[11px] text-white/35">Daily · last run 6m ago</div>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/40">Runs on this machine. Not your laptop.</p>
        </aside>
      </div>
    </div>
  );
}
