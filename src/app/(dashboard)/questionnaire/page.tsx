"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Send,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Inbox,
} from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";

interface Questionnaire {
  id: string;
  client_name: string;
  client_email: string;
  engagement_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const ENGAGEMENT_TYPES = [
  "Platform Onboarding",
  "MDR Success",
  "IR Readiness",
  "Security Assessment",
  "Compliance",
];

export default function QuestionnairePage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const fetchQuestionnaires = async () => {
    try {
      const res = await fetch("/api/questionnaire");
      if (res.ok) {
        const data = await res.json();
        setQuestionnaires(data.questionnaires || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      setSendResult("Client name and email are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setSendResult("Please enter a valid email address.");
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: formName,
          client_email: formEmail,
          engagement_type: formType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const msg = data.warning
          ? `Questionnaire created. Warning: ${data.warning}`
          : "Questionnaire sent successfully.";
        setSendResult(msg);
        setFormName("");
        setFormEmail("");
        setFormType("");
        fetchQuestionnaires();
        if (!data.warning) setTimeout(() => setModalOpen(false), 1500);
      } else {
        const detail = [data.error, data.code, data.details, data.hint]
          .filter(Boolean)
          .join(" | ");
        setSendResult(detail || "Failed to send questionnaire.");
      }
    } catch {
      setSendResult("Something went wrong. Please try again.");
    }

    setSending(false);
  };

  const handleUseInSow = async (id: string) => {
    try {
      const res = await fetch(`/api/questionnaire/${id}/use`);
      if (res.ok) {
        const data = await res.json();
        // Copy transcript to clipboard and redirect
        await navigator.clipboard.writeText(data.transcript);
        window.location.href = "/sows/new";
      }
    } catch {
      // silent
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <ClipboardList size={20} className="text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Discovery Questionnaire
            </h1>
            <p className="text-gray-500 text-sm">
              Send clients a structured intake form before the call. Answers feed directly into SOW generation.
            </p>
          </div>
        </div>
        <GlowButton onClick={() => { setModalOpen(true); setSendResult(null); }}>
          <Send size={16} />
          Create Questionnaire
        </GlowButton>
      </div>

      {/* Questionnaire List */}
      {questionnaires.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
          <Inbox size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No questionnaires sent yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {questionnaires.map((q) => {
              const isCompleted = q.status === "completed";
              return (
                <div
                  key={q.id}
                  className="px-8 py-5 flex items-center justify-between hover:bg-[#FDFCFF] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? "bg-emerald-50" : "bg-gray-100"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <Clock size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {q.client_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {q.client_email}
                        {q.engagement_type && ` · ${q.engagement_type}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {q.status}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDate(q.created_at)}
                      </p>
                    </div>
                    {isCompleted && (
                      <button
                        onClick={() => handleUseInSow(q.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors"
                      >
                        Use in SOW
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Create Questionnaire</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="q-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client Name
                </label>
                <input
                  id="q-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="q-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client Email
                </label>
                <input
                  id="q-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@acme.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
                />
              </div>

              <div>
                <label htmlFor="q-type" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Engagement Type
                </label>
                <select
                  id="q-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
                >
                  <option value="">Select type...</option>
                  {ENGAGEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sendResult && (
              <p
                className={`mt-4 text-sm ${
                  sendResult.includes("success") ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {sendResult}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <GlowButton onClick={handleCreate} loading={sending}>
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Questionnaire
                  </>
                )}
              </GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
