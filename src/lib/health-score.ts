export interface HealthScoreInput {
  created_at: string;
  updated_at?: string;
  status: string;
  version_count: number;
  pending_approval_days: number | null; // null = no pending approvals
}

export interface HealthScoreResult {
  score: number;
  status: "healthy" | "at_risk" | "critical";
  reasons: string[];
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const now = Date.now();
  const ageDays = Math.floor((now - new Date(input.created_at).getTime()) / 86400000);

  // SOW age scoring (base 10)
  if (ageDays <= 7) {
    score += 10;
  } else if (ageDays <= 14) {
    score += 8;
  } else if (ageDays <= 30) {
    score += 6;
    reasons.push(`SOW is ${ageDays} days old`);
  } else if (ageDays <= 60) {
    score += 4;
    reasons.push(`SOW is ${ageDays} days old, aging`);
  } else {
    score += 2;
    reasons.push(`SOW is ${ageDays} days old, stale`);
  }

  // Status modifier: adjust score relative to the age base
  const statusModifiers: Record<string, number> = {
    draft: -2,
    in_review: -4,
    approved: -1,
    signed: 0,
    rejected: -8,
  };
  const statusMod = statusModifiers[input.status] ?? -2;
  score += statusMod;

  if (input.status === "rejected") {
    reasons.push("SOW was rejected");
  }
  if (input.status === "draft" && ageDays > 7) {
    reasons.push("Still in draft after 7+ days");
  }

  // Days stuck in current status
  if (input.updated_at) {
    const statusDays = Math.floor((now - new Date(input.updated_at).getTime()) / 86400000);
    const deduction = Math.floor(statusDays / 7);
    if (deduction > 0) {
      score -= deduction;
      reasons.push(`${statusDays} days in "${input.status}" status`);
    }
  }

  // Revision count penalty beyond 3
  if (input.version_count > 3) {
    const extraVersions = input.version_count - 3;
    const versionPenalty = extraVersions * 0.5;
    score -= versionPenalty;
    reasons.push(`${input.version_count} revisions (${extraVersions} beyond normal)`);
  }

  // Pending approval response time
  if (input.pending_approval_days !== null && input.pending_approval_days > 5) {
    score -= 2;
    reasons.push(`Approval pending for ${input.pending_approval_days} days`);
  }

  // Clamp between 1 and 10
  score = Math.max(1, Math.min(10, score));
  score = Math.round(score * 10) / 10;

  let status: HealthScoreResult["status"];
  if (score >= 8) {
    status = "healthy";
  } else if (score >= 5) {
    status = "at_risk";
  } else {
    status = "critical";
  }

  return { score, status, reasons };
}

export const HEALTH_COLORS = {
  healthy: { text: "text-[#16A34A]", bg: "bg-emerald-50", border: "border-emerald-200", fill: "#16A34A" },
  at_risk: { text: "text-[#EA580C]", bg: "bg-orange-50", border: "border-orange-200", fill: "#EA580C" },
  critical: { text: "text-[#DC2626]", bg: "bg-red-50", border: "border-red-200", fill: "#DC2626" },
};

export const HEALTH_LABELS = {
  healthy: "Healthy",
  at_risk: "At Risk",
  critical: "Critical",
};
