"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlowButton from "@/components/ui/GlowButton";

export default function NewSOWPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
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
        body: JSON.stringify({ transcript }),
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Generate SOW from Transcript</h1>
        <p className="text-gray-500 mb-8">Paste your call transcript below and we&apos;ll extract the key details automatically.</p>

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
              Generate SOW
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}
