"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, FileText, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";

interface SOWListItem {
  id: string;
  project_title: string;
  customer_name: string;
  status: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  in_review: "bg-[#F3F0FF] text-[#9333EA] dark:bg-[#9333EA]/15",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  signed: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
};

export default function SOWsListPage() {
  const [sows, setSows] = useState<SOWListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchSOWs = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sows")
        .select("id, project_title, customer_name, status, created_at")
        .order("created_at", { ascending: false });
      if (data) setSows(data as SOWListItem[]);
      setLoading(false);
    };
    fetchSOWs();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      const supabase = createClient();
      await supabase.from("sow_line_items").delete().eq("sow_id", deleteId);
      await supabase.from("sow_versions").delete().eq("sow_id", deleteId);
      await supabase.from("approvals").delete().eq("sow_id", deleteId);
      const { error } = await supabase.from("sows").delete().eq("id", deleteId);

      if (!error) {
        setSows((prev) => prev.filter((s) => s.id !== deleteId));
      }
    } catch {
      // silent fail
    }

    setDeleteLoading(false);
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-10 reveal-on-scroll">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Statements of Work</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all your SOWs in one place.</p>
        </div>
        <Link href="/sows/new">
          <GlowButton>
            <Plus size={16} />
            New SOW
          </GlowButton>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : sows.length === 0 ? (
        <div className="premium-card rounded-[2.5rem] p-16 text-center reveal-on-scroll">
          <div className="w-16 h-16 rounded-full bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center mx-auto mb-5">
            <FileText size={28} className="text-[#9333EA]" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">No SOWs yet. Generate your first one from a call transcript.</p>
          <Link href="/sows/new">
            <GlowButton>
              <Plus size={16} />
              New SOW
            </GlowButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sows.map((sow, i) => (
            <div
              key={sow.id}
              className="reveal-on-scroll premium-card rounded-[2.5rem] p-8"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#9333EA]">
                  {(sow.customer_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                    {sow.project_title || "Untitled"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{sow.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase whitespace-nowrap ${statusStyles[sow.status] || statusStyles.draft}`}>
                  {sow.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                {new Date(sow.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex items-center justify-between">
                <Link
                  href={`/sows/${sow.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#9333EA] hover:opacity-70 transition-opacity"
                >
                  View
                  <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => setDeleteId(sow.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  title="Delete SOW"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
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
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
    </div>
  );
}
