"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Shield, Clock, FileText } from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";
import { SOW_TEMPLATES } from "@/lib/sow-templates";

const TEMPLATE_ICONS: Record<string, typeof Shield> = {
  securestart: Shield,
  threatguard: Shield,
  crisisready: Shield,
  clearsight: FileText,
  complianceforge: FileText,
};

export default function NewSOWPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Call Transcript</h2>
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
            <GlowButton
              onClick={handleGenerate}
              disabled={!transcript.trim()}
              className="w-full"
            >
              Generate SOW{selectedTemplate ? ` with ${SOW_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}` : ""}
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}
