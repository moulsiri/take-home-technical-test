"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user, login } = useAuthStore();
  const [loading, setLoading] = useState(!user);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      if (user) return;
      try {
        const res = await fetchApi("/users/profile");
        if (res.ok) {
          const data = await res.json();
          login(data);
        } else {
          router.push("/login");
        }
      } catch (e) {
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
      <div className="glass-panel w-full max-w-2xl p-8 pt-10">
        <div className="flex items-center gap-6 mb-8">
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
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
