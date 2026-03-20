"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileDown,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  CheckCircle,
  Pencil,
  Check,
  X,
  Send,
  History,
  ChevronRight,
  Eye,
  Trash2,
  Loader2,
  Paperclip,
  Upload,
  FileText,
  Image,
  File,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";
import SOWTimeline from "@/components/SOWTimeline";
import {
  calculateHealthScore,
  HEALTH_COLORS,
  HEALTH_LABELS,
  type HealthScoreResult,
} from "@/lib/health-score";

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
  renewal_date?: string | null;
  proposal_number?: string;
  revision_count?: number;
}

interface SOWArtifact {
  id: string;
  sow_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  section: "hld" | "appendix";
  appendix_label: string;
  file_size: number;
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
  const router = useRouter();
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
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [artifacts, setArtifacts] = useState<SOWArtifact[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleMarkAsSigned = async () => {
    if (!sow) return;
    setSignLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sows")
        .update({ status: "signed", updated_at: new Date().toISOString() })
        .eq("id", sow.id);

      if (!error) {
        setSow({ ...sow, status: "signed" });
        setSignModalOpen(false);
      }
    } catch {
      // silent fail
    }

    setSignLoading(false);
  };

  const handleDeleteSOW = async () => {
    if (!sow) return;
    setDeleteLoading(true);

    try {
      const supabase = createClient();

      // Delete related records first, then the SOW
      await supabase.from("sow_line_items").delete().eq("sow_id", sow.id);
      await supabase.from("sow_versions").delete().eq("sow_id", sow.id);
      await supabase.from("approvals").delete().eq("sow_id", sow.id);

      const { error } = await supabase.from("sows").delete().eq("id", sow.id);

      if (!error) {
        router.push("/sows");
      }
    } catch {
      // silent fail
    }

    setDeleteLoading(false);
  };

  useEffect(() => {
    const fetchSOW = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("sows").select("*").eq("id", id).single();
      if (data) {
        const sowData = data as SOW & { updated_at?: string };
        setSow(sowData);

        // Calculate health score
        const { data: vData } = await supabase
          .from("sow_versions")
          .select("id")
          .eq("sow_id", id);

        const { data: aData } = await supabase
          .from("approvals")
          .select("created_at")
          .eq("sow_id", id)
          .eq("status", "pending");

        let pendingDays: number | null = null;
        if (aData && aData.length > 0) {
          pendingDays = Math.floor((Date.now() - new Date(aData[0].created_at).getTime()) / 86400000);
        }

        const hs = calculateHealthScore({
          created_at: sowData.created_at,
          updated_at: sowData.updated_at,
          status: sowData.status,
          version_count: vData?.length || 0,
          pending_approval_days: pendingDays,
        });
        setHealthScore(hs);

        const { data: artifactsData } = await supabase
          .from("sow_artifacts")
          .select("*")
          .eq("sow_id", id)
          .order("created_at", { ascending: true });
        if (artifactsData) setArtifacts(artifactsData);
      }
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !sow) return;
    setUploading(true);
    setUploadError("");

    for (const file of Array.from(files)) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        setUploadError(`${file.name} is too large. Max 20MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/sows/${sow.id}/artifacts`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setArtifacts((prev) => [...prev, data.artifact]);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || `Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
  };

  const handleRemoveArtifact = async (artifactId: string) => {
    if (!sow) return;
    const res = await fetch(`/api/sows/${sow.id}/artifacts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artifact_id: artifactId }),
    });
    if (res.ok) {
      setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
    }
  };

  const handleUpdateLabel = async (artifactId: string, label: string) => {
    const supabase = createClient();
    await supabase
      .from("sow_artifacts")
      .update({ appendix_label: label })
      .eq("id", artifactId);
    setArtifacts((prev) =>
      prev.map((a) => (a.id === artifactId ? { ...a, appendix_label: label } : a))
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          {sow.status === "approved" && (
            <button
              onClick={() => setSignModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle size={16} />
              Mark as Signed
            </button>
          )}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
          {healthScore && (() => {
            const hc = HEALTH_COLORS[healthScore.status];
            const hl = HEALTH_LABELS[healthScore.status];
            return (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${hc.text} ${hc.bg} ${hc.border}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hc.fill }} />
                {healthScore.score} - {hl}
              </div>
            );
          })()}
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
            {sow.proposal_number && (
              <p className="text-xs font-mono text-gray-400 mt-1">{sow.proposal_number}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${statusStyles[sow.status] || statusStyles.draft}`}>
            {sow.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <SOWTimeline status={sow.status} updatedAt={(sow as SOW & { updated_at?: string }).updated_at || sow.created_at} />

      {/* Executive Summary */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 mb-6 p-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
          <div className="rounded-2xl bg-[#F9F8FF] border border-gray-100 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Renewal Date</p>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {editing === "renewal_date" ? (
                <div className="flex items-start gap-2">
                  <input
                    type="date"
                    defaultValue={sow.renewal_date || ""}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      updateField("renewal_date", val);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
                    autoFocus
                  />
                  <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <span className="text-gray-800 font-semibold cursor-pointer hover:text-[#9333EA]" onClick={() => setEditing("renewal_date")}>
                  {sow.renewal_date
                    ? new Date(sow.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "Not set"}
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

      {/* Attachments */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 mb-6 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
              <Paperclip size={16} className="text-[#9333EA]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9333EA]">Attachments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Images go into the HLD section. All other files become appendices.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4 ${
            dragOver ? "border-[#9333EA] bg-[#F3F0FF]" : "border-gray-200 hover:border-[#9333EA]/50 hover:bg-[#FDFCFF]"
          }`}
        >
          <Upload size={20} className={`mx-auto mb-2 ${dragOver ? "text-[#9333EA]" : "text-gray-300"}`} />
          <p className="text-sm text-gray-400">Drop files here or click to browse</p>
          <p className="text-xs text-gray-300 mt-1">PDF, DOCX, XLSX, PNG, JPG — max 20MB each</p>
        </div>

        {uploadError && <p className="text-xs text-red-500 mb-4">{uploadError}</p>}

        {/* HLD artifacts */}
        {artifacts.filter((a) => a.section === "hld").length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">High Level Design</p>
            <div className="space-y-2">
              {artifacts.filter((a) => a.section === "hld").map((artifact) => (
                <div key={artifact.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Image size={16} className="text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{artifact.file_name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(artifact.file_size)} · Architecture Diagram</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={artifact.file_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#9333EA] hover:bg-[#F3F0FF] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => handleRemoveArtifact(artifact.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appendix artifacts */}
        {artifacts.filter((a) => a.section === "appendix").length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Appendices</p>
            <div className="space-y-2">
              {artifacts.filter((a) => a.section === "appendix").map((artifact) => (
                <div key={artifact.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {artifact.file_type.includes("pdf") ? (
                      <FileText size={16} className="text-red-400 flex-shrink-0" />
                    ) : (
                      <File size={16} className="text-blue-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={artifact.appendix_label}
                        onChange={(e) => setArtifacts((prev) => prev.map((a) => a.id === artifact.id ? { ...a, appendix_label: e.target.value } : a))}
                        onBlur={(e) => handleUpdateLabel(artifact.id, e.target.value)}
                        className="text-sm font-medium text-gray-800 bg-transparent border-none outline-none w-full hover:text-[#9333EA] focus:text-[#9333EA]"
                      />
                      <p className="text-xs text-gray-400">{artifact.file_name} · {formatFileSize(artifact.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={artifact.file_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#9333EA] hover:bg-[#F3F0FF] transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => handleRemoveArtifact(artifact.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {artifacts.length === 0 && !uploading && (
          <p className="text-xs text-gray-400 text-center py-2">No attachments yet.</p>
        )}
      </div>

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

      {/* Mark as Signed Modal */}
      {signModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSignModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Mark as Signed</h2>
            <p className="text-sm text-gray-500 mb-6">
              Confirm this SOW has been signed by the client. This will move it to active status.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSignModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSigned}
                disabled={signLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {signLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <CheckCircle size={16} />
                )}
                {signLoading ? "Updating..." : "Confirm Signed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#1A1A1D] rounded-[2rem] shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/15 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Delete SOW</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this SOW? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSOW}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
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
