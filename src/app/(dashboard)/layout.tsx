"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, BookOpen, Settings, Users, LogOut, ShieldAlert, HeartPulse, RefreshCw, ClipboardList, Phone, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ScrollReveal from "@/components/ScrollReveal";
import CommandPalette from "@/components/CommandPalette";
import ThemeProvider, { useTheme } from "@/components/ThemeProvider";

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

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { resolved, setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <CommandPalette open={paletteOpen} onClose={closePalette} />

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col backdrop-blur-xl bg-white/90 dark:bg-[#111113]/95 border-r border-gray-100/80 dark:border-white/5 shadow-sm">
        <div className="px-5 py-6 flex items-center gap-2.5">
          <FileText size={22} className="text-[#9333EA]" />
          <span className="text-gray-900 dark:text-white font-semibold text-lg tracking-tight">EngagementFlow</span>
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
                    ? "bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer: theme toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
          >
            {resolved === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {resolved === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-[#0A0A0B]/80 border-b border-gray-100/80 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-[#9333EA]" />
            <span className="font-semibold text-gray-900 dark:text-white tracking-tight">EngagementFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:border-[#9333EA] hover:text-[#9333EA] transition-colors"
            >
              <span>Search</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[10px] font-medium">&#8984;K</kbd>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8 bg-[#F9F8FF] dark:bg-[#0A0A0B]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}
