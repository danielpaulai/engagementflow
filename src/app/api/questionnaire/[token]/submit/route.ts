import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { answers } = await req.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("questionnaires")
      .select("id, status")
      .eq("token", token)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
    }

    if (existing.status === "completed") {
      return NextResponse.json({ error: "Questionnaire already completed" }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("questionnaires")
      .update({
        answers,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (updateError) {
      console.error("[questionnaire/submit] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
