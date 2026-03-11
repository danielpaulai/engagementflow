"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, BookOpen, Settings, Users, LogOut, ShieldAlert, HeartPulse, RefreshCw, ClipboardList, Phone, Sun, Moon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ScrollReveal from "@/components/ScrollReveal";
import CommandPalette from "@/components/CommandPalette";
import ThemeProvider, { useTheme } from "@/components/ThemeProvider";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SOWs", href: "/sows", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Calls", href: "/calls", icon: Phone },
];

const manageNav = [
  { label: "Questionnaire", href: "/questionnaire", icon: ClipboardList },
  { label: "Scope Check", href: "/scope-check", icon: ShieldAlert },
  { label: "Health", href: "/health", icon: HeartPulse },
  { label: "Renewals", href: "/renewals", icon: RefreshCw },
  { label: "CSM", href: "/csm", icon: Users },
];

const settingsNav = [
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavSection({ label, items, pathname }: { label: string; items: typeof mainNav; pathname: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em] px-4 mb-2">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mx-2 ${
                isActive
                  ? "bg-white/5 border border-white/5 text-white"
                  : "text-[#777] hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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

  // Derive page title from pathname
  const pageTitle = (() => {
    const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  })();

  const pageSubtitles: Record<string, string> = {
    dashboard: "Overview of your engagement pipeline",
    sows: "Manage and track statements of work",
    catalog: "Your services, rates and scope",
    calls: "Discovery calls and recordings",
    questionnaire: "Client discovery questionnaires",
    "scope-check": "Validate scope boundaries",
    health: "Engagement health monitoring",
    renewals: "Upcoming contract renewals",
    csm: "Customer success management",
    settings: "Account and preferences",
  };

  const subtitleKey = pathname.split("/").filter(Boolean).pop() || "dashboard";

  return (
    <div className="flex h-screen">
      <ScrollReveal />
      <CommandPalette open={paletteOpen} onClose={closePalette} />

      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r border-white/5"
        style={{ background: "linear-gradient(180deg, #0D0D20 0%, #111128 100%)" }}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9333EA, #4F46E5)" }}>
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-heading font-semibold text-[15px] tracking-tight">EngagementFlow</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 uppercase tracking-wide">Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-2 overflow-y-auto no-scrollbar">
          <NavSection label="Main" items={mainNav} pathname={pathname} />
          <NavSection label="Manage" items={manageNav} pathname={pathname} />
          <NavSection label="System" items={settingsNav} pathname={pathname} />
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-4 space-y-1">
          <button
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#777] hover:text-white hover:bg-white/5 transition-all duration-200 mx-0"
          >
            {resolved === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            {resolved === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#777] hover:text-white hover:bg-white/5 transition-all duration-200 mx-0"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <header className="h-20 flex items-center justify-between px-10 sticky top-0 z-10 backdrop-blur-md bg-white/40 dark:bg-[#0A0A0B]/80 border-b border-gray-100 dark:border-white/5">
          <div>
            <h1 className="font-heading font-semibold text-lg text-gray-900 dark:text-white tracking-tight">{pageTitle}</h1>
            <p className="text-[11px] text-[#888]">{pageSubtitles[subtitleKey] || ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 hover:border-[#9333EA]/30 hover:text-[#9333EA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9333EA]/20"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[10px] font-medium">&#8984;K</kbd>
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto p-10"
          style={{
            background: resolved === "dark"
              ? "#0A0A0B"
              : "radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(147, 51, 234, 0.03) 0px, transparent 50%), #FAFAFA",
          }}
        >
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
