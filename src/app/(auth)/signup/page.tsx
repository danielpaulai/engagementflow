"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GlowButton from "@/components/ui/GlowButton";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Supabase signUp response:", { data, error: signUpError });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Signup exception:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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

        {success ? (
          <div className="text-center">
            <p className="text-green-400 mb-4">Check your email to confirm your account.</p>
            <Link href="/login" className="text-white hover:text-[#9333EA] transition-colors">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-5">
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
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#9333EA]/50 focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <GlowButton type="submit" disabled={loading} loading={loading} className="w-full">
                {loading ? "Creating account..." : "Sign up"}
              </GlowButton>
            </form>

            <p className="text-gray-400 text-sm text-center mt-8">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:text-[#9333EA] transition-colors">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
