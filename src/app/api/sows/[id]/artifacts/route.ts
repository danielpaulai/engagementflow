import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sow_artifacts")
    .select("*")
    .eq("sow_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifacts: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const appendixLabel = formData.get("appendix_label") as string || "";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Determine section based on file type
  const imageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const section = imageTypes.includes(file.type) ? "hld" : "appendix";

  // Upload to Supabase Storage
  const storagePath = `${user.id}/${params.id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("sow-artifacts")
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Get signed URL (valid for 1 year)
  const { data: urlData } = await supabaseAdmin.storage
    .from("sow-artifacts")
    .createSignedUrl(storagePath, 31536000);

  // Save record to database
  const { data, error } = await supabase
    .from("sow_artifacts")
    .insert({
      sow_id: params.id,
      file_name: file.name,
      file_type: file.type,
      file_url: urlData?.signedUrl || "",
      storage_path: storagePath,
      section,
      appendix_label: appendixLabel || (section === "hld" ? "Architecture Diagram" : `Appendix — ${file.name}`),
      file_size: file.size,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifact: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { artifact_id } = await req.json();

  // Get the artifact first to get storage path
  const { data: artifact } = await supabase
    .from("sow_artifacts")
    .select("storage_path")
    .eq("id", artifact_id)
    .eq("sow_id", params.id)
    .single();

  if (artifact) {
    await supabaseAdmin.storage.from("sow-artifacts").remove([artifact.storage_path]);
  }

  const { error } = await supabase
    .from("sow_artifacts")
    .delete()
    .eq("id", artifact_id)
    .eq("sow_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
