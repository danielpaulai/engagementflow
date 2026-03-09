"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { HeartPulse, ArrowRight, Users, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateHealthScore,
  HEALTH_COLORS,
  HEALTH_LABELS,
  type HealthScoreResult,
} from "@/lib/health-score";

interface SOWRecord {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface HealthCard {
  sow: SOWRecord;
  health: HealthScoreResult;
  daysActive: number;
}

export default function HealthPage() {
  const [cards, setCards] = useState<HealthCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    const supabase = createClient();

    // Fetch active SOWs
    const { data: sowData } = await supabase
      .from("sows")
      .select("id, project_title, customer_name, status, created_at, updated_at")
      .in("status", ["draft", "in_review", "approved", "signed"])
      .order("created_at", { ascending: false });

    const sows = (sowData || []) as SOWRecord[];

    if (sows.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    const sowIds = sows.map((s) => s.id);

    // Fetch version counts per SOW
    const { data: versionData } = await supabase
      .from("sow_versions")
      .select("sow_id")
      .in("sow_id", sowIds);

    const versionCounts: Record<string, number> = {};
    for (const v of (versionData || []) as { sow_id: string }[]) {
      versionCounts[v.sow_id] = (versionCounts[v.sow_id] || 0) + 1;
    }

    // Fetch pending approvals
    const { data: approvalData } = await supabase
      .from("approvals")
      .select("sow_id, created_at")
      .in("sow_id", sowIds)
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
    const healthCards: HealthCard[] = sows.map((sow) => {
      const health = calculateHealthScore({
        created_at: sow.created_at,
        updated_at: sow.updated_at,
        status: sow.status,
        version_count: versionCounts[sow.id] || 0,
        pending_approval_days: pendingDays[sow.id] ?? null,
      });
      const daysActive = Math.floor((now - new Date(sow.created_at).getTime()) / 86400000);
      return { sow, health, daysActive };
    });

    // Sort by score ascending (worst first)
    healthCards.sort((a, b) => a.health.score - b.health.score);

    setCards(healthCards);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const healthyCount = cards.filter((c) => c.health.status === "healthy").length;
  const atRiskCount = cards.filter((c) => c.health.status === "at_risk").length;
  const criticalCount = cards.filter((c) => c.health.status === "critical").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
          <HeartPulse size={20} className="text-[#9333EA]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Client Health</h1>
          <p className="text-gray-500 text-sm">Live risk scores across all active engagements</p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center mx-auto mb-3">
            <Users size={18} className="text-[#9333EA]" />
          </div>
          <p className="text-2xl font-semibold tracking-tighter text-[#9333EA]">{cards.length}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Total Clients</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={18} className="text-[#16A34A]" />
          </div>
          <p className="text-2xl font-semibold tracking-tighter text-[#16A34A]">{healthyCount}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Healthy</p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-200 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={18} className="text-[#EA580C]" />
          </div>
          <p className="text-2xl font-semibold tracking-tighter text-[#EA580C]">{atRiskCount}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">At Risk</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <XCircle size={18} className="text-[#DC2626]" />
          </div>
          <p className="text-2xl font-semibold tracking-tighter text-[#DC2626]">{criticalCount}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Critical</p>
        </div>
      </div>

      {/* Health Cards Grid */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
          <HeartPulse size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No active engagements to score.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const colors = HEALTH_COLORS[card.health.status];
            const label = HEALTH_LABELS[card.health.status];
            const barWidth = Math.round((card.health.score / 10) * 100);

            return (
              <div
                key={card.sow.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col"
              >
                {/* Client & Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{card.sow.project_title || "Untitled"}</p>
                    <p className="text-xs text-gray-400 truncate">{card.sow.customer_name || "Unknown"}</p>
                  </div>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colors.text} ${colors.bg} border ${colors.border}`}>
                    {label}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-end gap-2 mb-3">
                  <span className={`text-4xl font-bold tracking-tighter ${colors.text}`}>{card.health.score}</span>
                  <span className="text-sm text-gray-400 mb-1">/ 10</span>
                </div>

                {/* Score Bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: colors.fill }}
                  />
                </div>

                {/* Deduction Reasons */}
                {card.health.reasons.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {card.health.reasons.map((reason, i) => (
                      <p key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5">-</span>
                        {reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-[11px] text-gray-400">{card.daysActive}d active</span>
                  <Link
                    href={`/sows/${card.sow.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-[#9333EA] hover:text-[#7E22CE] transition-colors"
                  >
                    View SOW
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
