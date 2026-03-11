import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://engagementflow.vercel.app";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  console.log("[sendEmail] Sending to:", to, "| Subject:", subject);
  console.log("[sendEmail] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
  console.log("[sendEmail] RESEND_API_KEY prefix:", process.env.RESEND_API_KEY?.slice(0, 8) || "MISSING");

  const { data, error } = await resend.emails.send({
    from: "EngagementFlow <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[sendEmail] Resend error:", JSON.stringify(error, null, 2));
    const err = new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
    (err as Error & { resendError: unknown }).resendError = error;
    throw err;
  }

  console.log("[sendEmail] Success. Email ID:", data?.id);
  return data;
}

export function reviewRequestEmail({
  projectTitle,
  customerName,
  sowId,
}: {
  projectTitle: string;
  customerName: string;
  sowId: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F9F8FF;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#0A0A0B;padding:32px 40px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
        <span style="color:#9333EA;">&#9889;</span> EngagementFlow
      </h1>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;color:#0A0A0B;font-size:22px;font-weight:600;letter-spacing:-0.02em;">
        SOW Review Required
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        You have been asked to review the following Statement of Work.
      </p>
      <div style="background:#F9F8FF;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#9333EA;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
          Project
        </p>
        <p style="margin:0 0 16px;color:#0A0A0B;font-size:18px;font-weight:600;">
          ${projectTitle}
        </p>
        <p style="margin:0 0 4px;color:#9333EA;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
          Customer
        </p>
        <p style="margin:0;color:#0A0A0B;font-size:16px;">
          ${customerName}
        </p>
      </div>
      <a href="${BASE_URL}/sows/${sowId}/review"
         style="display:inline-block;background:linear-gradient(135deg,#9333EA,#4F46E5);color:#ffffff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;">
        Open Review
      </a>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        Sent from EngagementFlow
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function reviewDecisionEmail({
  projectTitle,
  decision,
  reviewerComments,
}: {
  projectTitle: string;
  decision: "approved" | "changes_requested" | "rejected";
  reviewerComments?: string;
}) {
  const decisionLabels: Record<string, string> = {
    approved: "Approved",
    changes_requested: "Changes Requested",
    rejected: "Rejected",
  };

  const decisionColors: Record<string, string> = {
    approved: "#059669",
    changes_requested: "#d97706",
    rejected: "#dc2626",
  };

  const decisionBg: Record<string, string> = {
    approved: "#ecfdf5",
    changes_requested: "#fffbeb",
    rejected: "#fef2f2",
  };

  const label = decisionLabels[decision];
  const color = decisionColors[decision];
  const bg = decisionBg[decision];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F9F8FF;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#0A0A0B;padding:32px 40px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
        <span style="color:#9333EA;">&#9889;</span> EngagementFlow
      </h1>
    </div>
    <div style="padding:40px;">
      <div style="display:inline-block;background:${bg};color:${color};padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:600;margin-bottom:16px;">
        ${label}
      </div>
      <h2 style="margin:0 0 8px;color:#0A0A0B;font-size:22px;font-weight:600;letter-spacing:-0.02em;">
        ${projectTitle}
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        A reviewer has submitted their decision on this SOW.
      </p>
      ${reviewerComments ? `
      <div style="background:#F9F8FF;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#9333EA;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
          Reviewer Comments
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
          ${reviewerComments}
        </p>
      </div>
      ` : ""}
      <a href="${BASE_URL}/sows"
         style="display:inline-block;background:linear-gradient(135deg,#9333EA,#4F46E5);color:#ffffff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;">
        View SOWs
      </a>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        Sent from EngagementFlow
      </p>
    </div>
  </div>
</body>
</html>`;
}
