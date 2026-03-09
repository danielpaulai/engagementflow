import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ChangeOrderLine {
  item: string;
  reason: string;
  estimated_effort: string;
  matched_service: string | null;
  hours_min: number;
  hours_max: number;
  rate: number;
  currency: string;
}

interface SendChangeOrderBody {
  recipient_email: string;
  personal_message?: string;
  change_order_number: string;
  date: string;
  original_sow_title: string;
  original_sow_customer: string;
  sow_id: string;
  line_items: ChangeOrderLine[];
  total_min: number;
  total_max: number;
  currency: string;
  pdf_base64: string;
}

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "\u20AC";
  if (currency === "GBP") return "\u00A3";
  return `${currency} `;
}

function buildChangeOrderEmail({
  original_sow_title,
  original_sow_customer,
  change_order_number,
  line_items,
  total_min,
  total_max,
  currency,
  personal_message,
}: {
  original_sow_title: string;
  original_sow_customer: string;
  change_order_number: string;
  line_items: ChangeOrderLine[];
  total_min: number;
  total_max: number;
  currency: string;
  personal_message?: string;
}): string {
  const sym = currencySymbol(currency);

  const tableRows = line_items
    .map(
      (li, i) => `
      <tr style="background:${i % 2 === 1 ? "#F9F5FF" : "#ffffff"};">
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${li.item}</td>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;text-align:center;border-bottom:1px solid #f3f4f6;">${li.hours_min}-${li.hours_max}</td>
        <td style="padding:12px 16px;font-size:13px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">${li.rate > 0 ? `${sym}${li.rate.toLocaleString()}` : "TBD"}</td>
      </tr>`
    )
    .join("");

  const personalBlock = personal_message
    ? `
    <div style="background:#F9F8FF;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${personal_message.replace(/\n/g, "<br/>")}</p>
    </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9F8FF;font-family:'Inter',Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#F9F8FF;">
    <!-- Header -->
    <div style="background:#0A0A0B;padding:32px 40px;border-radius:24px 24px 0 0;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
        <span style="color:#9333EA;">&#9889;</span> EngagementFlow
      </h1>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Change Order ${change_order_number}</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;font-size:14px;color:#374151;">Dear ${original_sow_customer},</p>

      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Please find attached a Change Order for work identified outside the original scope of
        <strong style="color:#111827;">${original_sow_title}</strong>.
        Review the items below and sign to authorise the additional work.
      </p>

      ${personalBlock}

      <!-- Summary Table -->
      <div style="border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr style="background:#1A1A2E;">
            <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ffffff;text-align:left;">Item</th>
            <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ffffff;text-align:center;">Hours</th>
            <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ffffff;text-align:right;">Fee</th>
          </tr>
          ${tableRows}
        </table>
      </div>

      <!-- Total -->
      <div style="background:#F3F0FF;border:1px solid #d8b4fe;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:32px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9333EA;">Total Additional Fee</p>
        <p style="margin:0;font-size:28px;font-weight:800;color:#9333EA;letter-spacing:-0.03em;">
          ${sym}${total_min.toLocaleString()} &ndash; ${sym}${total_max.toLocaleString()}
        </p>
      </div>

      <!-- Action Buttons -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-right:8px;" width="50%">
            <a href="#approve" style="display:block;background:linear-gradient(135deg,#9333EA,#4F46E5);color:#ffffff;padding:14px 24px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;">
              Approve Change Order
            </a>
          </td>
          <td style="padding-left:8px;" width="50%">
            <a href="#call" style="display:block;background:#ffffff;color:#9333EA;padding:14px 24px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;border:2px solid #9333EA;">
              Request a Call
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#fafafa;padding:24px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 24px 24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#374151;font-weight:600;">EngagementFlow</p>
      <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;">
        This Change Order was generated automatically from a scope analysis.<br/>
        Please reply to this email or contact your account manager with any questions.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendChangeOrderBody;

    const {
      recipient_email,
      personal_message,
      change_order_number,
      date,
      original_sow_title,
      original_sow_customer,
      sow_id,
      line_items,
      total_min,
      total_max,
      currency,
      pdf_base64,
    } = body;

    if (!recipient_email) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    if (!pdf_base64) {
      return NextResponse.json({ error: "PDF attachment is required" }, { status: 400 });
    }

    // Build email HTML
    const html = buildChangeOrderEmail({
      original_sow_title,
      original_sow_customer,
      change_order_number,
      line_items,
      total_min,
      total_max,
      currency,
      personal_message,
    });

    // Send via Resend with PDF attachment
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "EngagementFlow <onboarding@resend.dev>",
      to: recipient_email,
      subject: `Change Order ${change_order_number} - ${original_sow_customer} - Action Required`,
      html,
      attachments: [
        {
          filename: `Change_Order_${change_order_number}.pdf`,
          content: pdf_base64,
        },
      ],
    });

    if (emailError) {
      console.error("[send-change-order] Resend error:", JSON.stringify(emailError, null, 2));
      return NextResponse.json(
        { error: `Email failed: ${emailError.message || JSON.stringify(emailError)}` },
        { status: 500 }
      );
    }

    console.log("[send-change-order] Email sent. ID:", emailData?.id);

    // Save record to approvals table
    const { error: insertError } = await supabaseAdmin.from("approvals").insert({
      sow_id: sow_id,
      status: "pending_change_order",
      reviewer_email: recipient_email,
      reviewer_comments: `Change Order ${change_order_number} sent on ${date}. Items: ${line_items.map((li) => li.item).join(", ")}`,
    });

    if (insertError) {
      console.error("[send-change-order] Approval record insert error:", insertError);
    }

    return NextResponse.json({
      success: true,
      email_id: emailData?.id,
      change_order_number,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[send-change-order] Error:", error.message, error.stack);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
