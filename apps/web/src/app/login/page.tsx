"use client";

import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();

      
      // We don't have the user object in the auth response, let's fetch profile
      // or we can decode token
      const profileRes = await fetchApi("/users/profile");
      if (profileRes.ok) {
        const user = await profileRes.json();
        login(user);
        router.push("/profile");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 pt-10 pb-12 flex flex-col gap-6 scale-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg p-3 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
