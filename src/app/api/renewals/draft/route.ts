import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a cybersecurity consulting engagement renewal specialist. You will receive an original SOW that has been delivered or is nearing completion. Generate a renewal SOW that:

1. Builds on what was delivered in the original engagement
2. Suggests logical next-phase work based on the original scope
3. Maintains the same client context, region, and commercial structure
4. Proposes expanded or continued services that would naturally follow
5. References the original engagement as the foundation

Return valid JSON only. No explanation. Use this exact format:
{
  "customer_name": "",
  "project_title": "",
  "deliverables": [{ "name": "", "description": "", "estimated_weeks": 0 }],
  "timeline_weeks": 0,
  "success_metrics": [],
  "risks": [],
  "budget_mentioned": "",
  "region": "",
  "special_requirements": ""
}

WRITING RULES:
- Never use em dashes or en dashes. Use commas, semicolons, or separate sentences.
- Be direct, specific, concrete. No filler phrases. No hedging words.
- Write like a senior consultant, not a chatbot.
- The project_title should indicate this is a renewal or Phase 2.`;

export async function POST(req: Request) {
  try {
    const { sow_id } = await req.json();

    if (!sow_id) {
      return NextResponse.json({ error: "SOW ID is required" }, { status: 400 });
    }

    const { data: originalSow, error: fetchError } = await supabaseAdmin
      .from("sows")
      .select("*")
      .eq("id", sow_id)
      .single();

    if (fetchError || !originalSow) {
      return NextResponse.json({ error: "Original SOW not found" }, { status: 404 });
    }

    const sowContent = {
      customer_name: originalSow.customer_name,
      project_title: originalSow.project_title,
      deliverables: originalSow.deliverables,
      timeline_weeks: originalSow.timeline_weeks,
      success_metrics: originalSow.success_metrics,
      risks: originalSow.risks,
      budget_mentioned: originalSow.budget_mentioned,
      region: originalSow.region,
      special_requirements: originalSow.special_requirements,
      status: originalSow.status,
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate a renewal SOW based on this completed engagement:\n\n${JSON.stringify(sowContent, null, 2)}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonText = textBlock.text.trim();
    const fenceMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    let extracted;
    try {
      extracted = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse renewal response:", textBlock.text);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Save the renewal draft
    const { data: newSow, error: insertError } = await supabaseAdmin
      .from("sows")
      .insert({
        customer_name: extracted.customer_name || originalSow.customer_name,
        project_title: extracted.project_title || `${originalSow.project_title} - Renewal`,
        deliverables: extracted.deliverables || [],
        timeline_weeks: extracted.timeline_weeks || 0,
        success_metrics: extracted.success_metrics || [],
        risks: extracted.risks || [],
        budget_mentioned: extracted.budget_mentioned || "",
        region: extracted.region || originalSow.region || "",
        special_requirements: `Renewal of: ${originalSow.project_title} (ID: ${sow_id})\n\n${extracted.special_requirements || ""}`.trim(),
        status: "draft",
        raw_transcript: `[Auto-generated renewal based on SOW: ${originalSow.project_title}]`,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Renewal insert error:", insertError);
      return NextResponse.json({ error: "Failed to save renewal SOW" }, { status: 500 });
    }

    return NextResponse.json({
      id: newSow.id,
      renewal: extracted,
      original_sow_id: sow_id,
    });
  } catch (err) {
    console.error("Renewal draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
