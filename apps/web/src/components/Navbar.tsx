"use client";

import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api";

export function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    logout();
    router.push("/login");
  };

  return (
    <nav className="w-full glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
        <Link href="/">SecureApp</Link>
      </div>
      <div className="flex gap-4 items-center">
        {isAuthenticated ? (
          <>
            <Link href="/profile" className="text-sm font-medium hover:text-blue-500 transition-colors">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:bg-opacity-90 transition-all shadow-md"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium hover:text-blue-500 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Start for free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
