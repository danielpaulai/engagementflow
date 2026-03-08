import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are a professional Scope of Work analyst. Read the customer conversation below and extract the following in JSON format: { "customer_name": "", "project_title": "", "deliverables": [{ "name": "", "description": "", "estimated_weeks": 0 }], "timeline_weeks": 0, "success_metrics": [], "risks": [], "budget_mentioned": "", "region": "", "special_requirements": "" }. Return only valid JSON. No explanation.`;

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Strip markdown code fences if present
    let jsonText = textBlock.text.trim();
    const fenceMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse AI response:", textBlock.text);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("sows")
      .insert({
        customer_name: extracted.customer_name || "",
        project_title: extracted.project_title || "",
        deliverables: extracted.deliverables || [],
        timeline_weeks: extracted.timeline_weeks || 0,
        success_metrics: extracted.success_metrics || [],
        risks: extracted.risks || [],
        budget_mentioned: extracted.budget_mentioned || "",
        region: extracted.region || "",
        special_requirements: extracted.special_requirements || "",
        status: "draft",
        raw_transcript: transcript,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save SOW" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("Generate SOW error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
