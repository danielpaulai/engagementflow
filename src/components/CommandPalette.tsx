'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Phone,
  Users,
  RefreshCw,
  ShieldAlert,
  BookOpen,
  ClipboardList,
  Settings,
  HeartPulse,
  Search,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  category: string;
  href: string;
  icon: typeof FileText;
}

const commands: Command[] = [
  { id: 'new-sow', label: 'New SOW', category: 'Create', href: '/sows/new', icon: Plus },
  { id: 'sows', label: 'View All SOWs', category: 'Navigate', href: '/sows', icon: FileText },
  { id: 'calls', label: 'Call Recordings', category: 'Navigate', href: '/calls', icon: Phone },
  { id: 'csm', label: 'Customer Success', category: 'Navigate', href: '/csm', icon: Users },
  { id: 'renewals', label: 'Renewals', category: 'Navigate', href: '/renewals', icon: RefreshCw },
  { id: 'scope', label: 'Scope Check', category: 'Navigate', href: '/scope-check', icon: ShieldAlert },
  { id: 'catalog', label: 'Solution Catalog', category: 'Navigate', href: '/catalog', icon: BookOpen },
  { id: 'questionnaire', label: 'Questionnaires', category: 'Navigate', href: '/questionnaire', icon: ClipboardList },
  { id: 'settings', label: 'Settings', category: 'Settings', href: '/settings', icon: Settings },
  { id: 'health', label: 'Health Scores', category: 'Navigate', href: '/health', icon: HeartPulse },
];

const CATEGORY_COLORS: Record<string, string> = {
  Create: 'bg-[#F3F0FF] text-[#9333EA] dark:bg-[#9333EA]/15',
  Navigate: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  Settings: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = query.trim()
    ? commands.filter((c) => fuzzyMatch(query, c.label) || fuzzyMatch(query, c.category))
    : commands;

  const execute = useCallback((cmd: Command) => {
    onClose();
    setQuery('');
    setSelectedIndex(0);
    router.push(cmd.href);
  }, [onClose, router]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, selectedIndex, execute, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1A1A1D] rounded-[24px] shadow-2xl overflow-hidden animate-fade-in-up border border-transparent dark:border-white/10">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 border-b border-gray-100 dark:border-white/10">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            className="w-full py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No results found</p>
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => execute(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-[#F3F0FF] dark:bg-[#9333EA]/15' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#9333EA] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-[#9333EA]' : 'text-gray-700 dark:text-gray-300'}`}>
                    {cmd.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${CATEGORY_COLORS[cmd.category] || CATEGORY_COLORS.Navigate}`}>
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
