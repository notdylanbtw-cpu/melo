import { createServerFn } from "@tanstack/react-start";

export const askMeloFn = createServerFn({ method: "POST" })
  .validator((input: { message: string; system: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 500,
          temperature: 0.4,
          messages: [
            { role: "system", content: data.system },
            { role: "user", content: data.message },
          ],
        }),
      });
      if (!res.ok) return { ok: false as const, error: `xAI ${res.status}` };
      const body = (await res.json()) as { choices: { message: { content: string } }[] };
      return { ok: true as const, text: body.choices[0]?.message.content ?? "" };
    } catch {
      return { ok: false as const, error: "network" };
    }
  });
