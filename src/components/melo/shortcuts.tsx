import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMelo } from "@/lib/melo/store";

const GO = {
  h: "/app",
  i: "/app/inbox",
  r: "/app/reception",
  f: "/app/firm",
  c: "/app/calendar",
  p: "/app/pipeline",
  e: "/app/reach",
  k: "/app/knowledge",
  n: "/app/connect",
  v: "/app/review",
  s: "/app/settings",
} as const;

function typingInField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const pendingG = useRef(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const store = useMelo.getState();
      const typing = typingInField(e.target);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        store.setAskOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        store.setWidgetOpen(true);
        return;
      }

      if (e.key === "Escape") {
        store.setAskOpen(false);
        store.setCommandOpen(false);
        store.setHelpOpen(false);
        store.setWidgetOpen(false);
        pendingG.current = false;
        return;
      }

      if (typing) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        store.setHelpOpen(!store.helpOpen);
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        pendingG.current = true;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          pendingG.current = false;
        }, 800);
        return;
      }

      if (pendingG.current) {
        const to = GO[e.key.toLowerCase() as keyof typeof GO];
        pendingG.current = false;
        if (to) {
          e.preventDefault();
          void navigate({ to });
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer.current);
    };
  }, [navigate]);

  return null;
}
