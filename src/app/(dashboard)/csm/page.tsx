"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  HeartPulse,
  Loader2,
  Send,
  ArrowRight,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateHealthScore,
  HEALTH_COLORS,
  HEALTH_LABELS,
} from "@/lib/health-score";
import type { HealthScoreResult } from "@/lib/health-score";
import AnimatedCounter from "@/components/AnimatedCounter";

interface SOW {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  budget_mentioned: string;
  created_at: string;
  updated_at: string;
  renewal_date: string | null;
}

interface Approval {
  id: string;
  sow_id: string;
  status: string;
  reviewer_email: string;
  created_at: string;
}

interface ClientHealth {
  sow: SOW;
  health: HealthScoreResult;
  versionCount: number;
  pendingDays: number | null;
}

interface StuckApproval {
  approval: Approval;
  sow: SOW;
  daysWaiting: number;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function CSMPage() {
  const [clients, setClients] = useState<ClientHealth[]>([]);
  const [stuckApprovals, setStuckApprovals] = useState<StuckApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderResult, setReminderResult] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch SOWs
    const { data: sows } = await supabase
      .from("sows")
      .select("id, project_title, customer_name, status, budget_mentioned, created_at, updated_at, renewal_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const allSows = (sows || []) as SOW[];
    const activeSows = allSows.filter((s) =>
      ["draft", "in_review", "approved"].includes(s.status)
    );
    const sowIds = activeSows.map((s) => s.id);

    if (sowIds.length === 0) {
      setClients([]);
      setStuckApprovals([]);
      setLoading(false);
      return;
    }

    // Fetch versions for revision counts
    const { data: versions } = await supabase
      .from("sow_versions")
      .select("sow_id")
      .in("sow_id", sowIds);

    const versionCounts: Record<string, number> = {};
    (versions || []).forEach((v: { sow_id: string }) => {
      versionCounts[v.sow_id] = (versionCounts[v.sow_id] || 0) + 1;
    });

    // Fetch pending approvals
    const { data: approvals } = await supabase
      .from("approvals")
      .select("id, sow_id, status, reviewer_email, created_at")
      .in("sow_id", sowIds)
      .eq("status", "pending");

    const pendingMap: Record<string, number> = {};
    const pendingApprovals = (approvals || []) as Approval[];
    pendingApprovals.forEach((a) => {
      const days = daysSince(a.created_at);
      if (!pendingMap[a.sow_id] || days > pendingMap[a.sow_id]) {
        pendingMap[a.sow_id] = days;
      }
    });

    // Calculate health for each active SOW
    const clientHealthList: ClientHealth[] = activeSows.map((sow) => {
      const vc = versionCounts[sow.id] || 0;
      const pd = pendingMap[sow.id] ?? null;
      const health = calculateHealthScore({
        created_at: sow.created_at,
        updated_at: sow.updated_at,
        status: sow.status,
        version_count: vc,
        pending_approval_days: pd,
      });
      return { sow, health, versionCount: vc, pendingDays: pd };
    });

    // Sort by health score ascending (worst first)
    clientHealthList.sort((a, b) => a.health.score - b.health.score);
    setClients(clientHealthList);

    // Stuck approvals: pending > 5 days
    const sowMap: Record<string, SOW> = {};
    activeSows.forEach((s) => (sowMap[s.id] = s));

    const stuck: StuckApproval[] = pendingApprovals
      .map((a) => ({
        approval: a,
        sow: sowMap[a.sow_id],
        daysWaiting: daysSince(a.created_at),
      }))
      .filter((s) => s.daysWaiting > 5 && s.sow)
      .sort((a, b) => b.daysWaiting - a.daysWaiting);

    setStuckApprovals(stuck);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSendReminder = async (sowId: string) => {
    setSendingReminder(sowId);
    try {
      const res = await fetch(`/api/sows/${sowId}/approve`, { method: "PATCH" });
      if (res.ok) {
        setReminderResult((prev) => ({ ...prev, [sowId]: "Reminder sent" }));
      } else {
        const data = await res.json().catch(() => ({}));
        setReminderResult((prev) => ({ ...prev, [sowId]: data.error || "Failed" }));
      }
    } catch {
      setReminderResult((prev) => ({ ...prev, [sowId]: "Failed to send" }));
    }
    setSendingReminder(null);
    setTimeout(() => {
      setReminderResult((prev) => {
        const next = { ...prev };
        delete next[sowId];
        return next;
      });
    }, 3000);
  };

  // Computed stats
  const totalActive = clients.length;
  const atRiskCount = clients.filter((c) => c.health.score < 5).length;
  const renewalsDue60 = clients.filter(
    (c) => c.sow.renewal_date && daysUntil(c.sow.renewal_date) <= 60 && daysUntil(c.sow.renewal_date) > 0
  ).length;
  const stuckCount = stuckApprovals.length;

  // Upcoming renewals (within 60 days)
  const upcomingRenewals = clients
    .filter((c) => c.sow.renewal_date && daysUntil(c.sow.renewal_date) <= 60 && daysUntil(c.sow.renewal_date) > 0)
    .sort((a, b) => daysUntil(a.sow.renewal_date!) - daysUntil(b.sow.renewal_date!));

  // At risk accounts
  const atRiskAccounts = clients.filter((c) => c.health.score < 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with animated blobs */}
      <div className="relative mb-8 reveal-on-scroll">
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-purple-300/15 blur-[120px] animate-float-slow pointer-events-none" />
        <div className="absolute -top-10 -left-20 w-[200px] h-[200px] rounded-full bg-[#4F46E5]/10 blur-[100px] animate-float-medium pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
            <Users size={20} className="text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Customer Success</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor and manage all active client engagements</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Active Clients", value: totalActive, icon: Users, color: "text-[#9333EA]", bg: "bg-[#F3F0FF] dark:bg-[#9333EA]/15" },
          { label: "At Risk", value: atRiskCount, icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15" },
          { label: "Renewals Due (60d)", value: renewalsDue60, icon: RefreshCw, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15" },
          { label: "Stuck Approvals", value: stuckCount, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="reveal-on-scroll bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 dark:border-white/10 p-6"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <p className={`text-3xl font-semibold tracking-tight ${stat.color}`}>
              <AnimatedCounter value={stat.value} />
            </p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* LEFT COLUMN - Client Health Board */}
        <div className="col-span-3">
          <div className="reveal-on-scroll bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 dark:border-white/10 overflow-hidden">
            <div className="px-8 py-5 bg-[#0A0A0B] border-b border-white/10">
              <div className="flex items-center gap-2">
                <HeartPulse size={16} className="text-[#9333EA]" />
                <h2 className="text-sm font-semibold text-white">Client Health Board</h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Sorted by health score — worst first</p>
            </div>

            {clients.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-400">No active client engagements.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {clients.map((c) => {
                  const colors = HEALTH_COLORS[c.health.status];
                  const age = daysSince(c.sow.created_at);
                  const renewalDays = c.sow.renewal_date ? daysUntil(c.sow.renewal_date) : null;

                  return (
                    <Link
                      key={c.sow.id}
                      href={`/sows/${c.sow.id}`}
                      className="flex items-center gap-4 px-8 py-4 hover:bg-[#FDFCFF] dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Health indicator */}
                      <div className="relative flex-shrink-0">
                        {c.health.score < 5 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        )}
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {c.health.score}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.sow.customer_name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.sow.project_title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{age}d old</span>
                          {renewalDays !== null && (
                            <span className={renewalDays <= 30 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                              {renewalDays > 0 ? `${renewalDays}d to renewal` : "Renewal overdue"}
                            </span>
                          )}
                          {c.sow.updated_at && (
                            <span>Updated {formatDate(c.sow.updated_at)}</span>
                          )}
                        </div>
                      </div>

                      {/* Badge */}
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border flex-shrink-0`}>
                        {HEALTH_LABELS[c.health.status]}
                      </div>

                      <ArrowRight size={14} className="text-gray-300 group-hover:text-[#9333EA] transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Action Items */}
        <div className="col-span-2 space-y-6">
          {/* Stuck Approvals */}
          <div className="reveal-on-scroll bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 dark:border-white/10 overflow-hidden" style={{ transitionDelay: "100ms" }}>
            <div className="px-6 py-4 bg-[#0A0A0B] border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Stuck Approvals</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Pending more than 5 days</p>
            </div>

            {stuckApprovals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-400">No stuck approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {stuckApprovals.map((s) => (
                  <div key={s.approval.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.sow.customer_name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.sow.project_title}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.approval.reviewer_email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-xs font-medium text-red-500">{s.daysWaiting}d waiting</span>
                        <button
                          onClick={() => handleSendReminder(s.sow.id)}
                          disabled={sendingReminder === s.sow.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] hover:bg-[#E9D5FF] dark:hover:bg-[#9333EA]/25 transition-colors disabled:opacity-50"
                        >
                          {sendingReminder === s.sow.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Send size={11} />
                          )}
                          Remind
                        </button>
                        {reminderResult[s.sow.id] && (
                          <span className={`text-xs ${reminderResult[s.sow.id] === "Reminder sent" ? "text-emerald-600" : "text-red-500"}`}>
                            {reminderResult[s.sow.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Renewals */}
          <div className="reveal-on-scroll bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 dark:border-white/10 overflow-hidden" style={{ transitionDelay: "200ms" }}>
            <div className="px-6 py-4 bg-[#0A0A0B] border-b border-white/10">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Upcoming Renewals</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Due within 60 days</p>
            </div>

            {upcomingRenewals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-400">No upcoming renewals</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {upcomingRenewals.map((c) => {
                  const days = daysUntil(c.sow.renewal_date!);
                  return (
                    <div key={c.sow.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.sow.customer_name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.sow.project_title}</p>
                          {c.sow.budget_mentioned && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{c.sow.budget_mentioned}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-medium ${days <= 30 ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}>
                            {days}d remaining
                          </span>
                          <Link
                            href="/renewals"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] hover:bg-[#E9D5FF] dark:hover:bg-[#9333EA]/25 transition-colors"
                          >
                            <FileText size={11} />
                            Draft Renewal
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* At Risk Accounts */}
          <div className="reveal-on-scroll bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 dark:border-white/10 overflow-hidden" style={{ transitionDelay: "300ms" }}>
            <div className="px-6 py-4 bg-[#0A0A0B] border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                <h3 className="text-sm font-semibold text-white">At Risk Accounts</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Health score below 5</p>
            </div>

            {atRiskAccounts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-400">No at-risk accounts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {atRiskAccounts.map((c) => (
                  <Link
                    key={c.sow.id}
                    href={`/sows/${c.sow.id}`}
                    className="flex items-start gap-3 px-6 py-4 hover:bg-[#FDFCFF] dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">{c.health.score}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.sow.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.sow.project_title}</p>
                      {c.health.reasons.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {c.health.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
