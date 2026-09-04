import { cn } from "@/lib/utils";

export function MeloMark({ className, title = "Melo" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <circle cx="16" cy="16" r="16" fill="#2B7FFF" />
      <path
        fill="#ffffff"
        d="M8.2 22.2V11.2h2.15v.35c.48-.72 1.35-1.22 2.55-1.22 1.08 0 1.9.46 2.38 1.28.55-.82 1.5-1.28 2.7-1.28 2.05 0 3.22 1.32 3.22 3.62v8.25h-2.2v-7.55c0-1.18-.58-1.85-1.55-1.85-.98 0-1.62.72-1.62 1.92v7.48h-2.18v-7.55c0-1.18-.57-1.85-1.55-1.85-.98 0-1.65.74-1.65 1.95v7.45H8.2z"
      />
      <circle cx="23.15" cy="21.35" r="1.65" fill="#ffffff" />
    </svg>
  );
}

export function MeloWordmark({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", invert ? "text-mkt-fg" : "text-ink", className)}>
      <MeloMark className="size-7" />
      <span className="text-[17px] leading-none">Melo</span>
    </span>
  );
}
