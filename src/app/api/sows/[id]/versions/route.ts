import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch all versions for a SOW
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("sow_versions")
      .select("*")
      .eq("sow_id", params.id)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Fetch versions error:", error);
      return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
    }

    return NextResponse.json({ versions: data });
  } catch (err) {
    console.error("Versions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Update a SOW field and create a version snapshot
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { field, value, changed_by } = await req.json();

    if (!field) {
      return NextResponse.json({ error: "Field is required" }, { status: 400 });
    }

    // 1. Fetch the current SOW content BEFORE the update (this is the snapshot)
    const { data: currentSow, error: fetchError } = await supabaseAdmin
      .from("sows")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !currentSow) {
      console.error("SOW fetch error:", fetchError);
      return NextResponse.json({ error: "SOW not found" }, { status: 404 });
    }

    // 2. Get the next version number
    const { data: latestVersion } = await supabaseAdmin
      .from("sow_versions")
      .select("version_number")
      .eq("sow_id", params.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    // If this is version 1, also save the original as version 0
    if (nextVersion === 1) {
      const { id: _id, created_at: _ca, ...originalContent } = currentSow;
      await supabaseAdmin.from("sow_versions").insert({
        sow_id: params.id,
        version_number: 0,
        sow_content: originalContent,
        changed_by: "system",
        change_summary: "Original version (auto-generated from AI transcript)",
      });
    }

    // 3. Update the SOW field
    const { error: updateError } = await supabaseAdmin
      .from("sows")
      .update({ [field]: value })
      .eq("id", params.id);

    if (updateError) {
      console.error("SOW update error:", updateError);
      return NextResponse.json({ error: "Failed to update SOW" }, { status: 500 });
    }

    // 4. Fetch the updated SOW to snapshot
    const { data: updatedSow } = await supabaseAdmin
      .from("sows")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!updatedSow) {
      return NextResponse.json({ error: "Failed to fetch updated SOW" }, { status: 500 });
    }

    // 5. Build a human-readable change summary
    const fieldLabels: Record<string, string> = {
      project_title: "Project Title",
      customer_name: "Customer Name",
      timeline_weeks: "Timeline",
      budget_mentioned: "Budget",
      region: "Region",
      deliverables: "Deliverables",
      success_metrics: "Success Metrics",
      risks: "Risks",
      special_requirements: "Special Requirements",
    };
    const changeSummary = `Updated ${fieldLabels[field] || field}`;

    // 6. Create the version record with the NEW state
    const { id: _id2, created_at: _ca2, ...snapshotContent } = updatedSow;
    const { error: versionError } = await supabaseAdmin
      .from("sow_versions")
      .insert({
        sow_id: params.id,
        version_number: nextVersion,
        sow_content: snapshotContent,
        changed_by: changed_by || "user",
        change_summary: changeSummary,
      });

    if (versionError) {
      console.error("Version insert error:", versionError);
      // Don't fail the update — version tracking is secondary
    }

    return NextResponse.json({
      success: true,
      sow: updatedSow,
      version: nextVersion,
    });
  } catch (err) {
    console.error("Versions POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
