import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ReactPDF from "@react-pdf/renderer";
import { buildSOWDocument, type SOW } from "@/lib/pdf/generateSOW";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: sow, error } = await supabase
      .from("sows")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !sow) {
      return NextResponse.json({ error: "SOW not found" }, { status: 404 });
    }

    const { data: artifacts } = await supabase
      .from("sow_artifacts")
      .select("*")
      .eq("sow_id", params.id)
      .order("created_at", { ascending: true });

    const s = sow as SOW;
    const pdfStream = await ReactPDF.renderToStream(
      buildSOWDocument(s, artifacts || [])
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const filename = (s.project_title || "SOW")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
