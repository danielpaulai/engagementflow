"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Send,
  XCircle,
  Plus,
  Activity,
  HeartPulse,
  RefreshCw,
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
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
  in_review: { label: "In Review", color: "text-[#9333EA]", bg: "bg-[#F3F0FF]", border: "border-[#9333EA]/20" },
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  signed: { label: "Signed", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const ACTIVITY_ICONS: Record<string, typeof FileText> = {
  created: Plus,
  in_review: Send,
  approved: CheckCircle,
  rejected: XCircle,
  changes_requested: AlertTriangle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: "bg-[#F3F0FF] text-[#9333EA]",
  in_review: "bg-blue-50 text-blue-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
  changes_requested: "bg-orange-50 text-orange-600",
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

  // Status pipeline counts
  const statusCounts: Record<string, number> = {};
  for (const s of STATUS_ORDER) statusCounts[s] = 0;
  for (const sow of sows) {
    if (statusCounts[sow.status] !== undefined) statusCounts[sow.status]++;
    else statusCounts[sow.status] = 1;
  }

  // Delivery health: active SOWs
  const deliveryItems = activeSows.slice(0, 10);

  const metrics = [
    { label: "ACTIVE SOWS", value: activeCount, icon: FileText, prefix: "", suffix: "" },
    { label: "PIPELINE VALUE", value: pipelineNum, icon: DollarSign, prefix: "$", suffix: pipelineInK ? "k" : "" },
    { label: "AVG DAYS TO SIGN", value: avgDays, icon: Clock, prefix: "", suffix: "" },
    { label: "AT RISK", value: atRisk, icon: AlertTriangle, prefix: "", suffix: "" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="relative rounded-[2rem] bg-[#0A0A0B] h-56 mb-10 overflow-hidden flex items-center px-12 reveal-on-scroll">
        <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] rounded-full bg-purple-300/20 blur-[120px] animate-float-slow pointer-events-none" />
        <div className="absolute bottom-[-200px] left-[-150px] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/30 blur-[100px] animate-float-medium pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-5xl font-semibold text-white tracking-tighter">Welcome to EngagementFlow</h1>
          <p className="text-gray-400 mt-3 text-lg">Manage your SOWs, track engagement, and close deals faster.</p>
        </div>
      </div>

      {/* Critical Health Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50/80 backdrop-blur-sm p-5 reveal-on-scroll">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={18} className="text-[#DC2626]" />
            <h2 className="text-sm font-semibold text-[#DC2626]">Critical Health Alerts</h2>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <Link
                key={alert.id}
                href="/health"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-red-100 hover:border-red-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#DC2626]">{alert.score}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.customer_name}</p>
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
        <div className="mb-8 rounded-[2rem] border border-[#9333EA]/20 bg-[#F3F0FF]/80 backdrop-blur-sm p-5 reveal-on-scroll">
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
              <span className="text-xs text-gray-600">due in 30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter text-[#EA580C]">{renewals60}</span>
              <span className="text-xs text-gray-600">due in 60 days</span>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            className="reveal-on-scroll bg-white/80 backdrop-blur-sm rounded-[32px] p-10 shadow-sm border border-white/60"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-[#F3F0FF]">
              <metric.icon size={22} className="text-[#9333EA]" />
            </div>
            <p className="text-[2.75rem] font-semibold tracking-tighter text-[#9333EA] mb-1">
              <AnimatedCounter value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
            </p>
            <p className="text-sm font-medium tracking-wider text-gray-500 uppercase">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      {/* SOW Status Pipeline */}
      <div className="mb-10 reveal-on-scroll">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-4">
          SOW Pipeline
        </h2>
        <div className="flex gap-4">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const count = statusCounts[status] || 0;
            return (
              <div
                key={status}
                className={`flex-1 rounded-[32px] border ${config.border} ${config.bg}/80 backdrop-blur-sm p-6 text-center`}
              >
                <p className={`text-3xl font-semibold tracking-tighter ${config.color}`}>
                  {count}
                </p>
                <p className={`text-xs font-medium mt-1 uppercase tracking-wide ${config.color} opacity-70`}>
                  {config.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column: Activity Feed + Delivery Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="reveal-on-scroll bg-white/80 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
              <Activity size={16} className="text-[#9333EA]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-xs text-gray-400">Latest events across your SOWs</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-400">No activity yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activities.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] || FileText;
                const colorClass = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.created;
                return (
                  <Link
                    key={item.id}
                    href={`/sows/${item.sowId}`}
                    className="px-8 py-4 flex items-center gap-4 hover:bg-[#FDFCFF] transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
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
        <div className="reveal-on-scroll bg-white/80 backdrop-blur-sm rounded-[32px] shadow-sm border border-white/60 overflow-hidden" style={{ transitionDelay: "100ms" }}>
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#9333EA]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Delivery Health</h2>
              <p className="text-xs text-gray-400">Active SOW age and status</p>
            </div>
          </div>

          {deliveryItems.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-400">No active SOWs.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
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
                    className="px-8 py-4 flex items-center gap-4 hover:bg-[#FDFCFF] transition-colors group"
                  >
                    {/* Health dot */}
                    <div className="flex-shrink-0" title={healthLabel}>
                      <div className={`w-3 h-3 rounded-full ${healthColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
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
    </div>
  );
}
