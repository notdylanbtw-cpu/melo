import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/misc";
import { AskDrawer } from "@/components/melo/ask";
import { CommandPalette } from "@/components/melo/command";
import { HelpOverlay } from "@/components/melo/help";
import { KeyboardShortcuts } from "@/components/melo/shortcuts";
import { WidgetOverlay } from "@/components/melo/widget";
import { SupportBot } from "@/components/melo/support-bot";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useMelo } from "@/lib/melo/store";
import { getComputer } from "@/lib/computer/actions";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  preview,
  previewPath,
}: {
  children: React.ReactNode;
  preview?: boolean;
  previewPath?: string;
}) {
  const [mobile, setMobile] = useState(false);
  const askOpen = useMelo((s) => s.askOpen);

  useEffect(() => {
    if (preview) return;
    void useMelo.persist.rehydrate();
    void getComputer().catch(() => undefined);
  }, [preview]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex overflow-hidden bg-background text-foreground", preview ? "h-full" : "h-dvh")}>
        <div className="hidden lg:flex">
          <Sidebar previewPath={previewPath} />
        </div>
        {mobile ? (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setMobile(false)} />
            <div className="relative z-10 h-full">
              <Sidebar onNavigate={() => setMobile(false)} />
            </div>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobile(true)} />
          <main className={cn("melo-scroll min-h-0 flex-1 overflow-auto", askOpen && !preview && "lg:pr-[28rem]")}>{children}</main>
        </div>
        {preview ? null : (
          <>
            <AskDrawer />
            <CommandPalette />
            <HelpOverlay />
            <KeyboardShortcuts />
            <WidgetOverlay />
            <SupportBot tone="light" surface="app" hidden={askOpen} />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
