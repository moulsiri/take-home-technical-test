"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "An error occurred");
      setStatus({ type: "success", message: data.message });
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
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Reset Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email to receive a reset link</p>
        </div>

        {status.message && (
          <div className={`p-3 rounded-lg text-sm text-center ${status.type === "error" ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-green-500/10 text-green-600 border border-green-500/20"}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 transition-all shadow-md shadow-blue-500/20"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-2">
          Remember your password? <Link href="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
