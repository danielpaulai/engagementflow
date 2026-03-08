"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0B] relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-[#9333EA]/20 blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-250px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/30 blur-[100px] animate-float-medium pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl p-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <FileText size={28} className="text-[#9333EA]" />
          <span className="text-white font-semibold text-xl tracking-tight">EngagementFlow</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-white mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#9333EA]/50 focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#9333EA]/50 focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <GlowButton type="submit" disabled={loading} loading={loading} className="w-full">
            {loading ? "Logging in..." : "Log in"}
          </GlowButton>
        </form>

        <p className="text-gray-400 text-sm text-center mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white hover:text-[#9333EA] transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
