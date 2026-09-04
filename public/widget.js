(() => {
  const script = document.currentScript;
  const slug = script && script.getAttribute("data-melo");
  if (!slug) return;
  const src = new URL(script.src);
  const frame = document.createElement("iframe");
  frame.src = `${src.origin}/w/${encodeURIComponent(slug)}`;
  frame.title = "Chat";
  frame.style.cssText =
    "position:fixed;right:16px;bottom:16px;width:380px;height:560px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);border:0;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);z-index:2147483646;background:#fff";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Chat";
  btn.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:2147483647;height:48px;padding:0 16px;border:0;border-radius:999px;background:#2b7fff;color:#fff;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer";
  let open = false;
  frame.hidden = true;
  btn.addEventListener("click", () => {
    open = !open;
    frame.hidden = !open;
    btn.textContent = open ? "Close" : "Chat";
  });
  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
