import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST: match deliverables against the solution catalog
export async function POST(req: Request) {
  try {
    const { deliverables } = await req.json();

    if (!deliverables || !Array.isArray(deliverables) || deliverables.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Build an OR filter with ilike for each deliverable name/description
    const searchTerms: string[] = [];
    for (const d of deliverables) {
      const name = typeof d === "string" ? d : d.name || "";
      if (name.trim()) {
        // Split multi-word names into individual keywords for broader matching
        const words = name.trim().split(/\s+/).filter((w: string) => w.length > 3);
        searchTerms.push(name.trim());
        searchTerms.push(...words);
      }
    }

    if (searchTerms.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Remove duplicates and build ilike conditions
    const unique = Array.from(new Set(searchTerms.map((t) => t.toLowerCase())));

    // Query with OR conditions across service_name and description
    const conditions = unique
      .map((term) => `service_name.ilike.%${term}%,description.ilike.%${term}%`)
      .join(",");

    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .select("*")
      .or(conditions)
      .limit(5);

    if (error) {
      console.error("Catalog match error:", error);
      return NextResponse.json({ matches: [] });
    }

    return NextResponse.json({ matches: data || [] });
  } catch (err) {
    console.error("Catalog match error:", err);
    return NextResponse.json({ matches: [] });
  }
}
