export type VoiceIntent = "emergency" | "human" | "hours" | "price" | "book" | "message";

export function interpretSpeech(speech: string): VoiceIntent {
  const q = speech.toLowerCase();
  if (/\b(emergency|burst|overflow|flood|urgent|after hours|on fire|gas leak)\b/.test(q)) return "emergency";
  if (/\b(speak to|transfer|human|owner|manager|person|someone|operator|staff)\b/.test(q)) return "human";
  if (/\b(hour|open|close|when are you)\b/.test(q)) return "hours";
  if (/\b(price|cost|quote|how much|call[- ]?out)\b/.test(q)) return "price";
  if (/\b(book|appointment|today|tomorrow|come out|send someone|need a plumber|need an electrician)\b/.test(q)) {
    return "book";
  }
  return "message";
}

export function isAfterHoursSydney() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
  if (weekday === "Sat" || weekday === "Sun") return true;
  return hour < 7 || hour >= 17;
}
