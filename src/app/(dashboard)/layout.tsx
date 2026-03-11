"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, BookOpen, Settings, Users, LogOut, ShieldAlert, HeartPulse, RefreshCw, ClipboardList, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ScrollReveal from "@/components/ScrollReveal";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SOWs", href: "/sows", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Calls", href: "/calls", icon: Phone },
  { label: "Questionnaire", href: "/questionnaire", icon: ClipboardList },
  { label: "Scope Check", href: "/scope-check", icon: ShieldAlert },
  { label: "Health", href: "/health", icon: HeartPulse },
  { label: "Renewals", href: "/renewals", icon: RefreshCw },
  { label: "CSM", href: "/csm", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    // Intersection observer for legacy .reveal class
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observer.observe(el));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Cursor-follow for glow buttons
    const handleMouseMove = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".glow-button");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      (target as HTMLElement).style.setProperty("--x", `${e.clientX - rect.left}px`);
      (target as HTMLElement).style.setProperty("--y", `${e.clientY - rect.top}px`);
    };
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <ScrollReveal />

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col backdrop-blur-xl bg-white/90 border-r border-gray-100/80 shadow-sm">
        <div className="px-5 py-6 flex items-center gap-2.5">
          <FileText size={22} className="text-[#9333EA]" />
          <span className="text-gray-900 font-semibold text-lg tracking-tight">EngagementFlow</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#F3F0FF] text-[#9333EA]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-[#9333EA]" />
            <span className="font-semibold text-gray-900 tracking-tight">EngagementFlow</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8 bg-[#F9F8FF]">
          {children}
        </main>
      </div>
    </div>
  );
}
