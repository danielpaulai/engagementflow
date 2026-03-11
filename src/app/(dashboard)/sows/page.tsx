"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, FileText } from "lucide-react";
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
  draft: "bg-gray-100 text-gray-600",
  in_review: "bg-[#F3F0FF] text-[#9333EA]",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  signed: "bg-indigo-50 text-indigo-700",
};

export default function SOWsListPage() {
  const [sows, setSows] = useState<SOWListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="flex items-end justify-between mb-10 reveal-on-scroll">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Statements of Work</h2>
          <p className="text-gray-500 mt-1">Manage and track all your SOWs in one place.</p>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] shadow-sm border border-gray-100 p-16 text-center reveal-on-scroll">
          <div className="w-16 h-16 rounded-full bg-[#F3F0FF] flex items-center justify-center mx-auto mb-5">
            <FileText size={28} className="text-[#9333EA]" />
          </div>
          <p className="text-gray-500 mb-6 text-lg">No SOWs yet. Generate your first one from a call transcript.</p>
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
              className="reveal-on-scroll bg-white/80 backdrop-blur-sm rounded-[32px] border border-gray-100 shadow-sm p-8"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold tracking-tight text-gray-900 truncate">
                    {sow.project_title || "Untitled"}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{sow.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase whitespace-nowrap ml-3 ${statusStyles[sow.status] || statusStyles.draft}`}>
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
              <Link
                href={`/sows/${sow.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#9333EA] hover:opacity-70 transition-opacity"
              >
                View
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
