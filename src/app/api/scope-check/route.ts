import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a scope creep analyst for cybersecurity consulting engagements. You will receive:
1. The original SOW (Statement of Work) content including deliverables, timeline, budget, and special requirements.
2. A follow-up call transcript with the same client.

Your job: identify every request, task, or expectation mentioned in the follow-up transcript and classify each as either IN-SCOPE or OUT-OF-SCOPE relative to the original SOW.

Return valid JSON only. No explanation. Use this exact format:
{
  "in_scope": [
    { "item": "Short description of the request", "reason": "Why it falls within the original SOW" }
  ],
  "out_of_scope": [
    { "item": "Short description of the request", "reason": "Why it falls outside the original SOW", "estimated_effort": "Rough effort estimate e.g. 2-3 days" }
  ],
  "risk_level": "low|medium|high",
  "summary": "2-3 sentence plain language summary of the scope creep risk"
}

Classification rules:
- If a request matches or is a subset of an existing deliverable, it is IN-SCOPE.
- If a request extends, adds to, or replaces an existing deliverable beyond what was agreed, it is OUT-OF-SCOPE.
- If a request is entirely new work not covered by any deliverable, it is OUT-OF-SCOPE.
- risk_level: "low" = 0-1 out-of-scope items, "medium" = 2-3, "high" = 4+.

WRITING RULES:
- Never use em dashes or en dashes. Use commas, semicolons, or separate sentences.
- Be direct, specific, concrete. No filler phrases. No hedging words.`;

interface ScopeItem {
  item: string;
  reason: string;
  estimated_effort?: string;
}

interface ScopeResult {
  in_scope: ScopeItem[];
  out_of_scope: ScopeItem[];
  risk_level: string;
  summary: string;
}

export async function POST(req: Request) {
  try {
    const { sowContent, transcript } = await req.json();

    if (!sowContent || !transcript) {
      return NextResponse.json(
        { error: "Both SOW content and transcript are required" },
        { status: 400 }
      );
    }

    const userMessage = `ORIGINAL SOW CONTENT:
${JSON.stringify(sowContent, null, 2)}

FOLLOW-UP CALL TRANSCRIPT:
${transcript}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonText = textBlock.text.trim();
    const fenceMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    let result: ScopeResult;
    try {
      result = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse scope check response:", textBlock.text);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Scope check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
