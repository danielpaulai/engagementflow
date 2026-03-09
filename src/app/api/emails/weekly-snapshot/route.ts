import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendEmail";
import { calculateHealthScore } from "@/lib/health-score";

interface SOWRow {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  budget_mentioned: string;
  created_at: string;
  updated_at?: string;
  renewal_date?: string | null;
}

function parseBudget(budget: string): number {
  if (!budget) return 0;
  const cleaned = budget.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `$${value.toLocaleString()}`;
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function buildSnapshotEmail({
  activeSowCount,
  pipelineValue,
  atRiskCount,
  renewalsDueCount,
  criticalAlerts,
  upcomingRenewals,
  stuckApprovals,
  date,
}: {
  activeSowCount: number;
  pipelineValue: string;
  atRiskCount: number;
  renewalsDueCount: number;
  criticalAlerts: { customer_name: string; project_title: string; score: number }[];
  upcomingRenewals: { customer_name: string; project_title: string; daysLeft: number }[];
  stuckApprovals: { customer_name: string; project_title: string; daysWaiting: number }[];
  date: string;
}): string {
  const statBox = (label: string, value: string, color: string) => `
    <td style="width:25%;padding:8px;">
      <div style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:20px 16px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:${color};">${value}</p>
        <p style="margin:4px 0 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">${label}</p>
      </div>
    </td>`;

  const criticalSection =
    criticalAlerts.length > 0
      ? `
    <div style="margin:24px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.08em;">Critical Health Alerts</p>
      ${criticalAlerts
        .map(
          (a) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:6px;background:#ffffff;border-radius:12px;border:1px solid #fee2e2;">
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0A0A0B;">${a.customer_name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${a.project_title}</p>
          </div>
          <span style="font-size:20px;font-weight:800;color:#DC2626;">${a.score}</span>
        </div>`
        )
        .join("")}
    </div>`
      : "";

  const renewalsSection =
    upcomingRenewals.length > 0
      ? `
    <div style="margin:24px 0;background:#F3F0FF;border:1px solid #d8b4fe;border-radius:16px;padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9333EA;text-transform:uppercase;letter-spacing:0.08em;">Renewals Due in 30 Days</p>
      ${upcomingRenewals
        .map(
          (r) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:6px;background:#ffffff;border-radius:12px;border:1px solid #e9d5ff;">
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0A0A0B;">${r.customer_name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${r.project_title}</p>
          </div>
          <span style="font-size:13px;font-weight:700;color:#9333EA;">${r.daysLeft}d</span>
        </div>`
        )
        .join("")}
    </div>`
      : "";

  const stuckSection =
    stuckApprovals.length > 0
      ? `
    <div style="margin:24px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px 24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:0.08em;">Pending Approval Over 5 Days</p>
      ${stuckApprovals
        .map(
          (s) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:6px;background:#ffffff;border-radius:12px;border:1px solid #fef3c7;">
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0A0A0B;">${s.customer_name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${s.project_title}</p>
          </div>
          <span style="font-size:13px;font-weight:700;color:#D97706;">${s.daysWaiting}d waiting</span>
        </div>`
        )
        .join("")}
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
      <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Weekly Executive Snapshot</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        Here is your weekly summary for <strong style="color:#0A0A0B;">${date}</strong>.
      </p>

      <!-- Stat Boxes -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
        <tr>
          ${statBox("Active SOWs", String(activeSowCount), "#9333EA")}
          ${statBox("Pipeline", pipelineValue, "#9333EA")}
          ${statBox("At Risk", String(atRiskCount), atRiskCount > 0 ? "#DC2626" : "#16A34A")}
          ${statBox("Renewals Due", String(renewalsDueCount), renewalsDueCount > 0 ? "#EA580C" : "#16A34A")}
        </tr>
      </table>

      ${criticalSection}
      ${renewalsSection}
      ${stuckSection}

      ${criticalAlerts.length === 0 && upcomingRenewals.length === 0 && stuckApprovals.length === 0 ? `
      <div style="margin:24px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:24px;text-align:center;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#059669;">All clear this week. No critical issues or upcoming deadlines.</p>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#fafafa;padding:24px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 24px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        Sent from EngagementFlow &middot;
        <a href="#" style="color:#9333EA;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fetch all SOWs
    const { data: sowData } = await supabaseAdmin
      .from("sows")
      .select("id, project_title, customer_name, status, budget_mentioned, created_at, updated_at, renewal_date")
      .order("created_at", { ascending: false });

    const sows = (sowData || []) as SOWRow[];

    // Active SOWs
    const activeSows = sows.filter((s) => s.status !== "signed" && s.status !== "rejected");

    // Pipeline value
    const pipelineValue = sows.reduce((sum, s) => sum + parseBudget(s.budget_mentioned), 0);

    // Fetch version counts
    const activeIds = activeSows.map((s) => s.id);
    const { data: versionData } = await supabaseAdmin
      .from("sow_versions")
      .select("sow_id")
      .in("sow_id", activeIds.length > 0 ? activeIds : ["__none__"]);

    const versionCounts: Record<string, number> = {};
    for (const v of (versionData || []) as { sow_id: string }[]) {
      versionCounts[v.sow_id] = (versionCounts[v.sow_id] || 0) + 1;
    }

    // Fetch pending approvals
    const { data: approvalData } = await supabaseAdmin
      .from("approvals")
      .select("sow_id, created_at")
      .in("sow_id", activeIds.length > 0 ? activeIds : ["__none__"])
      .eq("status", "pending");

    const pendingDays: Record<string, number> = {};
    const now = Date.now();
    for (const a of (approvalData || []) as { sow_id: string; created_at: string }[]) {
      const days = Math.floor((now - new Date(a.created_at).getTime()) / 86400000);
      if (!pendingDays[a.sow_id] || days > pendingDays[a.sow_id]) {
        pendingDays[a.sow_id] = days;
      }
    }

    // Calculate health scores
    const criticalAlerts: { customer_name: string; project_title: string; score: number }[] = [];
    let atRiskCount = 0;

    for (const s of activeSows) {
      const hs = calculateHealthScore({
        created_at: s.created_at,
        updated_at: s.updated_at,
        status: s.status,
        version_count: versionCounts[s.id] || 0,
        pending_approval_days: pendingDays[s.id] ?? null,
      });

      if (hs.score < 5) {
        criticalAlerts.push({
          customer_name: s.customer_name || "Unknown",
          project_title: s.project_title || "Untitled",
          score: hs.score,
        });
      }
      if (hs.status === "at_risk" || hs.status === "critical") {
        atRiskCount++;
      }
    }

    criticalAlerts.sort((a, b) => a.score - b.score);

    // Renewals due within 60 days
    const renewalsDue = sows.filter((s) => {
      if (!s.renewal_date || s.status === "rejected") return false;
      const days = daysUntil(s.renewal_date);
      return days >= 0 && days <= 60;
    });

    // Renewals due within 30 days (for detail section)
    const upcomingRenewals = sows
      .filter((s) => {
        if (!s.renewal_date || s.status === "rejected") return false;
        const days = daysUntil(s.renewal_date);
        return days >= 0 && days <= 30;
      })
      .map((s) => ({
        customer_name: s.customer_name || "Unknown",
        project_title: s.project_title || "Untitled",
        daysLeft: daysUntil(s.renewal_date!),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // SOWs stuck in in_review for over 5 days
    const stuckApprovals = activeSows
      .filter((s) => s.status === "in_review" && pendingDays[s.id] > 5)
      .map((s) => ({
        customer_name: s.customer_name || "Unknown",
        project_title: s.project_title || "Untitled",
        daysWaiting: pendingDays[s.id],
      }))
      .sort((a, b) => b.daysWaiting - a.daysWaiting);

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = buildSnapshotEmail({
      activeSowCount: activeSows.length,
      pipelineValue: formatCurrency(pipelineValue),
      atRiskCount,
      renewalsDueCount: renewalsDue.length,
      criticalAlerts,
      upcomingRenewals,
      stuckApprovals,
      date: dateStr,
    });

    await sendEmail({
      to: email,
      subject: `Your EngagementFlow Weekly Snapshot - ${dateStr}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Weekly snapshot error:", err);
    return NextResponse.json({ error: "Failed to send snapshot" }, { status: 500 });
  }
}
