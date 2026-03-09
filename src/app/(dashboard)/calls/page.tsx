"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  RefreshCw,
  Search,
  ArrowRight,
  Loader2,
  Inbox,
  Link2,
  Clock,
  Users,
} from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";
import { createClient } from "@/lib/supabase/client";

interface CallRecord {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  preview: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function CallsPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Fetch API key from user_preferences
  useEffect(() => {
    const fetchKey = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasKey(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_preferences")
        .select("fireflies_api_key")
        .eq("user_id", user.id)
        .single();

      const key = data?.fireflies_api_key || "";
      if (key) {
        setApiKey(key);
        setHasKey(true);
      } else {
        setHasKey(false);
        setLoading(false);
      }
    };
    fetchKey();
  }, []);

  const fetchCalls = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/calls?api_key=${encodeURIComponent(apiKey)}`);
      const data = await res.json();

      if (res.ok) {
        setCalls(data.calls || []);
      } else {
        setError(data.error || "Failed to fetch calls");
      }
    } catch {
      setError("Failed to connect to Fireflies.");
    }

    setLoading(false);
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) fetchCalls();
  }, [apiKey, fetchCalls]);

  const handleGenerateSOW = async (callId: string) => {
    if (!apiKey) return;
    setGeneratingId(callId);

    try {
      const res = await fetch(
        `/api/calls/${callId}/transcript?api_key=${encodeURIComponent(apiKey)}`
      );
      const data = await res.json();

      if (res.ok && data.transcript) {
        sessionStorage.setItem("fireflies_transcript", data.transcript);
        router.push("/sows/new");
      } else {
        setError(data.error || "Failed to fetch transcript");
      }
    } catch {
      setError("Failed to fetch transcript.");
    }

    setGeneratingId(null);
  };

  const filtered = calls.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.participants.some((p) => p.toLowerCase().includes(q))
    );
  });

  // Connect banner
  if (hasKey === false) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <Phone size={20} className="text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Call Recordings</h1>
            <p className="text-gray-500 text-sm">Your latest discovery calls, ready to convert into SOWs</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F0FF] flex items-center justify-center mx-auto mb-6">
            <Link2 size={28} className="text-[#9333EA]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Fireflies.ai</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Connect Fireflies.ai to automatically pull your call transcripts and generate SOWs from recorded meetings.
          </p>
          <GlowButton onClick={() => router.push("/settings")}>
            <Link2 size={16} />
            Connect Now
          </GlowButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <Phone size={20} className="text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Call Recordings</h1>
            <p className="text-gray-500 text-sm">Your latest discovery calls, ready to convert into SOWs</p>
          </div>
        </div>
        <button
          onClick={fetchCalls}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Calls
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or participant..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm bg-white"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-8 py-5 border-b border-gray-50 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-32" />
                </div>
                <div className="h-8 bg-gray-100 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
          <Inbox size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? "No calls match your search." : "No call recordings found."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((call) => (
              <div
                key={call.id}
                className="px-8 py-5 flex items-center justify-between hover:bg-[#FDFCFF] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center flex-shrink-0">
                    <Phone size={15} className="text-[#9333EA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{call.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(call.date)}
                      </span>
                      {call.duration > 0 && (
                        <span>{formatDuration(call.duration)}</span>
                      )}
                      {call.participants.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {call.participants.slice(0, 3).join(", ")}
                          {call.participants.length > 3 && ` +${call.participants.length - 3}`}
                        </span>
                      )}
                    </div>
                    {call.preview && (
                      <p className="text-xs text-gray-400 mt-1.5 truncate">{call.preview}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateSOW(call.id)}
                  disabled={generatingId === call.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors disabled:opacity-50 flex-shrink-0 ml-4"
                >
                  {generatingId === call.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Generate SOW
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
