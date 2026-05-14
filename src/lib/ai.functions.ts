import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  tool: z.enum(["email", "summarize", "plan"]),
  payload: z.record(z.string(), z.string()).default({}),
});

const PROMPTS = {
  email: (p: Record<string, string>) => ({
    system:
      "You are an expert workplace communication assistant. Write polished, professional emails. Output ONLY the email (Subject line + body). No commentary, no markdown fences.",
    user: `Write a professional email.

Recipient: ${p.recipient || "Colleague"}
Tone: ${p.tone || "Formal"}
Purpose: ${p.purpose || ""}
Key details: ${p.details || ""}

Adapt vocabulary and formality to the recipient and tone. Keep it clear, concise, and well-structured with a Subject line, greeting, body paragraphs, and sign-off.`,
  }),
  summarize: (p: Record<string, string>) => ({
    system:
      "You are an expert meeting analyst. Extract structured insights from meeting notes. Be precise and concise.",
    user: `Analyze the meeting notes below and produce a structured output with these exact sections in markdown:

## Summary
A 2-3 sentence overview.

## Key Points
- Bullet list of the most important discussion points.

## Action Items
- [Owner if mentioned] - Action description

## Deadlines
- List any dates/deadlines mentioned, or "None mentioned".

Meeting notes:
"""
${p.notes || ""}
"""`,
  }),
  plan: (p: Record<string, string>) => ({
    system:
      "You are a productivity coach. Prioritize tasks using urgency and impact. Be practical and motivating.",
    user: `Given these tasks/goals, produce a structured plan in markdown:

## Prioritized To-Do List
Numbered list ranked by priority (High/Medium/Low tag for each).

## Suggested Schedule
A realistic ${p.horizon || "daily"} schedule with time blocks.

## Productivity Tips
3 specific tips tailored to these tasks.

Tasks:
"""
${p.tasks || ""}
"""`,
  }),
};

export const runAITool = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { ok: false as const, error: "AI is not configured. Please enable Lovable AI." };
    }

    const { system, user } = PROMPTS[data.tool](data.payload);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return { ok: false as const, error: "Rate limit reached. Please try again in a moment." };
        }
        if (res.status === 402) {
          return {
            ok: false as const,
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          };
        }
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { ok: false as const, error: `AI request failed (${res.status}).` };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) return { ok: false as const, error: "Empty response from AI." };
      return { ok: true as const, content };
    } catch (err) {
      console.error("AI call failed", err);
      return { ok: false as const, error: "Something went wrong contacting the AI service." };
    }
  });
