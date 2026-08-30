"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(!user);
  const [adminData, setAdminData] = useState<any>(null);
  const [adminError, setAdminError] = useState("");
  const router = useRouter();

  const fetchAdminRoute = async () => {
    setAdminError("");
    setAdminData(null);
    try {
      const res = await fetchApi("/auth/admin-dashboard");
      if (res.ok) {
        setAdminData(await res.json());
      } else {
        const errorData = await res.json().catch(() => ({}));
        setAdminError(errorData.detail || "Forbidden. You must be an ADMIN to access this routes.");
      }
    } catch {
      setAdminError("Network error calling admin route");
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (user) return;
      try {
        const res = await fetchApi("/auth/me");
        if (res.ok) {
          const data = await res.json();
          login(data);
        } else {
          // Fallback if interceptor didn't navigate
          await fetchApi("/auth/logout", { method: "POST" });
          logout();
          router.push("/login");
        }
      } catch (e) {
        await fetchApi("/auth/logout", { method: "POST" });
        logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, login, router]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col items-center p-8 mt-12 gap-8">
      <div className="glass-panel w-full max-w-2xl p-8 pt-10 relative overflow-hidden">
        {!user.isVerified && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-white text-center py-2 text-sm font-medium shadow-md flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Your email is unverified. Please check your inbox to verify your account to unlock full features.
          </div>
        )}
      
        <div className={`flex items-center gap-6 mb-8 ${!user.isVerified ? 'mt-4' : ''}`}>
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
            <p className="text-gray-500 font-medium mt-1">{user.email}</p>
            <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">User ID</h3>
            <p className="font-mono text-sm break-all">{user.id}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/40 dark:bg-black/40 border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Account Status</h3>
            <p className="font-medium text-green-600 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-400'}`}></span> 
              {user.isVerified ? 'Verified Active' : 'Pending Verification'}
            </p>
          </div>
        </div>
      </div>
      
      {/* RBAC Demo Section */}
      <div className="glass-panel w-full max-w-2xl p-8 pb-10 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Role Based Access Control 🔒</h2>
          <p className="text-gray-500 mt-1">Test fetching an exclusively admin-only backend route</p>
        </div>
        
        <button 
          onClick={fetchAdminRoute}
          className="w-full max-w-sm py-3 rounded-xl font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-80 active:scale-95 transition-all shadow-md"
        >
          Access Admin Dashboard
        </button>

        {adminError && (
          <div className="p-4 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            ❌ {adminError}
          </div>
        )}
        
        {adminData && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 font-medium text-green-700 animate-in fade-in slide-in-from-top-2">
            ✅ {adminData.message}
            <div className="mt-2 text-sm bg-white/50 dark:bg-black/50 p-2 rounded-lg font-mono">
              <pre>{JSON.stringify(adminData.secretStats, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
