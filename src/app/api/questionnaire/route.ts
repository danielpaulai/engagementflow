import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";

export async function POST(req: Request) {
  try {
    const { client_name, client_email, engagement_type } = await req.json();

    if (!client_name || !client_email) {
      return NextResponse.json({ error: "Client name and email are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("questionnaires")
      .insert({
        client_name,
        client_email,
        engagement_type: engagement_type || "",
        status: "sent",
      })
      .select("id, token")
      .single();

    if (error || !data) {
      console.error("[questionnaire] Insert error:", error);
      return NextResponse.json({ error: "Failed to create questionnaire" }, { status: 500 });
    }

    // Build questionnaire URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const questionnaireUrl = `${baseUrl}/questionnaire/${data.token}`;

    // Send email to client
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

    return NextResponse.json({ id: data.id, token: data.token });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[questionnaire] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
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
