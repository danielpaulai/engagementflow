import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTemplateById, buildTemplatePrompt } from "@/lib/sow-templates";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are a professional Scope of Work analyst. Read the customer conversation below and extract the following in JSON format: { "customer_name": "", "project_title": "", "deliverables": [{ "name": "", "description": "", "estimated_weeks": 0 }], "timeline_weeks": 0, "success_metrics": [], "risks": [], "budget_mentioned": "", "region": "", "special_requirements": "" }. Return only valid JSON. No explanation.

WRITING RULES — strictly follow these:
- NEVER use em dashes (—) or en dashes (–). Use commas, semicolons, colons, or separate sentences instead.
- NEVER use filler phrases: "It is important to note", "It should be noted", "It is worth mentioning", "In order to", "As mentioned", "Needless to say", "At the end of the day", "Moving forward", "In terms of", "With respect to", "It goes without saying", "As a matter of fact".
- NEVER use hedging words: "arguably", "relatively", "fairly", "somewhat", "potentially", "essentially", "basically", "fundamentally", "generally speaking".
- Use direct, active voice. Be specific and concrete. State facts plainly.
- Write like a senior consultant, not a chatbot.`;

function buildEnrichedPrompt(
  transcript: string,
  matches: Array<{
    service_name: string;
    description: string;
    hours_min: number;
    hours_max: number;
    base_rate: number;
    out_of_scope: string;
    region: string;
  }>
) {
  if (matches.length === 0) return transcript;

  const catalogSection = matches
    .map(
      (m) =>
        `- ${m.service_name}: ${m.description} (${m.hours_min}–${m.hours_max} hours, $${m.base_rate}/engagement, Region: ${m.region || "Global"}${m.out_of_scope ? `, Out of scope: ${m.out_of_scope}` : ""})`
    )
    .join("\n");

  return `${transcript}

---
MATCHED SERVICES FROM CATALOG (use these real services, hours, and rates when generating deliverables where applicable):
${catalogSection}

When a deliverable matches a catalog service, use the catalog's hours range and rate. Add "(Catalog Match)" after the deliverable name to indicate it was matched.`;
}

export async function POST(req: Request) {
  try {
    const { transcript, templateId } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    // Step 1: Quick extraction to get deliverable names for catalog matching
    const quickExtract = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        'Extract just the deliverable names from this transcript as a JSON array of strings. Return only valid JSON like ["Deliverable 1", "Deliverable 2"]. No explanation.',
      messages: [{ role: "user", content: transcript }],
    });

    let deliverableNames: string[] = [];
    const quickBlock = quickExtract.content.find((b) => b.type === "text");
    if (quickBlock && quickBlock.type === "text") {
      let quickText = quickBlock.text.trim();
      const fenceMatch = quickText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
      if (fenceMatch) quickText = fenceMatch[1].trim();
      try {
        deliverableNames = JSON.parse(quickText);
      } catch {
        // If parsing fails, continue without catalog matching
      }
    }

    // Step 2: Match against the solution catalog
    interface CatalogMatch {
      service_name: string;
      description: string;
      hours_min: number;
      hours_max: number;
      base_rate: number;
      out_of_scope: string;
      region: string;
    }
    let catalogMatches: CatalogMatch[] = [];

    if (deliverableNames.length > 0) {
      try {
        // Build ilike conditions for matching
        const searchTerms: string[] = [];
        for (const name of deliverableNames) {
          if (name.trim()) {
            searchTerms.push(name.trim());
            const words = name.trim().split(/\s+/).filter((w: string) => w.length > 3);
            searchTerms.push(...words);
          }
        }

        const unique = Array.from(new Set(searchTerms.map((t) => t.toLowerCase())));
        if (unique.length > 0) {
          const conditions = unique
            .map((term) => `service_name.ilike.%${term}%,description.ilike.%${term}%`)
            .join(",");

          const { data } = await supabaseAdmin
            .from("solution_catalog")
            .select("*")
            .or(conditions)
            .limit(5);

          if (data) catalogMatches = data;
        }
      } catch (err) {
        console.error("Catalog match error during generation:", err);
      }
    }

    // Step 3: Generate full SOW with catalog and template context
    const enrichedTranscript = buildEnrichedPrompt(transcript, catalogMatches);

    // Build system prompt with optional template context
    let systemPrompt = SYSTEM_PROMPT;
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        systemPrompt = SYSTEM_PROMPT + "\n\n" + buildTemplatePrompt(template);
      }
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: enrichedTranscript }],
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

    // Add catalog match info to special_requirements if matches were found
    let specialReqs = extracted.special_requirements || "";
    if (catalogMatches.length > 0) {
      const matchedNames = catalogMatches.map((m) => m.service_name).join(", ");
      const catalogNote = `\n\nCatalog Services Matched: ${matchedNames}`;
      specialReqs = specialReqs ? specialReqs + catalogNote : catalogNote.trim();
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
        special_requirements: specialReqs,
        status: "draft",
        raw_transcript: transcript,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save SOW" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, catalog_matches: catalogMatches.length });
  } catch (err) {
    console.error("Generate SOW error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
