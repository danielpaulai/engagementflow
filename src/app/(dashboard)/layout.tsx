"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, BookOpen, Settings, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SOWs", href: "/sows", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
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
    // Intersection observer for reveal-on-scroll
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
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#0A0A0B] border-r border-white/5">
        <div className="px-5 py-6 flex items-center gap-2.5">
          <FileText size={22} className="text-[#9333EA]" />
          <span className="text-white font-semibold text-lg tracking-tight">EngagementFlow</span>
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
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
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
        <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-10 bg-[#0A0A0B] border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-[#9333EA]" />
            <span className="font-semibold text-white tracking-tight">EngagementFlow</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
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
