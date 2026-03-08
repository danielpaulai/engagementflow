import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, reviewRequestEmail, reviewDecisionEmail } from "@/lib/email/sendEmail";

// POST: Reviewer submits a decision (approve, reject, request changes)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, comment, reviewer_email } = await req.json();

    if (!action || !["approved", "changes_requested", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Insert approval record using RPC to bypass PostgREST schema cache
    const { error: approvalError } = await supabaseAdmin.rpc("insert_approval", {
      p_sow_id: params.id,
      p_status: action,
      p_reviewer_email: reviewer_email || "",
      p_comments: comment || "",
      p_reviewed_at: new Date().toISOString(),
    });

    if (approvalError) {
      console.error("Approval insert error:", approvalError);
      return NextResponse.json({ error: "Failed to save approval" }, { status: 500 });
    }

    // Map action to SOW status
    const statusMap: Record<string, string> = {
      approved: "approved",
      changes_requested: "draft",
      rejected: "rejected",
    };

    const { error: updateError } = await supabaseAdmin
      .from("sows")
      .update({ status: statusMap[action] })
      .eq("id", params.id);

    if (updateError) {
      console.error("SOW status update error:", updateError);
      return NextResponse.json({ error: "Failed to update SOW status" }, { status: 500 });
    }

    // Fetch SOW details for the email
    const { data: sow } = await supabaseAdmin
      .from("sows")
      .select("project_title, customer_name")
      .eq("id", params.id)
      .single();

    // Send decision notification email
    if (sow) {
      // Look up the original pending approval to find who to notify
      const { data: originalApproval } = await supabaseAdmin.rpc("get_approval_email", {
        p_sow_id: params.id,
      });

      const notifyEmail = reviewer_email || originalApproval;
      if (notifyEmail) {
        try {
          const decisionSubjects: Record<string, string> = {
            approved: `SOW Approved: ${sow.project_title}`,
            changes_requested: `Changes Requested: ${sow.project_title}`,
            rejected: `SOW Rejected: ${sow.project_title}`,
          };

          await sendEmail({
            to: notifyEmail,
            subject: decisionSubjects[action],
            html: reviewDecisionEmail({
              projectTitle: sow.project_title || "Untitled SOW",
              decision: action as "approved" | "changes_requested" | "rejected",
              reviewerComments: comment || undefined,
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send decision email:", emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, status: statusMap[action] });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Send SOW for review (sends email to reviewer)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reviewer_email } = await req.json();

    if (!reviewer_email) {
      return NextResponse.json({ error: "Reviewer email is required" }, { status: 400 });
    }

    // Update SOW status to in_review
    const { error: updateError } = await supabaseAdmin
      .from("sows")
      .update({ status: "in_review" })
      .eq("id", params.id);

    if (updateError) {
      console.error("SOW status update error:", updateError);
      return NextResponse.json({ error: "Failed to update SOW status" }, { status: 500 });
    }

    // Insert pending approval using RPC to bypass PostgREST schema cache
    const { error: approvalError } = await supabaseAdmin.rpc("insert_approval", {
      p_sow_id: params.id,
      p_status: "pending",
      p_reviewer_email: reviewer_email,
      p_comments: "",
      p_reviewed_at: null,
    });

    if (approvalError) {
      console.error("Approval insert error:", approvalError);
      return NextResponse.json({ error: "Failed to create approval" }, { status: 500 });
    }

    // Fetch SOW details for email
    const { data: sow } = await supabaseAdmin
      .from("sows")
      .select("project_title, customer_name")
      .eq("id", params.id)
      .single();

    // Send review request email
    if (sow) {
      try {
        await sendEmail({
          to: reviewer_email,
          subject: `SOW Review Required: ${sow.project_title || "Untitled SOW"}`,
          html: reviewRequestEmail({
            projectTitle: sow.project_title || "Untitled SOW",
            customerName: sow.customer_name || "Unknown",
            sowId: params.id,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send review request email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send for review error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
