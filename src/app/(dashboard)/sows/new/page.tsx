"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Shield, Clock, FileText, ClipboardList, ChevronDown, Phone, X, Loader2 } from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";
import { ShineBorder } from "@/components/ui/shine-border";
import { SOW_TEMPLATES } from "@/lib/sow-templates";
import { createClient } from "@/lib/supabase/client";

interface FirefliesCall {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  preview: string;
}

const TEMPLATE_ICONS: Record<string, typeof Shield> = {
  securestart: Shield,
  threatguard: Shield,
  crisisready: Shield,
  clearsight: FileText,
  complianceforge: FileText,
};

interface CompletedQuestionnaire {
  id: string;
  client_name: string;
  engagement_type: string;
}

export default function NewSOWPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedQs, setCompletedQs] = useState<CompletedQuestionnaire[]>([]);
  const [qDropdownOpen, setQDropdownOpen] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [ffCalls, setFfCalls] = useState<FirefliesCall[]>([]);
  const [ffLoading, setFfLoading] = useState(false);
  const [ffApiKey, setFfApiKey] = useState<string | null>(null);
  const [ffImporting, setFfImporting] = useState<string | null>(null);

  // Check for pre-populated transcript from sessionStorage (from Calls page)
  useEffect(() => {
    const stored = sessionStorage.getItem("fireflies_transcript");
    if (stored) {
      setTranscript(stored);
      sessionStorage.removeItem("fireflies_transcript");
    }
  }, []);

  // Fetch Fireflies API key
  useEffect(() => {
    const fetchFfKey = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_preferences")
        .select("fireflies_api_key")
        .eq("user_id", user.id)
        .single();
      if (data?.fireflies_api_key) setFfApiKey(data.fireflies_api_key);
    };
    fetchFfKey();
  }, []);

  const handleOpenCallModal = async () => {
    if (!ffApiKey) return;
    setCallModalOpen(true);
    setFfLoading(true);
    try {
      const res = await fetch(`/api/calls?api_key=${encodeURIComponent(ffApiKey)}`);
      if (res.ok) {
        const data = await res.json();
        setFfCalls((data.calls || []).slice(0, 10));
      }
    } catch {
      // silent
    }
    setFfLoading(false);
  };

  const handleImportCall = async (callId: string) => {
    if (!ffApiKey) return;
    setFfImporting(callId);
    try {
      const res = await fetch(
        `/api/calls/${callId}/transcript?api_key=${encodeURIComponent(ffApiKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        setTranscript(data.transcript);
        setCallModalOpen(false);
      }
    } catch {
      // silent
    }
    setFfImporting(null);
  };

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const res = await fetch("/api/questionnaire");
        if (res.ok) {
          const data = await res.json();
          const completed = (data.questionnaires || []).filter(
            (q: { status: string }) => q.status === "completed"
          );
          setCompletedQs(completed);
        }
      } catch {
        // silent
      }
    };
    fetchCompleted();
  }, []);

  const handleUseQuestionnaire = async (id: string) => {
    setQLoading(true);
    setQDropdownOpen(false);
    try {
      const res = await fetch(`/api/questionnaire/${id}/use`);
      if (res.ok) {
        const data = await res.json();
        setTranscript(data.transcript);
      }
    } catch {
      // silent
    }
    setQLoading(false);
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          templateId: selectedTemplate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate SOW");
        setLoading(false);
        return;
      }

      router.push(`/sows/${data.id}`);
    } catch (err) {
      console.error("Generate SOW error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Template Selector */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Generate SOW from Transcript</h1>
        <p className="text-gray-500 mb-6">Select a template to guide the SOW structure, then paste your call transcript.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOW_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;
            const Icon = TEMPLATE_ICONS[template.id] || Shield;

            const cardContent = (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                className={`relative text-left rounded-2xl border-2 p-5 transition-all w-full ${
                  isSelected
                    ? "border-[#9333EA] bg-[#F3F0FF] shadow-md"
                    : "border-gray-200 bg-white hover:border-[#9333EA]/40 hover:shadow-sm"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#9333EA] flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected ? "bg-[#9333EA]/20" : "bg-[#F3F0FF]"
                }`}>
                  <Icon size={18} className="text-[#9333EA]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.subtitle}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock size={11} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">{template.duration}</span>
                </div>
              </button>
            );

            if (isSelected) {
              return (
                <ShineBorder
                  key={template.id}
                  color={["#9333EA", "#B8BEC1", "#9333EA"]}
                  borderRadius={16}
                  borderWidth={1}
                  duration={8}
                >
                  {cardContent}
                </ShineBorder>
              );
            }

            return <div key={template.id}>{cardContent}</div>;
          })}
        </div>

        {selectedTemplate && (
          <p className="text-xs text-[#9333EA] mt-3 font-medium">
            Using {SOW_TEMPLATES.find((t) => t.id === selectedTemplate)?.name} template — click again to deselect
          </p>
        )}
      </div>

      {/* Transcript Input */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Call Transcript</h2>
          <div className="flex items-center gap-2">
            {ffApiKey && (
              <button
                onClick={handleOpenCallModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors"
              >
                <Phone size={13} />
                Import from Call
              </button>
            )}
          {completedQs.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setQDropdownOpen(!qDropdownOpen)}
                disabled={qLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors disabled:opacity-50"
              >
                <ClipboardList size={13} />
                {qLoading ? "Loading..." : "Use Questionnaire"}
                <ChevronDown size={12} />
              </button>
              {qDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                  {completedQs.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleUseQuestionnaire(q.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F9F8FF] transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{q.client_name}</p>
                      {q.engagement_type && (
                        <p className="text-xs text-gray-400 truncate">{q.engagement_type}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">Paste your call transcript below and we&apos;ll extract the key details automatically.</p>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your call transcript here..."
          className="w-full rounded-xl border border-gray-200 bg-white text-base text-gray-800 placeholder-gray-400 p-4 min-h-64 resize-y focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
        />

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center gap-3 mt-6 py-3">
            <svg className="animate-spin h-5 w-5 text-[#9333EA]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gray-600 font-medium">Reading your transcript...</span>
          </div>
        ) : (
          <div className="mt-6">
            <ShineBorder
              color={["#9333EA", "#E90D41", "#9333EA"]}
              borderRadius={12}
              borderWidth={1}
              duration={6}
              className="w-full"
            >
              <GlowButton
                onClick={handleGenerate}
                disabled={!transcript.trim()}
                className="w-full"
              >
                Generate SOW{selectedTemplate ? ` with ${SOW_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}` : ""}
              </GlowButton>
            </ShineBorder>
          </div>
        )}
      </div>

      {/* Call Recordings Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCallModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
                  <Phone size={16} className="text-[#9333EA]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Import from Call Recording</h2>
                  <p className="text-xs text-gray-400">Select a call to import its transcript</p>
                </div>
              </div>
              <button
                onClick={() => setCallModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {ffLoading ? (
                <div className="p-12 text-center">
                  <Loader2 size={24} className="text-[#9333EA] animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading calls from Fireflies...</p>
                </div>
              ) : ffCalls.length === 0 ? (
                <div className="p-12 text-center">
                  <Phone size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No call recordings found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {ffCalls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => handleImportCall(call.id)}
                      disabled={ffImporting === call.id}
                      className="w-full text-left px-8 py-4 hover:bg-[#FDFCFF] transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{call.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {call.date ? new Date(call.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                            {call.participants.length > 0 && ` · ${call.participants.slice(0, 2).join(", ")}`}
                          </p>
                        </div>
                        {ffImporting === call.id ? (
                          <Loader2 size={14} className="text-[#9333EA] animate-spin flex-shrink-0 ml-3" />
                        ) : (
                          <span className="text-xs text-[#9333EA] font-medium flex-shrink-0 ml-3">Import</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-8 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setCallModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
