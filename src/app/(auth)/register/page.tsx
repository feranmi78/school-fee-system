"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CLASS_LEVELS = ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"];
const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    admissionNumber: "", classLevel: "", parentPhone: "",
    sex: "", state: "", dateOfBirth: "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      await signIn("credentials", { email: form.email.toLowerCase(), password: form.password, redirect: false });
      router.push("/student");
    } catch { setError("Something went wrong"); setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/student" });
  }

  const step1Valid = form.name && form.email && form.password && form.confirmPassword;
  const step2Valid = form.admissionNumber && form.classLevel && form.parentPhone;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #fffbf5 0%, #fef3c7 50%, #fff7ed 100%)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #fde68a 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fed7aa 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
      </div>

      <div className="relative w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-amber-200" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">The Restorer College</h1>
          <p className="text-amber-600 text-sm font-medium mt-1">Student Registration</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
          <div className="px-8 pt-6">
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "text-white shadow-md" : "text-amber-300 border-2 border-amber-100"}`}
                    style={step >= s ? { background: "linear-gradient(135deg, #f59e0b, #f97316)" } : { background: "#fffbeb" }}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? "bg-amber-400" : "bg-amber-50"}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-500 font-medium">Step {step} of 3</p>
            <h2 className="text-xl font-bold text-slate-800 mt-1 mb-1">
              {step === 1 ? "Account Details" : step === 2 ? "School Information" : "Personal Details"}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {step === 1 ? "Create your login credentials" : step === 2 ? "Enter your school information" : "Tell us a bit more about you"}
            </p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setError(""); setStep(s => s + 1); } : handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <button type="button" onClick={handleGoogle} disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-amber-100 bg-amber-50 hover:bg-amber-100 transition-all font-semibold text-slate-700 text-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleLoading ? "Connecting..." : "Sign up with Google"}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-amber-100" />
                    <span className="text-xs text-amber-400">or with email</span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input required className="input-field" placeholder="John Doe" value={form.name} onChange={e => update("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input required type="email" className="input-field" placeholder="you@email.com" value={form.email} onChange={e => update("email", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                      <input required type="password" className="input-field" placeholder="Min. 8 chars" value={form.password} onChange={e => update("password", e.target.value)} minLength={8} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm</label>
                      <input required type="password" className="input-field" placeholder="Repeat" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admission Number</label>
                    <input required className="input-field" placeholder="TRC/2024/001" value={form.admissionNumber} onChange={e => update("admissionNumber", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Level</label>
                    <select required className="input-field" value={form.classLevel} onChange={e => update("classLevel", e.target.value)}>
                      <option value="">Select your class</option>
                      {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent/Guardian Phone</label>
                    <input required type="tel" className="input-field" placeholder="+234 800 000 0000" value={form.parentPhone} onChange={e => update("parentPhone", e.target.value)} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sex</label>
                      <select className="input-field" value={form.sex} onChange={e => update("sex", e.target.value)}>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                      <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">State of Origin</label>
                    <select className="input-field" value={form.state} onChange={e => update("state", e.target.value)}>
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: "#fffbf5", border: "1px solid #fde68a" }}>
                    <p className="text-xs text-amber-600 font-medium">
                      ✓ By registering, you agree to The Restorer College terms of service.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>
                )}
                <button type="submit" disabled={loading || (step === 1 && !step1Valid) || (step === 2 && !step2Valid)} className="btn-primary flex-1">
                  {loading ? "Creating account..." : step < 3 ? "Continue →" : "Create Account"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-600 font-semibold hover:text-amber-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}