import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const QUESTION_LABELS: Record<string, string> = {
  org_name: "Organisation Name & Industry",
  employees_regions: "Employees & Regions",
  security_tools: "Current Security Tools",
  primary_challenge: "Primary Security Challenge",
  compliance_frameworks: "Compliance Frameworks",
  success_90_days: "Success in 90 Days",
  budget_range: "Budget Range",
  target_start_date: "Target Start Date",
  key_stakeholders: "Key Stakeholders",
  additional_info: "Additional Information",
};

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Token here is actually the questionnaire ID (uuid) passed from the dashboard
    const { data, error } = await supabaseAdmin
      .from("questionnaires")
      .select("client_name, client_email, engagement_type, answers, status")
      .eq("id", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
    }

    if (data.status !== "completed") {
      return NextResponse.json({ error: "Questionnaire not yet completed" }, { status: 400 });
    }

    const answers = (data.answers || {}) as Record<string, string>;

    const lines: string[] = [
      `[Discovery Questionnaire - ${data.client_name}]`,
      `Client: ${data.client_name} (${data.client_email})`,
      `Engagement Type: ${data.engagement_type || "Not specified"}`,
      "",
    ];

    for (const [key, label] of Object.entries(QUESTION_LABELS)) {
      const answer = answers[key];
      if (answer && answer.trim()) {
        lines.push(`${label}: ${answer.trim()}`);
        lines.push("");
      }
    }

    return NextResponse.json({ transcript: lines.join("\n") });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
