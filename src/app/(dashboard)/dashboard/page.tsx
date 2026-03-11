"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Send,
  XCircle,
  Plus,
  Activity,
  HeartPulse,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateHealthScore } from "@/lib/health-score";
import AnimatedCounter from "@/components/AnimatedCounter";

interface SOWRecord {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  budget_mentioned: string;
  created_at: string;
  updated_at?: string;
}

interface ApprovalRecord {
  id: string;
  sow_id: string;
  status: string;
  reviewer_email: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: "created" | "in_review" | "approved" | "rejected" | "changes_requested";
  title: string;
  subtitle: string;
  time: string;
  sowId: string;
}

const STATUS_ORDER = ["draft", "in_review", "approved", "signed", "rejected"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "Draft", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5", border: "border-gray-200 dark:border-white/10" },
  in_review: { label: "In Review", color: "text-[#9333EA]", bg: "bg-[#F3F0FF] dark:bg-[#9333EA]/10", border: "border-[#9333EA]/20" },
  approved: { label: "Approved", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  signed: { label: "Signed", color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-500/20" },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
};

const ACTIVITY_ICONS: Record<string, typeof FileText> = {
  created: Plus,
  in_review: Send,
  approved: CheckCircle,
  rejected: XCircle,
  changes_requested: AlertTriangle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: "bg-[#F3F0FF] text-[#9333EA] dark:bg-[#9333EA]/15",
  in_review: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  changes_requested: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
};

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function timeAgo(date: string): string {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function parseBudget(budget: string): number {
  if (!budget) return 0;
  const cleaned = budget.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

interface CriticalAlert {
  id: string;
  customer_name: string;
  project_title: string;
  score: number;
}

export default function DashboardPage() {
  const [sows, setSows] = useState<SOWRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [renewals30, setRenewals30] = useState(0);
  const [renewals60, setRenewals60] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch SOWs
      const { data: sowData } = await supabase
        .from("sows")
        .select("id, project_title, customer_name, status, budget_mentioned, created_at, renewal_date")
        .order("created_at", { ascending: false });

      const fetchedSows = (sowData || []) as SOWRecord[];
      setSows(fetchedSows);

      // Fetch approvals for activity feed
      const { data: approvalData } = await supabase
        .from("approvals")
        .select("id, sow_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Build activity feed
      const items: ActivityItem[] = [];

      // SOW creation events
      for (const sow of fetchedSows.slice(0, 10)) {
        items.push({
          id: `sow-${sow.id}`,
          type: "created",
          title: sow.project_title || "Untitled SOW",
          subtitle: `Created for ${sow.customer_name || "Unknown"}`,
          time: sow.created_at,
          sowId: sow.id,
        });
      }

      // Approval events
      for (const a of (approvalData || []) as ApprovalRecord[]) {
        const sow = fetchedSows.find((s) => s.id === a.sow_id);
        const title = sow?.project_title || "SOW";
        const typeMap: Record<string, ActivityItem["type"]> = {
          pending: "in_review",
          approved: "approved",
          rejected: "rejected",
          changes_requested: "changes_requested",
        };
        const type = typeMap[a.status] || "in_review";
        const labelMap: Record<string, string> = {
          pending: "Sent for review",
          approved: "Approved",
          rejected: "Rejected",
          changes_requested: "Changes requested",
        };
        items.push({
          id: `approval-${a.id}`,
          type,
          title,
          subtitle: labelMap[a.status] || a.status,
          time: a.created_at,
          sowId: a.sow_id,
        });
      }

      // Sort by time desc and take top 10
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(items.slice(0, 10));

      // Calculate health scores for critical alerts
      const activeSowsForHealth = fetchedSows.filter(
        (s) => s.status !== "signed" && s.status !== "rejected"
      );
      const alerts: CriticalAlert[] = [];
      for (const s of activeSowsForHealth) {
        const hs = calculateHealthScore({
          created_at: s.created_at,
          updated_at: s.updated_at,
          status: s.status,
          version_count: 0,
          pending_approval_days: null,
        });
        if (hs.score < 5) {
          alerts.push({
            id: s.id,
            customer_name: s.customer_name,
            project_title: s.project_title,
            score: hs.score,
          });
        }
      }
      alerts.sort((a, b) => a.score - b.score);
      setCriticalAlerts(alerts);

      // Renewal counts
      const now30 = Date.now() + 30 * 86400000;
      const now60 = Date.now() + 60 * 86400000;
      let r30 = 0;
      let r60 = 0;
      for (const s of fetchedSows) {
        const rd = (s as SOWRecord & { renewal_date?: string | null }).renewal_date;
        if (!rd || s.status === "rejected") continue;
        const rdTime = new Date(rd).getTime();
        if (rdTime >= Date.now() && rdTime <= now30) r30++;
        if (rdTime >= Date.now() && rdTime <= now60) r60++;
      }
      setRenewals30(r30);
      setRenewals60(r60);

      setLoading(false);
    };

    fetchData();
  }, []);

  // Compute metrics
  const activeSows = sows.filter((s) => s.status !== "signed" && s.status !== "rejected");
  const activeCount = activeSows.length;

  const pipelineValue = sows.reduce((sum, s) => sum + parseBudget(s.budget_mentioned), 0);
  const pipelineInK = pipelineValue >= 1000;
  const pipelineNum = pipelineInK ? Math.round(pipelineValue / 1000) : pipelineValue;

  const signedSows = sows.filter((s) => s.status === "signed");
  const avgDays = signedSows.length > 0
    ? Math.round(signedSows.reduce((sum, s) => sum + daysBetween(s.created_at, s.updated_at || s.created_at), 0) / signedSows.length)
    : 0;

  const now = Date.now();
  const atRisk = sows.filter(
    (s) => s.status === "in_review" && (now - new Date(s.created_at).getTime()) > 7 * 86400000
  ).length;

  // Demo mode: show placeholder numbers when all real metrics are zero
  const isDemo = activeCount === 0 && pipelineNum === 0 && avgDays === 0 && atRisk === 0;

  // Status pipeline counts
  const statusCounts: Record<string, number> = {};
  for (const s of STATUS_ORDER) statusCounts[s] = 0;
  for (const sow of sows) {
    if (statusCounts[sow.status] !== undefined) statusCounts[sow.status]++;
    else statusCounts[sow.status] = 1;
  }

  // Delivery health: active SOWs
  const deliveryItems = activeSows.slice(0, 10);

  const demoMetrics = {
    active: 8,
    pipeline: 142,
    avgDays: 4,
    atRisk: 1,
  };

  const displayActive = isDemo ? demoMetrics.active : activeCount;
  const displayPipeline = isDemo ? demoMetrics.pipeline : pipelineNum;
  const displayAvgDays = isDemo ? demoMetrics.avgDays : avgDays;
  const displayAtRisk = isDemo ? demoMetrics.atRisk : atRisk;
  const displayPipelinePrefix = isDemo ? "\u20AC" : "$";
  const displayPipelineSuffix = isDemo ? "k" : pipelineInK ? "k" : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-end justify-between mb-8 reveal-on-scroll">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-heading font-semibold tracking-tight text-gray-900 dark:text-white">Dashboard</h2>
            {isDemo && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400">
                Demo Data
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your engagement pipeline at a glance.</p>
        </div>
        <Link href="/sows/new">
          <button className="glow-button flex items-center gap-2">
            <Plus size={16} />
            <span>New SOW</span>
          </button>
        </Link>
      </div>

      {/* Critical Health Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-8 premium-card rounded-[2rem] border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 p-5 reveal-on-scroll">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={18} className="text-[#DC2626]" />
            <h2 className="text-sm font-semibold text-[#DC2626]">Critical Health Alerts</h2>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <Link
                key={alert.id}
                href="/health"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-red-100 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#DC2626]">{alert.score}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.customer_name}</p>
                    <p className="text-xs text-gray-400">{alert.project_title}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-[#DC2626] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Renewals Summary */}
      {(renewals30 > 0 || renewals60 > 0) && (
        <div className="mb-8 premium-card rounded-[2rem] border-[#9333EA]/20 bg-[#F3F0FF]/80 dark:bg-[#9333EA]/10 p-5 reveal-on-scroll">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-[#9333EA]" />
              <h2 className="text-sm font-semibold text-[#9333EA]">Upcoming Renewals</h2>
            </div>
            <Link
              href="/renewals"
              className="flex items-center gap-1 text-xs font-medium text-[#9333EA] hover:text-[#7E22CE] transition-colors"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter text-[#DC2626]">{renewals30}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">due in 30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter text-[#EA580C]">{renewals60}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">due in 60 days</span>
            </div>
          </div>
        </div>
      )}

      {/* Main metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Revenue / Pipeline card - spans 2 cols on lg */}
        <div className="md:col-span-2 premium-card rounded-[2.5rem] p-10 relative overflow-hidden reveal-on-scroll">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(at 30% 20%, #9333EA 0px, transparent 60%), radial-gradient(at 70% 80%, #4F46E5 0px, transparent 60%)" }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/15">
                <TrendingUp size={22} className="text-[#9333EA]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pipeline Value</p>
                <p className="text-xs text-gray-400">Total across all SOWs</p>
              </div>
            </div>
            <p className="text-[3rem] font-semibold tracking-tighter text-[#9333EA] leading-none mb-4">
              <AnimatedCounter value={displayPipeline} prefix={displayPipelinePrefix} suffix={displayPipelineSuffix} />
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  <AnimatedCounter value={displayActive} />
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Active SOWs</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
              <div>
                <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  <AnimatedCounter value={displayAvgDays} />
                  <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Avg to sign</p>
              </div>
            </div>
            {/* Progress bar for active SOWs */}
            <div className="mt-6">
              <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((displayActive / Math.max(displayActive + (isDemo ? 4 : signedSows.length), 1)) * 100, 100)}%`,
                    background: "linear-gradient(90deg, #9333EA, #4F46E5)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-gray-400">Active</span>
                <span className="text-[10px] text-gray-400">Signed</span>
              </div>
            </div>
          </div>
        </div>

        {/* At Risk card */}
        <div className="premium-card rounded-[2.5rem] p-10 reveal-on-scroll" style={{ transitionDelay: "100ms" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-500/15 mb-5">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <p className="text-[2.75rem] font-semibold tracking-tighter text-red-500 mb-1">
            <AnimatedCounter value={displayAtRisk} />
          </p>
          <p className="text-sm font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
            At Risk
          </p>
        </div>

        {/* Time card */}
        <div className="premium-card rounded-[2.5rem] p-10 reveal-on-scroll" style={{ transitionDelay: "200ms" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/15 mb-5">
            <Clock size={22} className="text-blue-500" />
          </div>
          <p className="text-[2.75rem] font-semibold tracking-tighter text-blue-500 mb-1">
            <AnimatedCounter value={displayAvgDays} />
          </p>
          <p className="text-sm font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
            Avg Days to Sign
          </p>
        </div>
      </div>

      {/* SOW Pipeline */}
      <div className="mb-10 reveal-on-scroll">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 font-heading">
          SOW Pipeline
        </h2>
        <div className="premium-card rounded-[2rem] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5">
                {STATUS_ORDER.map((status) => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <th key={status} className="px-6 py-3 text-center">
                      <p className={`text-xs font-medium uppercase tracking-wide ${config.color} opacity-70`}>
                        {config.label}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                {STATUS_ORDER.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const count = statusCounts[status] || 0;
                  return (
                    <td key={status} className="px-6 py-6 text-center">
                      <p className={`text-3xl font-semibold tracking-tighter ${config.color}`}>
                        {count}
                      </p>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* At Risk Intelligence */}
      {(displayAtRisk > 0 || isDemo) && (
        <div className="mb-10 reveal-on-scroll">
          <div className="relative bg-[#111] dark:bg-[#111] rounded-[2.5rem] p-10 overflow-hidden text-white">
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={20} className="text-purple-400" />
                <h3 className="text-lg font-heading font-semibold">At Risk Intelligence</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-lg">
                {isDemo
                  ? "SOWs that have been in review for more than 7 days may need attention. Follow up with stakeholders to keep your pipeline moving."
                  : `${displayAtRisk} SOW${displayAtRisk !== 1 ? "s" : ""} in review for over 7 days. Consider following up with stakeholders.`}
              </p>
              <Link
                href="/health"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #9333EA, #4F46E5)" }}
              >
                View Health Dashboard
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Two-column: Activity Feed + Delivery Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="reveal-on-scroll premium-card rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
              <Activity size={16} className="text-[#9333EA]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-xs text-gray-400">Latest events across your SOWs</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-400">No activity yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {activities.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] || FileText;
                const colorClass = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.created;
                return (
                  <Link
                    key={item.id}
                    href={`/sows/${item.sowId}`}
                    className="px-8 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(item.time)}</span>
                      <ArrowRight size={12} className="text-gray-300 group-hover:text-[#9333EA] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery Health */}
        <div className="reveal-on-scroll premium-card rounded-[2.5rem] overflow-hidden" style={{ transitionDelay: "100ms" }}>
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#9333EA]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Health</h2>
              <p className="text-xs text-gray-400">Active SOW age and status</p>
            </div>
          </div>

          {deliveryItems.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-400">No active SOWs.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {deliveryItems.map((sow) => {
                const age = daysSince(sow.created_at);
                const healthColor = age <= 14
                  ? "bg-emerald-500"
                  : age <= 30
                    ? "bg-orange-400"
                    : "bg-red-500";
                const healthLabel = age <= 14 ? "Healthy" : age <= 30 ? "Aging" : "At Risk";
                const statusConf = STATUS_CONFIG[sow.status] || STATUS_CONFIG.draft;

                return (
                  <Link
                    key={sow.id}
                    href={`/sows/${sow.id}`}
                    className="px-8 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
                  >
                    {/* Health dot */}
                    <div className="flex-shrink-0" title={healthLabel}>
                      <div className={`w-3 h-3 rounded-full ${healthColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {sow.project_title || "Untitled"}
                      </p>
                      <p className="text-xs text-gray-400">{sow.customer_name || "Unknown"}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">{age}d</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase ${statusConf.color} ${statusConf.bg}`}>
                        {statusConf.label}
                      </span>
                      <ArrowRight size={12} className="text-gray-300 group-hover:text-[#9333EA] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="mt-10 reveal-on-scroll">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white dark:border-white/10 rounded-[2rem] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-400">All systems operational</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{sows.length} total SOWs</span>
            <span>{activeSows.length} active</span>
            <span>{signedSows.length} signed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
