"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  DollarSign,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Shield,
  ThumbsUp,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Deliverable {
  name: string;
  description: string;
  estimated_weeks: number;
}

interface SOW {
  id: string;
  customer_name: string;
  project_title: string;
  deliverables: Deliverable[];
  timeline_weeks: number;
  success_metrics: string[];
  risks: string[];
  budget_mentioned: string;
  region: string;
  special_requirements: string;
  status: string;
  created_at: string;
}

function ReadOnlySection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const [sow, setSow] = useState<SOW | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSOW = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("sows").select("*").eq("id", id).single();
      if (data) setSow(data as SOW);
      setLoading(false);
    };
    fetchSOW();
  }, [id]);

  const handleAction = async (action: "approved" | "changes_requested" | "rejected") => {
    if (!sow) return;
    setSubmitting(action);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/sows/${sow.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment,
          reviewer_email: "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        setSubmitting(null);
        return;
      }

      const messages: Record<string, string> = {
        approved: "SOW has been approved.",
        changes_requested: "Changes have been requested. SOW moved back to draft.",
        rejected: "SOW has been rejected.",
      };
      setSuccess(messages[action]);
      setSow({ ...sow, status: data.status });
      setSubmitting(null);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(null);
    }
  };

  if (loading) return <p className="text-gray-500">Loading SOW...</p>;
  if (!sow) return <p className="text-gray-500">SOW not found.</p>;

  const createdDate = new Date(sow.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusStyles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    in_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    changes_requested: "bg-orange-100 text-orange-800",
    signed: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/sows/${sow.id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} />
          Back to SOW
        </Link>
        <span className="text-sm text-gray-400">Review Mode</span>
      </div>

      {/* Document header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{sow.project_title || "Untitled SOW"}</h1>
            <p className="text-gray-500 mt-1">{sow.customer_name}</p>
            <p className="text-sm text-gray-400 mt-2">Created {createdDate}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${statusStyles[sow.status] || statusStyles.draft}`}>
            {sow.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <ReadOnlySection title="Executive Summary" icon={<FileText size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Timeline</p>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-800 font-semibold">{sow.timeline_weeks} weeks</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Budget</p>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" />
              <span className="text-gray-800 font-semibold">{sow.budget_mentioned || "Not mentioned"}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Region</p>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-800 font-semibold">{sow.region || "Not specified"}</span>
            </div>
          </div>
        </div>
      </ReadOnlySection>

      {/* Deliverables */}
      <ReadOnlySection title="Deliverables" icon={<FileText size={16} />}>
        <div className="divide-y divide-gray-50">
          {(sow.deliverables || []).map((d, i) => (
            <div key={i} className={i > 0 ? "pt-3 mt-3" : ""}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-800">{d.name}</h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{d.estimated_weeks} weeks</span>
              </div>
              <p className="text-sm text-gray-500">{d.description}</p>
            </div>
          ))}
          {(!sow.deliverables || sow.deliverables.length === 0) && (
            <p className="text-sm text-gray-400">No deliverables.</p>
          )}
        </div>
      </ReadOnlySection>

      {/* Success Metrics */}
      {sow.success_metrics && sow.success_metrics.length > 0 && (
        <ReadOnlySection title="Success Metrics" icon={<CheckCircle size={16} />}>
          <ul className="space-y-2">
            {sow.success_metrics.map((m, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {m}
              </li>
            ))}
          </ul>
        </ReadOnlySection>
      )}

      {/* Risks */}
      {sow.risks && sow.risks.length > 0 && (
        <ReadOnlySection title="Risks" icon={<AlertTriangle size={16} />}>
          <ul className="space-y-2">
            {sow.risks.map((r, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </ReadOnlySection>
      )}

      {/* Special Requirements */}
      {sow.special_requirements && (
        <ReadOnlySection title="Special Requirements" icon={<Shield size={16} />}>
          <p className="text-sm text-gray-600">{sow.special_requirements}</p>
        </ReadOnlySection>
      )}

      {/* Review Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 p-6" style={{ borderLeft: "4px solid #0077CC" }}>
        <h2 className="font-semibold text-gray-800 mb-4">Submit Your Review</h2>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add feedback or comments (optional)..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0077CC] resize-y mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAction("approved")}
            disabled={!!submitting || !!success}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting === "approved" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <ThumbsUp size={16} />
            )}
            Approve
          </button>

          <button
            onClick={() => handleAction("changes_requested")}
            disabled={!!submitting || !!success}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {submitting === "changes_requested" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <RotateCcw size={16} />
            )}
            Request Changes
          </button>

          <button
            onClick={() => handleAction("rejected")}
            disabled={!!submitting || !!success}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting === "rejected" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <XCircle size={16} />
            )}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
