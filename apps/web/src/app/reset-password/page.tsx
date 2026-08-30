"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    if (!token) setStatus({ type: "error", message: "Invalid or missing token" });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset");
      setStatus({ type: "success", message: "Password reset successful! Redirecting..." });
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 flex flex-col gap-6 scale-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">New Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create a new secure password</p>
        </div>

        {status.message && (
          <div className={`p-3 rounded-lg text-sm text-center ${status.type === "error" ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-green-500/10 text-green-600 border border-green-500/20"}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 transition-all shadow-md shadow-blue-500/20"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center items-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
