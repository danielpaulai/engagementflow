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
      console.error("Catalog fetch error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to fetch catalog: ${error.message}` }, { status: 500 });
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
    const { service_name, description, hours_min, hours_max, base_rate, currency, out_of_scope, region } = body;

    if (!service_name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const insertData = {
      service_name,
      description: description || "",
      hours_min: typeof hours_min === "string" ? parseInt(hours_min) || 0 : hours_min || 0,
      hours_max: typeof hours_max === "string" ? parseInt(hours_max) || 0 : hours_max || 0,
      base_rate: typeof base_rate === "string" ? parseInt(base_rate) || 0 : base_rate || 0,
      currency: currency || "USD",
      out_of_scope: out_of_scope || "",
      region: region || "",
    };

    console.log("Inserting catalog service:", JSON.stringify(insertData, null, 2));

    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Catalog insert error (full):", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Failed to create service: ${error.message} (code: ${error.code})` },
        { status: 500 }
      );
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

    // Parse numeric fields if they come as strings
    if (updates.hours_min !== undefined) updates.hours_min = typeof updates.hours_min === "string" ? parseInt(updates.hours_min) || 0 : updates.hours_min;
    if (updates.hours_max !== undefined) updates.hours_max = typeof updates.hours_max === "string" ? parseInt(updates.hours_max) || 0 : updates.hours_max;
    if (updates.base_rate !== undefined) updates.base_rate = typeof updates.base_rate === "string" ? parseInt(updates.base_rate) || 0 : updates.base_rate;

    const { data, error } = await supabaseAdmin
      .from("solution_catalog")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Catalog update error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to update service: ${error.message}` }, { status: 500 });
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
      console.error("Catalog delete error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to delete service: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Catalog DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
