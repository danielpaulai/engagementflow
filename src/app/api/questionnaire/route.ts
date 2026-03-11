import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { client_name, client_email, engagement_type } = body;

    console.log("[questionnaire] POST body:", JSON.stringify(body));

    if (!client_name || !client_email) {
      return NextResponse.json({ error: "Client name and email are required" }, { status: 400 });
    }

    // Generate token server-side to avoid relying on Supabase DEFAULT
    const token = crypto.randomBytes(32).toString("hex");

    console.log("[questionnaire] Inserting with token:", token.slice(0, 12) + "...");

    const { data, error } = await supabaseAdmin
      .from("questionnaires")
      .insert({
        client_name,
        client_email,
        engagement_type: engagement_type || "",
        token,
        status: "sent",
        answers: {},
      })
      .select("id, token")
      .single();

    if (error || !data) {
      console.error("[questionnaire] Supabase insert error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: `Supabase insert failed: ${error?.message || "Unknown"}`,
          code: error?.code || null,
          details: error?.details || null,
          hint: error?.hint || null,
        },
        { status: 500 }
      );
    }

    console.log("[questionnaire] Insert success. ID:", data.id);

    // Build questionnaire URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://engagementflow.vercel.app";
    const questionnaireUrl = `${baseUrl}/questionnaire/${data.token}`;

    // Send email — wrapped separately so email failure does not block record creation
    let emailWarning: string | null = null;
    try {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9F8FF;font-family:'Inter',Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#F9F8FF;">
    <div style="background:#0A0A0B;padding:32px 40px;border-radius:24px 24px 0 0;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
        <span style="color:#9333EA;">&#9889;</span> EngagementFlow
      </h1>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Discovery Questionnaire</p>
    </div>
    <div style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <h2 style="margin:0 0 8px;color:#0A0A0B;font-size:22px;font-weight:600;letter-spacing:-0.02em;">
        Hello ${client_name},
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        We would like to learn more about your organisation before our upcoming engagement call.
        Please take a few minutes to complete this short questionnaire so we can tailor our approach to your needs.
      </p>
      ${engagement_type ? `
      <div style="background:#F9F8FF;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#9333EA;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Engagement Type</p>
        <p style="margin:0;color:#0A0A0B;font-size:15px;font-weight:600;">${engagement_type}</p>
      </div>` : ""}
      <a href="${questionnaireUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#9333EA,#4F46E5);color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;">
        Complete Questionnaire
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
        This link is unique to you. It does not expire.
      </p>
    </div>
    <div style="background:#fafafa;padding:20px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 24px 24px;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Sent from EngagementFlow</p>
    </div>
  </div>
</body>
</html>`;

      await sendEmail({
        to: client_email,
        subject: `Discovery Questionnaire - ${engagement_type || "Engagement"} - EngagementFlow`,
        html,
      });

      console.log("[questionnaire] Email sent to:", client_email);
    } catch (emailErr: unknown) {
      const emailError = emailErr as Error;
      console.error("[questionnaire] Email send failed (non-blocking):", emailError.message);
      emailWarning = `Questionnaire created but email failed: ${emailError.message}`;
    }

    return NextResponse.json({
      id: data.id,
      token: data.token,
      ...(emailWarning ? { warning: emailWarning } : {}),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[questionnaire] Unexpected error:", error.message, error.stack);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("questionnaires")
      .select("id, client_name, client_email, engagement_type, status, created_at, completed_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch questionnaires" }, { status: 500 });
    }

    return NextResponse.json({ questionnaires: data || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
