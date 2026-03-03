"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportStudentsModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError("Something went wrong during import");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Import Students</h2>
              <button onClick={() => { setOpen(false); setResult(null); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {!result ? (
                <>
                  <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl text-sm text-brand-700 dark:text-brand-400">
                    <p className="font-medium mb-1">CSV Format Required:</p>
                    <p className="font-mono text-xs">name,email,admissionnumber,classlevel,parentphone,password</p>
                    <p className="mt-1 text-xs">Password is optional (defaults to School@123)</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleImport} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CSV File</label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        required
                        className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 dark:file:bg-brand-900/30 file:text-brand-700 dark:file:text-brand-400 hover:file:bg-brand-100"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                      <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
                        {loading ? "Importing..." : "Import"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-emerald-600">{result.success}</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">Imported</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                      <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                      <p className="text-sm text-red-700 dark:text-red-400">Failed</p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  )}
                  <button onClick={() => { setOpen(false); setResult(null); }} className="btn-primary w-full text-sm">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
