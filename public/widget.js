(() => {
  const script = document.currentScript;
  if (!script) return;
  const slug = script.getAttribute("data-melo") || script.getAttribute("data-workspace");
  if (!slug) return;
  if (window.__meloWidget) return;
  window.__meloWidget = true;

  const origin = new URL(script.src).origin;
  const accent = script.getAttribute("data-color") || "#2B7FFF";
  const startOpen = script.getAttribute("data-open") !== "0";

  const frame = document.createElement("iframe");
  frame.src = `${origin}/w/${encodeURIComponent(slug)}?embed=1`;
  frame.title = "Chat with us";
  frame.allow = "clipboard-write";
  frame.style.cssText = [
    "position:fixed",
    "right:16px",
    "bottom:84px",
    "width:min(380px,calc(100vw - 24px))",
    "height:min(640px,calc(100vh - 110px))",
    "border:0",
    "border-radius:16px",
    "box-shadow:0 18px 50px rgba(15,23,42,.22)",
    "z-index:2147483646",
    "background:#fff",
    "opacity:0",
    "transform:translateY(12px)",
    "pointer-events:none",
    "transition:opacity .22s ease, transform .22s ease",
  ].join(";");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
  btn.style.cssText = [
    "position:fixed",
    "right:16px",
    "bottom:16px",
    "z-index:2147483647",
    "width:56px",
    "height:56px",
    "border:0",
    "border-radius:999px",
    `background:${accent}`,
    "color:#fff",
    "display:grid",
    "place-items:center",
    "cursor:pointer",
    "box-shadow:0 10px 28px rgba(43,127,255,.4)",
  ].join(";");

  let open = false;
  function setOpen(next) {
    open = next;
    frame.style.opacity = open ? "1" : "0";
    frame.style.transform = open ? "translateY(0)" : "translateY(12px)";
    frame.style.pointerEvents = open ? "auto" : "none";
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    btn.innerHTML = open
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }

  btn.addEventListener("click", () => setOpen(!open));
  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (!d || d.source !== "melo-widget") return;
    if (d.event === "close" || d.event === "minimize") setOpen(false);
    if (d.event === "open") setOpen(true);
  });

  const mount = () => {
    document.body.appendChild(frame);
    document.body.appendChild(btn);
    if (startOpen) window.setTimeout(() => setOpen(true), 700);
  };
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
