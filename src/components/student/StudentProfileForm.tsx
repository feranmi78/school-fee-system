"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CLASS_LEVELS = ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"];
const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function StudentProfileForm({ student, user }: { student: any; user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user.name || "",
    classLevel: student.classLevel || "",
    parentPhone: student.parentPhone || "",
    sex: student.sex || "",
    dateOfBirth: student.dateOfBirth || "",
    address: student.address || "",
    state: student.state || "",
    nationality: student.nationality || "Nigerian",
    bio: student.bio || "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl">
      {/* Avatar Card */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
            {user.name}
          </h2>
          <p className="text-amber-600 text-sm font-medium">{student.admissionNumber}</p>
          <p className="text-slate-400 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {student.classLevel}
            </span>
            {student.sex && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                {student.sex}
              </span>
            )}
            {student.state && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                {student.state}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="card p-6">
        <h3 className="font-bold text-slate-800 mb-6 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          Edit Information
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Profile updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input required className="input-field" value={form.name} onChange={e => update("name", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Level</label>
            <select required className="input-field" value={form.classLevel} onChange={e => update("classLevel", e.target.value)}>
              <option value="">Select class</option>
              {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sex</label>
            <select className="input-field" value={form.sex} onChange={e => update("sex", e.target.value)}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
            <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent/Guardian Phone</label>
            <input type="tel" className="input-field" placeholder="+234 800 000 0000" value={form.parentPhone} onChange={e => update("parentPhone", e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">State of Origin</label>
            <select className="input-field" value={form.state} onChange={e => update("state", e.target.value)}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nationality</label>
            <input className="input-field" value={form.nationality} onChange={e => update("nationality", e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Home Address</label>
            <input className="input-field" placeholder="Enter your address" value={form.address} onChange={e => update("address", e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bio <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Tell us something about yourself..."
              value={form.bio}
              onChange={e => update("bio", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}