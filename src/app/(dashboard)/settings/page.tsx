"use client";

import { useEffect, useState } from "react";
import { Settings, Mail, Send, Loader2, Check, Link2, Phone, Sun, Moon, Monitor, Users, UserPlus, Trash2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";
import { useTheme } from "@/components/ThemeProvider";

interface UserPreferences {
  id?: string;
  weekly_snapshot_enabled: boolean;
  weekly_snapshot_email: string;
  fireflies_api_key: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>({
    weekly_snapshot_enabled: true,
    weekly_snapshot_email: "",
    fireflies_api_key: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [ffTesting, setFfTesting] = useState(false);
  const [ffTestResult, setFfTestResult] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [members, setMembers] = useState<{id: string; email: string; name: string; role: string}[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("reviewer");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

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
        const ffKey = data.fireflies_api_key || "";
        setPrefs({
          id: data.id,
          weekly_snapshot_enabled: data.weekly_snapshot_enabled ?? true,
          weekly_snapshot_email: data.weekly_snapshot_email || user.email || "",
          fireflies_api_key: ffKey,
        });
        if (ffKey) {
          setMaskedKey(ffKey.substring(0, 8) + "••••••••");
        }
      } else {
        setPrefs({
          weekly_snapshot_enabled: true,
          weekly_snapshot_email: user.email || "",
          fireflies_api_key: "",
        });
      }

      const { data: membersData } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (membersData) setMembers(membersData);

      setLoading(false);
    };

    fetchPrefs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setSaveError("You must be logged in to save settings.");
      return;
    }

    let error;

    if (prefs.id) {
      ({ error } = await supabase
        .from("user_preferences")
        .update({
          weekly_snapshot_enabled: prefs.weekly_snapshot_enabled,
          weekly_snapshot_email: prefs.weekly_snapshot_email,
          fireflies_api_key: prefs.fireflies_api_key,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prefs.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          weekly_snapshot_enabled: prefs.weekly_snapshot_enabled,
          weekly_snapshot_email: prefs.weekly_snapshot_email,
          fireflies_api_key: prefs.fireflies_api_key,
        })
        .select("id")
        .single();

      error = insertError;
      if (data) {
        setPrefs({ ...prefs, id: data.id });
      }
    }

    setSaving(false);

    if (error) {
      setSaveError(error.message || "Failed to save settings.");
      return;
    }

    // Update masked key display
    if (prefs.fireflies_api_key) {
      setMaskedKey(prefs.fireflies_api_key.substring(0, 8) + "••••••••");
    } else {
      setMaskedKey("");
    }

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

  const handleTestFireflies = async () => {
    if (!prefs.fireflies_api_key) {
      setFfTestResult("Please enter your Fireflies API key first.");
      return;
    }

    setFfTesting(true);
    setFfTestResult(null);

    try {
      const res = await fetch(`/api/calls?api_key=${encodeURIComponent(prefs.fireflies_api_key)}`);
      const data = await res.json();

      if (res.ok) {
        const count = data.calls?.length || 0;
        setFfTestResult(`Connected successfully. Found ${count} call recording${count !== 1 ? "s" : ""}.`);
      } else {
        setFfTestResult(data.error || "Connection failed.");
      }
    } catch {
      setFfTestResult("Failed to connect. Check your API key.");
    }

    setFfTesting(false);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail || !newMemberEmail.includes("@")) {
      setMemberError("Please enter a valid email address.");
      return;
    }

    setAddingMember(true);
    setMemberError("");

    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail, name: newMemberName, role: newMemberRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setMembers([...members, data.member]);
        setNewMemberEmail("");
        setNewMemberName("");
        setNewMemberRole("reviewer");
      } else {
        setMemberError(data.error || "Failed to add member.");
      }
    } catch {
      setMemberError("Something went wrong. Please try again.");
    }

    setAddingMember(false);
  };

  const handleRemoveMember = async (id: string) => {
    setRemovingId(id);

    try {
      const res = await fetch("/api/team-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setMembers(members.filter((m) => m.id !== id));
      }
    } catch {
      // silently fail
    }

    setRemovingId(null);
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
        <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
          <Settings size={20} className="text-[#9333EA]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your EngagementFlow preferences</p>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
            <Sun size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-xs text-gray-400">
              Choose your preferred theme for the dashboard.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {([
            { value: "light" as const, label: "Light", icon: Sun },
            { value: "dark" as const, label: "Dark", icon: Moon },
            { value: "system" as const, label: "System", icon: Monitor },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                theme === opt.value
                  ? "bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] border-[#9333EA]/30"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[#9333EA]/30"
              }`}
            >
              <opt.icon size={16} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Snapshot Section */}
      <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
            <Mail size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Executive Snapshot</h2>
            <p className="text-xs text-gray-400">
              Receive a branded summary email every Monday with your SOW metrics, health alerts, and upcoming renewals.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Enable Monday Email</p>
            <p className="text-xs text-gray-400 mt-0.5">Sent every Monday at 8:00 AM</p>
          </div>
          <button
            onClick={() =>
              setPrefs({ ...prefs, weekly_snapshot_enabled: !prefs.weekly_snapshot_enabled })
            }
            className={`relative w-12 h-7 rounded-full transition-colors ${
              prefs.weekly_snapshot_enabled ? "bg-[#9333EA]" : "bg-gray-200 dark:bg-white/20"
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
        <div className="py-4 border-b border-gray-100 dark:border-white/10">
          <label
            htmlFor="snapshot-email"
            className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5"
          >
            Send to Email
          </label>
          <input
            id="snapshot-email"
            type="email"
            value={prefs.weekly_snapshot_email}
            onChange={(e) => setPrefs({ ...prefs, weekly_snapshot_email: e.target.value })}
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white bg-white dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
          />
        </div>

        {/* Test Button */}
        <div className="pt-4">
          <button
            onClick={handleSendTest}
            disabled={testing || !prefs.weekly_snapshot_email}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] hover:bg-[#E9D5FF] dark:hover:bg-[#9333EA]/25 transition-colors disabled:opacity-50"
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

      {/* Integrations Section */}
      <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
            <Link2 size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Integrations</h2>
            <p className="text-xs text-gray-400">
              Connect external services to enhance your workflow.
            </p>
          </div>
        </div>

        {/* Fireflies.ai */}
        <div className="py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#9333EA]" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Fireflies.ai</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${prefs.fireflies_api_key ? "bg-emerald-500" : "bg-red-400"}`} />
              <span className={`text-xs font-medium ${prefs.fireflies_api_key ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {prefs.fireflies_api_key ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
          <label
            htmlFor="ff-key"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            API Key
          </label>
          {maskedKey && prefs.fireflies_api_key && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-mono">
              Saved: {maskedKey}
            </p>
          )}
          <div className="flex gap-2">
            <input
              id="ff-key"
              type="password"
              value={prefs.fireflies_api_key}
              onChange={(e) => setPrefs({ ...prefs, fireflies_api_key: e.target.value })}
              placeholder="Enter your Fireflies.ai API key"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white bg-white dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
            />
            {prefs.fireflies_api_key && (
              <button
                onClick={() => {
                  setPrefs({ ...prefs, fireflies_api_key: "" });
                  setMaskedKey("");
                  setFfTestResult(null);
                }}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Find your API key at fireflies.ai/account/apps
          </p>
        </div>

        {/* Test Connection */}
        <div className="pt-4">
          <button
            onClick={handleTestFireflies}
            disabled={ffTesting || !prefs.fireflies_api_key}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] hover:bg-[#E9D5FF] dark:hover:bg-[#9333EA]/25 transition-colors disabled:opacity-50"
          >
            {ffTesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Link2 size={14} />
                Test Connection
              </>
            )}
          </button>
          {ffTestResult && (
            <p
              className={`mt-2 text-xs ${
                ffTestResult.includes("success") ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {ffTestResult}
            </p>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center">
            <Users size={16} className="text-[#9333EA]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Team Members</h2>
            <p className="text-xs text-gray-400">
              Manage who can review and collaborate on your SOWs.
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="mb-6">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No team members yet. Add someone below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F3F0FF] dark:bg-[#9333EA]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[#9333EA]">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {member.name || member.email}
                      </p>
                      {member.name && (
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                      <Shield size={10} />
                      {member.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {removingId === member.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Member Form */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Add Member</p>
          <div className="space-y-3">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white bg-white dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
            />
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white bg-white dark:bg-white/5 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white bg-white dark:bg-white/5 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
            >
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleAddMember}
            disabled={addingMember || !newMemberEmail}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#F3F0FF] dark:bg-[#9333EA]/15 text-[#9333EA] hover:bg-[#E9D5FF] dark:hover:bg-[#9333EA]/25 transition-colors disabled:opacity-50"
          >
            {addingMember ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Add Member
              </>
            )}
          </button>
          {memberError && (
            <p className="mt-2 text-xs text-red-500">{memberError}</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div>
        <div className="flex items-center gap-3">
          <GlowButton onClick={handleSave} loading={saving}>
            {saved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </GlowButton>
          {saved && <span className="text-xs text-emerald-600">Settings saved</span>}
        </div>
        {saveError && (
          <p className="mt-2 text-xs text-red-500">{saveError}</p>
        )}
      </div>
    </div>
  );
}
