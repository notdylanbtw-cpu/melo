import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "playwright";
import type { DriveStatus, SkillStep, SkillStepKind } from "./skill-types";

const VIEW_W = 1280;
const VIEW_H = 800;
const IDLE_MS = 20 * 60_000;

type Session = {
  userId: string;
  context: BrowserContext;
  page: Page;
  teaching: boolean;
  running: boolean;
  hold: string | null;
  steps: SkillStep[];
  lastUsed: number;
  queue: Promise<unknown>;
};

const g = globalThis as typeof globalThis & { __meloBrowsers?: Map<string, Session> };

function store() {
  if (!g.__meloBrowsers) g.__meloBrowsers = new Map();
  return g.__meloBrowsers;
}

function chromePath() {
  const env = (process.env.PLAYWRIGHT_CHROME ?? "").trim();
  if (env && existsSync(env)) return env;
  const shell =
    "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
  if (existsSync(shell)) return shell;
  return undefined;
}

function dataDir(userId: string) {
  const root = path.join(process.cwd(), ".data", "computers", userId.replace(/[^a-zA-Z0-9_-]/g, "_"));
  mkdirSync(root, { recursive: true });
  return root;
}

function desktopHtml(brand: string, site: string) {
  const tiles = [
    site ? { name: brand || "Your site", href: site.startsWith("http") ? site : `https://${site}` } : null,
    { name: "Gmail", href: "https://mail.google.com" },
    { name: "Xero", href: "https://go.xero.com" },
    { name: "Jobber", href: "https://secure.getjobber.com" },
    { name: "ServiceM8", href: "https://pro.servicem8.com" },
    { name: "Fergus", href: "https://app.fergus.com" },
  ].filter(Boolean) as { name: string; href: string }[];

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Melo Computer</title>
<style>
  html,body{margin:0;height:100%;background:#0c0c0e;color:#f4f4f5;font:14px/1.4 ui-sans-serif,system-ui,sans-serif}
  main{padding:40px 48px}
  h1{font-size:18px;font-weight:600;margin:0 0 6px}
  p{margin:0 0 28px;color:#a1a1aa}
  .grid{display:grid;grid-template-columns:repeat(4,120px);gap:22px}
  a{color:inherit;text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:10px}
  i{width:56px;height:56px;border-radius:16px;background:#1c1c20;display:grid;place-items:center;font-style:normal;font-weight:600;letter-spacing:.02em}
  a:hover i{background:#26262b}
  span{font-size:12px;color:#d4d4d8}
</style></head>
<body>
<main>
  <h1>${esc(brand || "Melo Computer")}</h1>
  <p>This machine is yours. Open a site. Teach a task. Melo keeps the session.</p>
  <div class="grid">
    ${tiles
      .map((t) => `<a href="${esc(t.href)}"><i>${esc(t.name.slice(0, 2))}</i><span>${esc(t.name)}</span></a>`)
      .join("")}
  </div>
</main>
</body></html>`;
}

function esc(s: string) {
  const ent = (name: string) => `&${name};`;
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return ent("amp");
    if (c === "<") return ent("lt");
    if (c === ">") return ent("gt");
    if (c === '"') return ent("quot");
    return ent("#39");
  });
}

async function ensure(userId: string, meta?: { brand?: string; site?: string }): Promise<Session> {
  const map = store();
  const existing = map.get(userId);
  if (existing) {
    existing.lastUsed = Date.now();
    return existing;
  }

  const { chromium } = await import("playwright");
  const exec = chromePath();
  const context = await chromium.launchPersistentContext(dataDir(userId), {
    executablePath: exec,
    headless: true,
    viewport: { width: VIEW_W, height: VIEW_H },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-blink-features=AutomationControlled"],
    ignoreHTTPSErrors: true,
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.setViewportSize({ width: VIEW_W, height: VIEW_H });
  const session: Session = {
    userId,
    context,
    page,
    teaching: false,
    running: false,
    hold: null,
    steps: [],
    lastUsed: Date.now(),
    queue: Promise.resolve(),
  };
  map.set(userId, session);

  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    if (!session.teaching) return;
    const url = page.url();
    if (url.startsWith("http")) record(session, "open", `Open ${hostOf(url)}`, { url });
  });

  if (page.url() === "about:blank") {
    await page.setContent(desktopHtml(meta?.brand || "Melo Computer", meta?.site || ""), { waitUntil: "domcontentloaded" });
  }
  return session;
}

function record(session: Session, kind: SkillStepKind, label: string, extra?: Partial<SkillStep>) {
  if (!session.teaching) return;
  const last = session.steps[session.steps.length - 1];
  if (last && last.kind === kind && last.label === label && last.url === extra?.url) return;
  session.steps.push({
    id: crypto.randomUUID(),
    kind,
    label,
    at: new Date().toISOString(),
    ...extra,
  });
}

function serial<T>(session: Session, fn: () => Promise<T>): Promise<T> {
  const next = session.queue.then(fn, fn);
  session.queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function bootDrive(userId: string, meta?: { brand?: string; site?: string }): Promise<DriveStatus> {
  try {
    const s = await ensure(userId, meta);
    return statusOf(s);
  } catch (e) {
    return {
      url: "",
      title: "",
      teaching: false,
      running: false,
      hold: null,
      steps: [],
      ready: false,
      error: e instanceof Error ? e.message : "Computer failed to boot",
    };
  }
}

export async function frameJpeg(userId: string): Promise<{ jpeg: string; status: DriveStatus }> {
  const s = await ensure(userId);
  return serial(s, async () => {
    s.lastUsed = Date.now();
    const buf = await s.page.screenshot({ type: "jpeg", quality: 42 });
    const st = statusOf(s);
    st.title = await s.page.title().catch(() => "");
    st.url = s.page.url();
    return { jpeg: buf.toString("base64"), status: st };
  });
}

export async function gotoUrl(userId: string, raw: string) {
  const s = await ensure(userId);
  return serial(s, async () => {
    const href = normalizeUrl(raw);
    await s.page.goto(href, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => undefined);
    record(s, "open", `Open ${hostOf(s.page.url())}`, { url: s.page.url() });
    return statusOf(s);
  });
}

export async function clickAt(userId: string, x: number, y: number, boxW: number, boxH: number) {
  const s = await ensure(userId);
  return serial(s, async () => {
    const px = clamp((x / Math.max(boxW, 1)) * VIEW_W, 0, VIEW_W - 1);
    const py = clamp((y / Math.max(boxH, 1)) * VIEW_H, 0, VIEW_H - 1);
    let label = `Click ${Math.round(px)},${Math.round(py)}`;
    try {
      const text = await s.page.evaluate(
        ({ px, py }) => {
          const el = document.elementFromPoint(px, py) as HTMLElement | null;
          if (!el) return "";
          const t = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").replace(/\s+/g, " ").trim();
          return t.slice(0, 48);
        },
        { px, py },
      );
      if (text) label = `Click “${text}”`;
    } catch {
      /* */
    }
    await s.page.mouse.click(px, py);
    record(s, "click", label, { x: px, y: py });
    await s.page.waitForTimeout(120);
    return statusOf(s);
  });
}

export async function typeText(userId: string, text: string, secret: boolean) {
  const s = await ensure(userId);
  return serial(s, async () => {
    if (secret) {
      record(s, "secret", "Ask me for a secret, then continue", { secret: true });
      s.hold = "Type the secret on the computer, then continue.";
      return statusOf(s);
    }
    await s.page.keyboard.type(text, { delay: 18 });
    record(s, "type", `Type “${text.slice(0, 40)}${text.length > 40 ? "…" : ""}”`, { text });
    return statusOf(s);
  });
}

export async function pressKey(userId: string, key: string) {
  const s = await ensure(userId);
  return serial(s, async () => {
    await s.page.keyboard.press(key);
    if (["Enter", "Tab", "Escape", "Backspace"].includes(key)) record(s, "type", `Press ${key}`, { text: key });
    return statusOf(s);
  });
}

export async function goHome(userId: string, meta?: { brand?: string; site?: string }) {
  const s = await ensure(userId, meta);
  return serial(s, async () => {
    await s.page.setContent(desktopHtml(meta?.brand || "Melo Computer", meta?.site || ""), { waitUntil: "domcontentloaded" });
    return statusOf(s);
  });
}

export async function startTeach(userId: string) {
  const s = await ensure(userId);
  s.teaching = true;
  s.steps = [];
  s.hold = null;
  record(s, "open", `Start on ${hostOf(s.page.url()) || "desktop"}`, { url: s.page.url() });
  return statusOf(s);
}

export async function stopTeach(userId: string) {
  const s = store().get(userId);
  if (!s) return emptyStatus();
  s.teaching = false;
  return statusOf(s);
}

export async function clearHold(userId: string) {
  const s = store().get(userId);
  if (!s) return emptyStatus();
  s.hold = null;
  return statusOf(s);
}

export async function playSteps(userId: string, steps: SkillStep[], meta?: { brand?: string; site?: string }) {
  const s = await ensure(userId, meta);
  s.running = true;
  s.hold = null;
  try {
    for (const step of steps) {
      s.lastUsed = Date.now();
      if (step.kind === "secret" || step.secret) {
        s.hold = step.label || "Take over for this step, then continue.";
        s.running = false;
        return statusOf(s);
      }
      if (step.kind === "open" && step.url) {
        await s.page.goto(step.url, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => undefined);
      } else if (step.kind === "click" && step.x != null && step.y != null) {
        await s.page.mouse.click(step.x, step.y);
      } else if (step.kind === "type" && step.text) {
        if (step.text === "Enter" || step.text === "Tab" || step.text === "Escape" || step.text === "Backspace") {
          await s.page.keyboard.press(step.text);
        } else {
          await s.page.keyboard.type(step.text, { delay: 16 });
        }
      } else if (step.kind === "wait") {
        await s.page.waitForTimeout(1200);
      }
      await s.page.waitForTimeout(350);
    }
  } finally {
    s.running = false;
  }
  return statusOf(s);
}

export function statusOf(s: Session): DriveStatus {
  return {
    url: s.page.url(),
    title: "",
    teaching: s.teaching,
    running: s.running,
    hold: s.hold,
    steps: s.steps,
    ready: true,
  };
}

function emptyStatus(): DriveStatus {
  return { url: "", title: "", teaching: false, running: false, hold: null, steps: [], ready: false };
}

function normalizeUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "about:blank";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function hostOf(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

setInterval(() => {
  const map = store();
  const now = Date.now();
  for (const [id, s] of map) {
    if (now - s.lastUsed < IDLE_MS) continue;
    void s.context.close().catch(() => undefined);
    map.delete(id);
  }
}, 60_000).unref?.();
