"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileDown,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  Pencil,
  Check,
  X,
  Send,
  History,
  ChevronRight,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";

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

interface SOWVersion {
  id: string;
  sow_id: string;
  version_number: number;
  sow_content: Omit<SOW, "id" | "created_at">;
  changed_by: string;
  change_summary: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  in_review: "bg-[#F3F0FF] text-[#9333EA]",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  signed: "bg-indigo-50 text-indigo-700",
};

function EditableSection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 mb-6 p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA]">
          {title}
        </h2>
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-[#9333EA] transition-colors p-1"
          title={`Edit ${title}`}
        >
          <Pencil size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function InlineEdit({
  value,
  onSave,
  onCancel,
  multiline = false,
}: {
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  multiline?: boolean;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="flex items-start gap-2">
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA] resize-y"
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
        />
      )}
      <button onClick={() => onSave(text)} className="text-emerald-600 hover:text-emerald-800 p-1">
        <Check size={16} />
      </button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
        <X size={16} />
      </button>
    </div>
  );
}

export default function SOWDetailPage() {
  const { id } = useParams();
  const [sow, setSow] = useState<SOW | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [docxLoading, setDocxLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerEmailError, setReviewerEmailError] = useState("");
  const [versions, setVersions] = useState<SOWVersion[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<SOWVersion | null>(null);

  const handleDownloadPdf = async () => {
    if (!sow) return;
    setPdfLoading(true);
    setPdfError("");

    try {
      const res = await fetch(`/api/sows/${sow.id}/pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPdfError(data.error || "Failed to generate PDF");
        setPdfLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(sow.project_title || "SOW").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setPdfError("Something went wrong. Please try again.");
    }

    setPdfLoading(false);
  };

  const handleDownloadDocx = async () => {
    if (!sow) return;
    setDocxLoading(true);

    try {
      const res = await fetch(`/api/sows/${sow.id}/docx`);
      if (!res.ok) {
        setDocxLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(sow.project_title || "SOW").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }

    setDocxLoading(false);
  };

  const handleSendForReview = () => {
    setReviewerEmail("");
    setReviewerEmailError("");
    setReviewModalOpen(true);
  };

  const handleConfirmSendForReview = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewerEmail)) {
      setReviewerEmailError("Please enter a valid email address.");
      return;
    }

    if (!sow) return;
    setReviewLoading(true);
    setReviewerEmailError("");

    try {
      const res = await fetch(`/api/sows/${sow.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_email: reviewerEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReviewerEmailError(data.error || "Something went wrong. Please try again.");
      } else {
        setSow({ ...sow, status: "in_review" });
        setReviewModalOpen(false);
      }
    } catch {
      setReviewerEmailError("Something went wrong. Please try again.");
    }

    setReviewLoading(false);
  };

  useEffect(() => {
    const fetchSOW = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("sows").select("*").eq("id", id).single();
      if (data) setSow(data as SOW);
      setLoading(false);
    };
    fetchSOW();
  }, [id]);

  const fetchVersions = async () => {
    if (!id) return;
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/sows/${id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    }
    setVersionsLoading(false);
  };

  const updateField = async (field: string, value: unknown) => {
    if (!sow) return;
    try {
      const res = await fetch(`/api/sows/${sow.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sow) {
          setSow(data.sow as SOW);
        } else {
          setSow({ ...sow, [field]: value });
        }
        // Refresh version list if panel is open
        if (versionsOpen) fetchVersions();
      } else {
        setSow({ ...sow, [field]: value });
      }
    } catch {
      // Fallback: update locally even if API fails
      const supabase = createClient();
      await supabase.from("sows").update({ [field]: value }).eq("id", sow.id);
      setSow({ ...sow, [field]: value });
    }
    setEditing(null);
  };

  if (loading) {
    return <p className="text-gray-500">Loading SOW...</p>;
  }

  if (!sow) {
    return <p className="text-gray-500">SOW not found.</p>;
  }

  const createdDate = new Date(sow.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top actions */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/sows" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} />
          Back to SOWs
        </Link>
        <div className="flex items-center gap-3">
          {sow.status === "draft" && (
            <GlowButton onClick={handleSendForReview} loading={reviewLoading}>
              <Send size={16} />
              {reviewLoading ? "Sending..." : "Send for Review"}
            </GlowButton>
          )}
          {sow.status === "in_review" && (
            <Link href={`/sows/${sow.id}/review`}>
              <GlowButton>
                <CheckCircle size={16} />
                Open Review
              </GlowButton>
            </Link>
          )}
          <button
            onClick={() => {
              setVersionsOpen(!versionsOpen);
              if (!versionsOpen && versions.length === 0) fetchVersions();
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              versionsOpen
                ? "bg-[#F3F0FF] text-[#9333EA]"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]"
            }`}
          >
            <History size={16} />
            Versions
          </button>
          <button
            onClick={handleDownloadDocx}
            disabled={docxLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA] transition-colors disabled:opacity-50"
          >
            <FileDown size={16} />
            {docxLoading ? "Exporting..." : "Export to Word"}
          </button>
          <GlowButton onClick={handleDownloadPdf} loading={pdfLoading}>
            <Download size={16} />
            {pdfLoading ? "Generating..." : "Download PDF"}
          </GlowButton>
        </div>
      </div>

      {pdfError && (
        <p className="text-red-500 text-sm mb-4">{pdfError}</p>
      )}

      {/* Document header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 mb-6 p-10">
        <div className="flex items-start justify-between">
          <div>
            {editing === "project_title" ? (
              <InlineEdit
                value={sow.project_title}
                onSave={(val) => updateField("project_title", val)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-4xl font-semibold text-gray-900 tracking-tighter">{sow.project_title || "Untitled SOW"}</h1>
                <button onClick={() => setEditing("project_title")} className="text-gray-300 hover:text-[#9333EA] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {editing === "customer_name" ? (
              <div className="mt-2">
                <InlineEdit
                  value={sow.customer_name}
                  onSave={(val) => updateField("customer_name", val)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 group">
                <p className="text-gray-500">{sow.customer_name}</p>
                <button onClick={() => setEditing("customer_name")} className="text-gray-300 hover:text-[#9333EA] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-3">Created {createdDate}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${statusStyles[sow.status] || statusStyles.draft}`}>
            {sow.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 mb-6 p-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              {editing === "timeline_weeks" ? (
                <InlineEdit
                  value={String(sow.timeline_weeks)}
                  onSave={(val) => updateField("timeline_weeks", parseInt(val) || 0)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <span className="text-gray-800 font-semibold cursor-pointer hover:text-[#9333EA]" onClick={() => setEditing("timeline_weeks")}>
                  {sow.timeline_weeks} weeks
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Budget</p>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" />
              {editing === "budget_mentioned" ? (
                <InlineEdit
                  value={sow.budget_mentioned}
                  onSave={(val) => updateField("budget_mentioned", val)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <span className="text-gray-800 font-semibold cursor-pointer hover:text-[#9333EA]" onClick={() => setEditing("budget_mentioned")}>
                  {sow.budget_mentioned || "Not mentioned"}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Region</p>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              {editing === "region" ? (
                <InlineEdit
                  value={sow.region}
                  onSave={(val) => updateField("region", val)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <span className="text-gray-800 font-semibold cursor-pointer hover:text-[#9333EA]" onClick={() => setEditing("region")}>
                  {sow.region || "Not specified"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <EditableSection
        title="Deliverables"
        onEdit={() => setEditing("deliverables")}
      >
        {editing === "deliverables" ? (
          <div className="space-y-3">
            {(sow.deliverables || []).map((d, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <input
                  value={d.name}
                  onChange={(e) => {
                    const updated = [...sow.deliverables];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setSow({ ...sow, deliverables: updated });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
                  placeholder="Deliverable name"
                />
                <textarea
                  value={d.description}
                  onChange={(e) => {
                    const updated = [...sow.deliverables];
                    updated[i] = { ...updated[i], description: e.target.value };
                    setSow({ ...sow, deliverables: updated });
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA] resize-y"
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={d.estimated_weeks}
                  onChange={(e) => {
                    const updated = [...sow.deliverables];
                    updated[i] = { ...updated[i], estimated_weeks: parseInt(e.target.value) || 0 };
                    setSow({ ...sow, deliverables: updated });
                  }}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
                  placeholder="Weeks"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <GlowButton onClick={() => updateField("deliverables", sow.deliverables)}>
                Save
              </GlowButton>
              <button onClick={() => setEditing(null)} className="text-sm text-gray-500 px-4 py-2 rounded-full hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(sow.deliverables || []).map((d, i) => (
              <div key={i} className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{d.name}</h3>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{d.estimated_weeks}w</span>
                </div>
                <p className="text-sm text-gray-500">{d.description}</p>
              </div>
            ))}
            {(!sow.deliverables || sow.deliverables.length === 0) && (
              <p className="text-sm text-gray-400">No deliverables extracted.</p>
            )}
          </div>
        )}
      </EditableSection>

      {/* Success Metrics */}
      <EditableSection
        title="Success Metrics"
        onEdit={() => setEditing("success_metrics")}
      >
        {editing === "success_metrics" ? (
          <div className="space-y-2">
            <textarea
              value={(sow.success_metrics || []).join("\n")}
              onChange={(e) => setSow({ ...sow, success_metrics: e.target.value.split("\n") })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA] resize-y"
              placeholder="One metric per line"
            />
            <div className="flex gap-2">
              <GlowButton onClick={() => updateField("success_metrics", sow.success_metrics.filter((m) => m.trim()))}>
                Save
              </GlowButton>
              <button onClick={() => setEditing(null)} className="text-sm text-gray-500 px-4 py-2 rounded-full hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(sow.success_metrics || []).map((metric, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm bg-emerald-50 text-emerald-700">
                {metric}
              </span>
            ))}
            {(!sow.success_metrics || sow.success_metrics.length === 0) && (
              <p className="text-sm text-gray-400">No success metrics defined.</p>
            )}
          </div>
        )}
      </EditableSection>

      {/* Risks */}
      <EditableSection
        title="Risks"
        onEdit={() => setEditing("risks")}
      >
        {editing === "risks" ? (
          <div className="space-y-2">
            <textarea
              value={(sow.risks || []).join("\n")}
              onChange={(e) => setSow({ ...sow, risks: e.target.value.split("\n") })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA] resize-y"
              placeholder="One risk per line"
            />
            <div className="flex gap-2">
              <GlowButton onClick={() => updateField("risks", sow.risks.filter((r) => r.trim()))}>
                Save
              </GlowButton>
              <button onClick={() => setEditing(null)} className="text-sm text-gray-500 px-4 py-2 rounded-full hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(sow.risks || []).map((risk, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm bg-orange-50 text-orange-700">
                {risk}
              </span>
            ))}
            {(!sow.risks || sow.risks.length === 0) && (
              <p className="text-sm text-gray-400">No risks identified.</p>
            )}
          </div>
        )}
      </EditableSection>

      {/* Special Requirements */}
      <EditableSection
        title="Special Requirements"
        onEdit={() => setEditing("special_requirements")}
      >
        {editing === "special_requirements" ? (
          <InlineEdit
            value={sow.special_requirements || ""}
            onSave={(val) => updateField("special_requirements", val)}
            onCancel={() => setEditing(null)}
            multiline
          />
        ) : (
          <p className="text-sm text-gray-600">{sow.special_requirements || "None specified."}</p>
        )}
      </EditableSection>

      {/* Send for Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Send for Review</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the reviewer&apos;s email address to send this SOW for approval.</p>

            <label htmlFor="reviewer-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Reviewer Email
            </label>
            <input
              id="reviewer-email"
              type="email"
              value={reviewerEmail}
              onChange={(e) => {
                setReviewerEmail(e.target.value);
                setReviewerEmailError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmSendForReview()}
              placeholder="reviewer@company.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 mb-1 transition-colors"
              autoFocus
            />
            {reviewerEmailError && (
              <p className="text-red-500 text-xs mb-3">{reviewerEmailError}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <GlowButton onClick={handleConfirmSendForReview} loading={reviewLoading}>
                {reviewLoading ? "Sending..." : "Confirm"}
              </GlowButton>
            </div>
          </div>
        </div>
      )}

      {/* Version History Panel */}
      {versionsOpen && (
        <div className="mt-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
                <History size={16} className="text-[#9333EA]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Version History</h2>
                <p className="text-xs text-gray-400">{versions.length} version{versions.length !== 1 ? "s" : ""} recorded</p>
              </div>
            </div>
            <button
              onClick={() => setVersionsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {versionsLoading ? (
            <div className="px-8 py-12 text-center">
              <div className="w-6 h-6 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <History size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No versions yet. Edit a field to create the first version.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {versions.map((v) => {
                const date = new Date(v.created_at);
                const timeAgo = getTimeAgo(date);
                return (
                  <div
                    key={v.id}
                    className="px-8 py-4 flex items-center justify-between hover:bg-[#FDFCFF] transition-colors group cursor-pointer"
                    onClick={() => setPreviewVersion(v)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F3F0FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#9333EA]">v{v.version_number}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{v.change_summary}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {timeAgo} &middot; {v.changed_by || "user"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 group-hover:text-[#9333EA] transition-colors">
                      <Eye size={14} />
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Version Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewVersion(null)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#9333EA]">v{previewVersion.version_number}</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{previewVersion.change_summary}</h2>
                  <p className="text-xs text-gray-400">
                    {new Date(previewVersion.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
              <VersionPreviewContent content={previewVersion.sow_content} />
            </div>

            {/* Modal footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setPreviewVersion(null)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function VersionPreviewContent({ content }: { content: Record<string, unknown> }) {
  const deliverables = (content.deliverables || []) as Deliverable[];
  const successMetrics = (content.success_metrics || []) as string[];
  const risks = (content.risks || []) as string[];

  return (
    <>
      {/* Title & Customer */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {(content.project_title as string) || "Untitled SOW"}
        </h3>
        <p className="text-gray-500 mt-1">{(content.customer_name as string) || ""}</p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium uppercase ${
          statusStyles[(content.status as string) || "draft"] || statusStyles.draft
        }`}>
          {((content.status as string) || "draft").replace("_", " ")}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Timeline</p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Clock size={13} className="text-gray-400" />
            {(content.timeline_weeks as number) || 0} weeks
          </p>
        </div>
        <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Budget</p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <DollarSign size={13} className="text-gray-400" />
            {(content.budget_mentioned as string) || "N/A"}
          </p>
        </div>
        <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Region</p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400" />
            {(content.region as string) || "N/A"}
          </p>
        </div>
      </div>

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-3">Deliverables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliverables.map((d, i) => (
              <div key={i} className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium text-gray-800 text-sm">{d.name}</h5>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{d.estimated_weeks}w</span>
                </div>
                <p className="text-xs text-gray-500">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Metrics */}
      {successMetrics.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-3">Success Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {successMetrics.map((m, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-emerald-50 text-emerald-700">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-3">Risks</h4>
          <div className="flex flex-wrap gap-2">
            {risks.map((r, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-orange-50 text-orange-700">{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Special Requirements */}
      {content.special_requirements && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-3">Special Requirements</h4>
          <p className="text-sm text-gray-600">{content.special_requirements as string}</p>
        </div>
      )}
    </>
  );
}
