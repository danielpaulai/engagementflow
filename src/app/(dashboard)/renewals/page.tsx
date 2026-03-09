"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw,
  ArrowRight,
  DollarSign,
  Calendar,
  Loader2,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RenewalSOW {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  budget_mentioned: string;
  renewal_date: string | null;
  created_at: string;
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RenewalCard({
  sow,
  daysLeft,
  onDraftRenewal,
  drafting,
}: {
  sow: RenewalSOW;
  daysLeft: number | null;
  onDraftRenewal: (id: string) => void;
  drafting: string | null;
}) {
  const barMax = 90;
  const barValue = daysLeft !== null ? Math.max(0, Math.min(barMax, daysLeft)) : 0;
  const barPercent = Math.round((barValue / barMax) * 100);
  const barColor =
    daysLeft !== null && daysLeft <= 30
      ? "#DC2626"
      : daysLeft !== null && daysLeft <= 60
        ? "#EA580C"
        : "#16A34A";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {sow.project_title || "Untitled"}
          </p>
          <p className="text-xs text-gray-400 truncate">{sow.customer_name || "Unknown"}</p>
        </div>
        {daysLeft !== null && (
          <span
            className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            style={{ color: barColor, backgroundColor: `${barColor}15` }}
          >
            {daysLeft}d
          </span>
        )}
      </div>

      {/* Countdown bar */}
      {daysLeft !== null && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barPercent}%`, backgroundColor: barColor }}
          />
        </div>
      )}

      {/* Budget & Date */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        {sow.budget_mentioned && (
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            {sow.budget_mentioned}
          </span>
        )}
        {sow.renewal_date && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(sow.renewal_date)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => onDraftRenewal(sow.id)}
          disabled={drafting === sow.id}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors disabled:opacity-50"
        >
          {drafting === sow.id ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Drafting...
            </>
          ) : (
            <>
              <RefreshCw size={12} />
              Draft Renewal
            </>
          )}
        </button>
        <Link
          href={`/sows/${sow.id}`}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-[#9333EA] hover:bg-[#F3F0FF] transition-colors"
        >
          View
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function ColumnEmpty({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
      <Inbox size={28} className="text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">No {label.toLowerCase()}</p>
    </div>
  );
}

export default function RenewalsPage() {
  const router = useRouter();
  const [sows, setSows] = useState<RenewalSOW[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState<string | null>(null);

  useEffect(() => {
    const fetchSows = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sows")
        .select("id, project_title, customer_name, status, budget_mentioned, renewal_date, created_at")
        .order("renewal_date", { ascending: true });

      setSows((data || []) as RenewalSOW[]);
      setLoading(false);
    };
    fetchSows();
  }, []);

  const handleDraftRenewal = async (sowId: string) => {
    setDrafting(sowId);
    try {
      const res = await fetch("/api/renewals/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sow_id: sowId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/sows/${data.id}`);
      }
    } catch {
      // silent
    }
    setDrafting(null);
  };

  // Renewing Soon: has renewal_date within 60 days
  const renewingSoon = sows.filter((s) => {
    if (!s.renewal_date) return false;
    const days = daysUntil(s.renewal_date);
    return days >= 0 && days < 60 && s.status !== "rejected";
  });

  // Renewing This Quarter: 60-90 days
  const renewingQuarter = sows.filter((s) => {
    if (!s.renewal_date) return false;
    const days = daysUntil(s.renewal_date);
    return days >= 60 && days <= 90 && s.status !== "rejected";
  });

  // Completed: signed SOWs past renewal_date or past end date
  const completed = sows.filter((s) => {
    if (s.status !== "signed") return false;
    if (s.renewal_date) return daysUntil(s.renewal_date) < 0;
    return false;
  });

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
          <RefreshCw size={20} className="text-[#9333EA]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Renewal Intelligence</h1>
          <p className="text-gray-500 text-sm">Never miss a renewal conversation</p>
        </div>
      </div>

      {/* Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Renewing Soon */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-700">
              Renewing Soon
            </h2>
            <span className="text-xs text-gray-400">(&lt;60 days)</span>
          </div>
          <div className="space-y-4">
            {renewingSoon.length === 0 ? (
              <ColumnEmpty label="renewals due soon" />
            ) : (
              renewingSoon.map((s) => (
                <RenewalCard
                  key={s.id}
                  sow={s}
                  daysLeft={daysUntil(s.renewal_date!)}
                  onDraftRenewal={handleDraftRenewal}
                  drafting={drafting}
                />
              ))
            )}
          </div>
        </div>

        {/* Renewing This Quarter */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-700">
              This Quarter
            </h2>
            <span className="text-xs text-gray-400">(60-90 days)</span>
          </div>
          <div className="space-y-4">
            {renewingQuarter.length === 0 ? (
              <ColumnEmpty label="renewals this quarter" />
            ) : (
              renewingQuarter.map((s) => (
                <RenewalCard
                  key={s.id}
                  sow={s}
                  daysLeft={daysUntil(s.renewal_date!)}
                  onDraftRenewal={handleDraftRenewal}
                  drafting={drafting}
                />
              ))
            )}
          </div>
        </div>

        {/* Completed */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-700">
              Completed
            </h2>
            <span className="text-xs text-gray-400">(past end date)</span>
          </div>
          <div className="space-y-4">
            {completed.length === 0 ? (
              <ColumnEmpty label="completed engagements" />
            ) : (
              completed.map((s) => (
                <RenewalCard
                  key={s.id}
                  sow={s}
                  daysLeft={null}
                  onDraftRenewal={handleDraftRenewal}
                  drafting={drafting}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
