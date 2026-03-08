import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: fetch all catalog services
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Catalog fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
    }

    return NextResponse.json({ services: data });
  } catch (err) {
    console.error("Catalog GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: create a new service
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service_name, description, hours_min, hours_max, base_rate, out_of_scope, region } = body;

    if (!service_name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .insert({
        service_name,
        description: description || "",
        hours_min: hours_min || 0,
        hours_max: hours_max || 0,
        base_rate: base_rate || 0,
        out_of_scope: out_of_scope || "",
        region: region || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Catalog insert error:", error);
      return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
    }

    return NextResponse.json({ service: data });
  } catch (err) {
    console.error("Catalog POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: update an existing service
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Catalog update error:", error);
      return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
    }

    return NextResponse.json({ service: data });
  } catch (err) {
    console.error("Catalog PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: remove a service
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("solution_catalog")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Catalog delete error:", error);
      return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Catalog DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
