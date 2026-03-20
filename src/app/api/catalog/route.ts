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

// POST: create a new service via RPC (bypasses PostgREST schema cache)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service_name, description, hours_min, hours_max, base_rate, currency, out_of_scope, region, loe_method, commercial_model, unit_price, unit_type, qualifying_questions } = body;

    if (!service_name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("insert_catalog_service", {
      p_service_name: service_name,
      p_description: description || "",
      p_hours_min: typeof hours_min === "string" ? parseInt(hours_min) || 0 : hours_min || 0,
      p_hours_max: typeof hours_max === "string" ? parseInt(hours_max) || 0 : hours_max || 0,
      p_base_rate: typeof base_rate === "string" ? parseInt(base_rate) || 0 : base_rate || 0,
      p_currency: currency || "USD",
      p_out_of_scope: out_of_scope || "",
      p_region: region || "",
      p_loe_method: loe_method || "fixed_task",
      p_commercial_model: commercial_model || "fixed",
      p_unit_price: typeof unit_price === "string" ? parseFloat(unit_price) || 0 : unit_price || 0,
      p_unit_type: unit_type || "engagement",
      p_qualifying_questions: qualifying_questions || [],
    });

    if (error) {
      console.error("Catalog insert RPC error:", JSON.stringify(error, null, 2));
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

// PATCH: update an existing service via RPC (bypasses PostgREST schema cache)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, service_name, description, hours_min, hours_max, base_rate, currency, out_of_scope, region, loe_method, commercial_model, unit_price, unit_type, qualifying_questions } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("update_catalog_service", {
      p_id: id,
      p_service_name: service_name || "",
      p_description: description || "",
      p_hours_min: typeof hours_min === "string" ? parseInt(hours_min) || 0 : hours_min || 0,
      p_hours_max: typeof hours_max === "string" ? parseInt(hours_max) || 0 : hours_max || 0,
      p_base_rate: typeof base_rate === "string" ? parseInt(base_rate) || 0 : base_rate || 0,
      p_currency: currency || "USD",
      p_out_of_scope: out_of_scope || "",
      p_region: region || "",
      p_loe_method: loe_method || "fixed_task",
      p_commercial_model: commercial_model || "fixed",
      p_unit_price: typeof unit_price === "string" ? parseFloat(unit_price) || 0 : unit_price || 0,
      p_unit_type: unit_type || "engagement",
      p_qualifying_questions: qualifying_questions || [],
    });

    if (error) {
      console.error("Catalog update RPC error:", JSON.stringify(error, null, 2));
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
