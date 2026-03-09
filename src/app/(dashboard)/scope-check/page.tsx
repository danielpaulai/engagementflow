"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileDown,
  Loader2,
} from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";
import { createClient } from "@/lib/supabase/client";

interface SOWOption {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  deliverables: { name: string; description: string; estimated_weeks: number }[];
  timeline_weeks: number;
  budget_mentioned: string;
  region: string;
  special_requirements: string;
  success_metrics: string[];
  risks: string[];
}

interface ScopeItem {
  item: string;
  reason: string;
  estimated_effort?: string;
}

interface ScopeResult {
  in_scope: ScopeItem[];
  out_of_scope: ScopeItem[];
  risk_level: string;
  summary: string;
}

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

interface ChangeOrderData {
  change_order_number: string;
  date: string;
  original_sow_title: string;
  original_sow_customer: string;
  line_items: ChangeOrderLine[];
  total_min: number;
  total_max: number;
  currency: string;
}

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  low: { label: "Low Risk", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  medium: { label: "Medium Risk", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  high: { label: "High Risk", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

export default function ScopeCheckPage() {
  const [sows, setSows] = useState<SOWOption[]>([]);
  const [selectedSowId, setSelectedSowId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [sowsLoading, setSowsLoading] = useState(true);
  const [result, setResult] = useState<ScopeResult | null>(null);
  const [error, setError] = useState("");

  const [coLoading, setCoLoading] = useState(false);
  const [changeOrder, setChangeOrder] = useState<ChangeOrderData | null>(null);
  const [coPdfBase64, setCoPdfBase64] = useState("");

  // Fetch SOWs
  useEffect(() => {
    const fetchSows = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sows")
        .select("id, project_title, customer_name, status, deliverables, timeline_weeks, budget_mentioned, region, special_requirements, success_metrics, risks")
        .in("status", ["draft", "in_review", "approved", "signed"])
        .order("created_at", { ascending: false });

      if (data) setSows(data as SOWOption[]);
      setSowsLoading(false);
    };
    fetchSows();
  }, []);

  const selectedSow = sows.find((s) => s.id === selectedSowId);

  const handleAnalyse = async () => {
    if (!selectedSow || !transcript.trim()) return;
    setError("");
    setResult(null);
    setChangeOrder(null);
    setCoPdfBase64("");
    setLoading(true);

    try {
      const sowContent = {
        project_title: selectedSow.project_title,
        customer_name: selectedSow.customer_name,
        deliverables: selectedSow.deliverables,
        timeline_weeks: selectedSow.timeline_weeks,
        budget_mentioned: selectedSow.budget_mentioned,
        region: selectedSow.region,
        special_requirements: selectedSow.special_requirements,
        success_metrics: selectedSow.success_metrics,
        risks: selectedSow.risks,
      };

      const res = await fetch("/api/scope-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sowContent, transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleGenerateChangeOrder = async () => {
    if (!result || result.out_of_scope.length === 0 || !selectedSow) return;
    setCoLoading(true);

    try {
      const res = await fetch("/api/scope-check/change-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          out_of_scope: result.out_of_scope,
          sow_title: selectedSow.project_title,
          sow_customer: selectedSow.customer_name,
          sow_id: selectedSow.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setChangeOrder(data.change_order);
        setCoPdfBase64(data.pdf_base64);
      }
    } catch {
      // silent
    }

    setCoLoading(false);
  };

  const handleDownloadCoPdf = () => {
    if (!coPdfBase64 || !changeOrder) return;
    const binary = atob(coPdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Change_Order_${changeOrder.change_order_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const riskConfig = result ? RISK_CONFIG[result.risk_level] || RISK_CONFIG.low : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <ShieldAlert size={20} className="text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Scope Creep Detector</h1>
            <p className="text-gray-500 text-sm">Paste a follow-up call transcript to detect out-of-scope requests and generate a Change Order instantly.</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 mb-6">
        {/* SOW Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Original SOW
          </label>
          {sowsLoading ? (
            <p className="text-sm text-gray-400">Loading SOWs...</p>
          ) : (
            <select
              value={selectedSowId}
              onChange={(e) => {
                setSelectedSowId(e.target.value);
                setResult(null);
                setChangeOrder(null);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
            >
              <option value="">Choose a SOW...</option>
              {sows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.project_title} - {s.customer_name} ({s.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Transcript */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Follow-up Call Transcript
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the follow-up call transcript here..."
            rows={10}
            className="w-full rounded-xl border border-gray-200 bg-white text-base text-gray-800 placeholder-gray-400 p-4 resize-y focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-3">
            <Loader2 size={20} className="text-[#9333EA] animate-spin" />
            <span className="text-gray-600 font-medium">Analysing transcript against SOW...</span>
          </div>
        ) : (
          <GlowButton
            onClick={handleAnalyse}
            disabled={!selectedSowId || !transcript.trim()}
            className="w-full"
          >
            <ShieldAlert size={16} />
            Analyse Transcript
          </GlowButton>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Risk Summary */}
          {riskConfig && (
            <div className={`rounded-2xl border p-6 ${riskConfig.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <riskConfig.icon size={20} className={riskConfig.color} />
                <h2 className={`text-lg font-semibold ${riskConfig.color}`}>{riskConfig.label}</h2>
              </div>
              <p className={`text-sm ${riskConfig.color} opacity-80`}>{result.summary}</p>
            </div>
          )}

          {/* Out of Scope */}
          {result.out_of_scope.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle size={16} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Out of Scope ({result.out_of_scope.length})</h2>
                  <p className="text-xs text-gray-400">Items outside the original SOW</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {result.out_of_scope.map((item, i) => (
                  <div key={i} className="px-8 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <XCircle size={12} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.item}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                        {item.estimated_effort && (
                          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 uppercase">
                            Est. {item.estimated_effort}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Scope */}
          {result.in_scope.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">In Scope ({result.in_scope.length})</h2>
                  <p className="text-xs text-gray-400">Items covered by the original SOW</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {result.in_scope.map((item, i) => (
                  <div key={i} className="px-8 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={12} className="text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.item}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Change Order Button */}
          {result.out_of_scope.length > 0 && !changeOrder && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Change Order</h3>
              <p className="text-sm text-gray-500 mb-6">
                Create a formal Change Order document for the {result.out_of_scope.length} out-of-scope item{result.out_of_scope.length > 1 ? "s" : ""} detected above.
              </p>
              {coLoading ? (
                <div className="flex items-center justify-center gap-3 py-3">
                  <Loader2 size={20} className="text-[#9333EA] animate-spin" />
                  <span className="text-gray-600 font-medium">Generating Change Order...</span>
                </div>
              ) : (
                <GlowButton onClick={handleGenerateChangeOrder}>
                  <FileDown size={16} />
                  Generate Change Order
                </GlowButton>
              )}
            </div>
          )}

          {/* Change Order Result */}
          {changeOrder && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
                    <FileDown size={16} className="text-[#9333EA]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Change Order {changeOrder.change_order_number}</h2>
                    <p className="text-xs text-gray-400">{changeOrder.date}</p>
                  </div>
                </div>
                {coPdfBase64 && (
                  <button
                    onClick={handleDownloadCoPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors"
                  >
                    <FileDown size={14} />
                    Download PDF
                  </button>
                )}
              </div>

              {/* Line items table */}
              <div className="px-8 py-6">
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1A1A2E]">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Item</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Service Match</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Hours</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {changeOrder.line_items.map((li, i) => {
                        const currSym = li.currency === "USD" ? "$" : li.currency === "EUR" ? "\u20AC" : li.currency === "GBP" ? "\u00A3" : `${li.currency} `;
                        return (
                          <tr key={i} className={i % 2 === 1 ? "bg-[#F9F5FF]" : "bg-white"}>
                            <td className="px-4 py-3 font-medium text-gray-900">{li.item}</td>
                            <td className="px-4 py-3 text-gray-500">{li.matched_service || "Custom"}</td>
                            <td className="px-4 py-3 text-gray-700 text-center">{li.hours_min}-{li.hours_max}</td>
                            <td className="px-4 py-3 text-gray-700 text-right">
                              {li.rate > 0 ? `${currSym}${li.rate.toLocaleString()}` : "TBD"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="mt-4 flex justify-end">
                  <div className="rounded-xl bg-[#F3F0FF] border border-[#9333EA]/20 px-6 py-4 text-right">
                    <p className="text-xs text-[#9333EA] uppercase tracking-wide font-medium mb-1">Total Additional Fee</p>
                    <p className="text-xl font-semibold text-[#9333EA]">
                      {changeOrder.currency === "USD" ? "$" : changeOrder.currency}{changeOrder.total_min.toLocaleString()} - {changeOrder.currency === "USD" ? "$" : changeOrder.currency}{changeOrder.total_max.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
