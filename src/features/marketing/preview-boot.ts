import { createSeed } from "@/lib/melo/seed";
import { useMelo } from "@/lib/melo/store";

let booted = false;

export function bootPreview(page?: string) {
  const ws = useMelo.getState().workspace;
  const liveOffice = Boolean(ws.ownerEmail && ws.name && ws.name !== "Northside Plumbing");
  if (!liveOffice && !booted) {
    useMelo.persist.setOptions({
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
    const seed = createSeed();
    useMelo.setState({
      ...seed,
      homeMode: "command",
      askOpen: false,
      commandOpen: false,
      widgetOpen: false,
      helpOpen: false,
      checklistHidden: false,
      selectedConversationId: seed.conversations[0]?.id ?? "",
      receptionTab: "live",
    });
    booted = true;
  }
  if (page === "billing") useMelo.setState({ settingsTab: "billing" });
}
