"use client";

import { useEffect, useState } from "react";
import { Settings, Mail, Send, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";

interface UserPreferences {
  id?: string;
  weekly_snapshot_enabled: boolean;
  weekly_snapshot_email: string;
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    weekly_snapshot_enabled: true,
    weekly_snapshot_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          id: data.id,
          weekly_snapshot_enabled: data.weekly_snapshot_enabled ?? true,
          weekly_snapshot_email: data.weekly_snapshot_email || user.email || "",
        });
      } else {
        setPrefs({
          weekly_snapshot_enabled: true,
          weekly_snapshot_email: user.email || "",
        });
      }

      setLoading(false);
    };

    fetchPrefs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    if (prefs.id) {
      await supabase
        .from("user_preferences")
        .update({
          weekly_snapshot_enabled: prefs.weekly_snapshot_enabled,
          weekly_snapshot_email: prefs.weekly_snapshot_email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prefs.id);
    } else {
      const { data } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          weekly_snapshot_enabled: prefs.weekly_snapshot_enabled,
          weekly_snapshot_email: prefs.weekly_snapshot_email,
        })
        .select("id")
        .single();

      if (data) {
        setPrefs({ ...prefs, id: data.id });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendTest = async () => {
    if (!prefs.weekly_snapshot_email) {
      setTestResult("Please enter an email address first.");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/emails/weekly-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: prefs.weekly_snapshot_email }),
      });

      if (res.ok) {
        setTestResult("Test snapshot sent successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult(data.error || "Failed to send test snapshot.");
      }
    } catch {
      setTestResult("Something went wrong. Please try again.");
    }

    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
          <Settings size={20} className="text-[#9333EA]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your EngagementFlow preferences</p>
        </div>
      </div>

      {/* Weekly Snapshot Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <Mail size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Weekly Executive Snapshot</h2>
            <p className="text-xs text-gray-400">
              Receive a branded summary email every Monday with your SOW metrics, health alerts, and upcoming renewals.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Enable Monday Email</p>
            <p className="text-xs text-gray-400 mt-0.5">Sent every Monday at 8:00 AM</p>
          </div>
          <button
            onClick={() =>
              setPrefs({ ...prefs, weekly_snapshot_enabled: !prefs.weekly_snapshot_enabled })
            }
            className={`relative w-12 h-7 rounded-full transition-colors ${
              prefs.weekly_snapshot_enabled ? "bg-[#9333EA]" : "bg-gray-200"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                prefs.weekly_snapshot_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Email Address */}
        <div className="py-4 border-b border-gray-100">
          <label
            htmlFor="snapshot-email"
            className="block text-sm font-medium text-gray-800 mb-1.5"
          >
            Send to Email
          </label>
          <input
            id="snapshot-email"
            type="email"
            value={prefs.weekly_snapshot_email}
            onChange={(e) => setPrefs({ ...prefs, weekly_snapshot_email: e.target.value })}
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
          />
        </div>

        {/* Test Button */}
        <div className="pt-4">
          <button
            onClick={handleSendTest}
            disabled={testing || !prefs.weekly_snapshot_email}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#F3F0FF] text-[#9333EA] hover:bg-[#E9D5FF] transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Test Snapshot Now
              </>
            )}
          </button>
          {testResult && (
            <p
              className={`mt-2 text-xs ${
                testResult.includes("success") ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {testResult}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <GlowButton onClick={handleSave} loading={saving}>
          {saved ? (
            <>
              <Check size={16} />
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save Settings"
          )}
        </GlowButton>
        {saved && <span className="text-xs text-emerald-600">Preferences saved successfully.</span>}
      </div>
    </div>
  );
}
