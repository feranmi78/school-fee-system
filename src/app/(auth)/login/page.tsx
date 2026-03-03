"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const stats = [
  { emoji: "🎓", label: "STUDENTS ENROLLED", value: "500+" },
  { emoji: "💳", label: "PAYMENTS PROCESSED", value: "100%" },
  { emoji: "⚡", label: "PORTAL UPTIME", value: "99.9%" },
  { emoji: "🏫", label: "YEARS OF EXCELLENCE", value: "15+" },
];

const avatars = [
  { initials: "AA", color: "#6366f1" },
  { initials: "BK", color: "#8b5cf6" },
  { initials: "CO", color: "#ec4899" },
  { initials: "DM", color: "#06b6d4" },
  { initials: "EF", color: "#10b981" },
];

function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden relative">
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {children}{children}{children}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await signIn("credentials", { email: email.toLowerCase(), password, redirect: false });
      if (result?.error) { setError("Invalid email or password. Please try again."); setLoading(false); return; }
      const session = await getSession();
      router.push(session?.user.role === "ADMIN" ? "/admin" : "/student");
    } catch { setError("Something went wrong. Please try again."); setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/student" });
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left Panel: Full BG Hero ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between">
        {/* Background image */}
        <div className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,30,0.55) 0%, rgba(10,10,30,0.3) 40%, rgba(10,10,30,0.75) 100%)" }} />
        </div>

        {/* Logo top-left */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">The Restorer College</p>
              <p className="text-white/60 text-xs">Fee Management Portal</p>
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="relative z-10">
          {/* Avatars + heading */}
          <div className="px-10 pb-6">
            {/* Avatar stack */}
            <div className="flex -space-x-3 mb-6">
              {avatars.map((a, i) => (
                <div key={a.initials}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/30"
                  style={{ background: a.color, zIndex: avatars.length - i }}>
                  {a.initials}
                </div>
              ))}
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/30"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", zIndex: 0 }}>
                +99
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
              Shaping futures,<br />
              <span style={{ color: "#a5f3fc" }}>one student</span> at a time.
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Your all-in-one portal for fee payments, receipts, and academic records — fast, secure, and always available.
            </p>
          </div>

          {/* Stats marquee */}
          <div className="py-3 mb-0" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Marquee>
              {stats.map(stat => (
                <div key={stat.label} className="flex items-center gap-3 px-4">
                  <span className="font-bold text-cyan-300 text-sm tracking-wide font-mono">{stat.value}</span>
                  <span className="text-white/60 text-xs uppercase tracking-widest">{stat.label}</span>
                  <span className="text-base">{stat.emoji}</span>
                  <span className="text-white/20 mx-2">✦</span>
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-14"
        style={{ background: "#f8fafc" }}>
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>The Restorer College</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome back 👋
            </h2>
            <p className="text-slate-500 text-sm">Sign in to access your student portal</p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl font-semibold text-slate-700 text-sm mb-5 transition-all hover:shadow-md active:scale-[0.98]"
            style={{ background: "white", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-2xl text-sm font-medium flex items-center gap-2"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <input ref={emailRef} type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu.ng"
                className="w-full rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none transition-all"
                style={{ background: "white", border: "1.5px solid #e2e8f0" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input ref={passRef} type={showPassword ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition-all"
                  style={{ background: "white", border: "1.5px solid #e2e8f0" }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-60 active:scale-[0.98] mt-2"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </span>
                : "Sign In →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New student?{" "}
            <Link href="/register" className="font-bold hover:underline" style={{ color: "#6366f1" }}>
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">Admin access is by invitation only</p>
        </div>
      </div>
    </div>
  );
}
