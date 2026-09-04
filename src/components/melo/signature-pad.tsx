import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SignatureValue = {
  name: string;
  method: "drawn" | "typed";
  image: string | null;
};

export function SignaturePad({
  defaultName,
  onChange,
}: {
  defaultName: string;
  onChange: (v: SignatureValue) => void;
}) {
  const [mode, setMode] = useState<"drawn" | "typed">("drawn");
  const [name, setName] = useState(defaultName);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
  }, [mode]);

  useEffect(() => {
    if (mode === "typed") {
      onChange({ name, method: "typed", image: name.trim() ? typedImage(name.trim()) : null });
    } else {
      const canvas = canvasRef.current;
      onChange({ name, method: "drawn", image: dirty && canvas ? canvas.toDataURL("image/png") : null });
    }
  }, [mode, name, dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    const p = pos(e);
    const prev = last.current;
    if (!ctx || !prev) return;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setDirty(true);
  }

  function end() {
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (dirty && canvas) onChange({ name, method: "drawn", image: canvas.toDataURL("image/png") });
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
    onChange({ name, method: "drawn", image: null });
  }

  return (
    <div>
      <div className="mb-2 flex gap-1">
        {(["drawn", "typed"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {m === "drawn" ? "Draw" : "Type"}
          </button>
        ))}
      </div>
      {mode === "drawn" ? (
        <div>
          <canvas
            ref={canvasRef}
            className="h-32 w-full touch-none rounded-lg border border-border bg-canvas"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Sign in the box</span>
            <button type="button" className="text-primary" onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full legal name" />
          <div className="mt-2 flex h-32 items-center rounded-lg border border-dashed border-border bg-canvas px-4">
            <span className="text-3xl text-foreground italic" style={{ fontFamily: "Segoe Script, Apple Chancery, cursive" }}>
              {name.trim() || "Your signature"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function typedImage(name: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#111827";
  ctx.font = "italic 56px 'Segoe Script', 'Apple Chancery', cursive";
  ctx.fillText(name, 28, 110);
  return canvas.toDataURL("image/png");
}

export function SignaturePreview({ image, name, at }: { image?: string; name: string; at?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      {image ? <img src={image} alt={`Signature of ${name}`} className="h-14 w-auto max-w-full object-contain object-left" /> : null}
      <div className="text-sm font-medium">{name}</div>
      {at ? <div className="text-xs text-muted-foreground">{at}</div> : null}
    </div>
  );
}
