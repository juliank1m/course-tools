"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPath, setNextPath] = useState<string>("/");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        setNextPath(next);
      }
    } catch {
      // Ignore parse errors and keep default "/"
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Invalid password";
        setError(msg);
        setIsLoading(false);
        return;
      }

      router.push(nextPath || "/");
    } catch (err: any) {
      setError("Unable to log in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60 px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="JKCT Logo"
            width={200}
            height={60}
            className="w-40 sm:w-48 h-auto drop-shadow-sm"
            priority
          />
        </div>

        <div className="bg-white/75 backdrop-blur-lg border border-purple-100 shadow-md rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
            Unlock Course Tools
          </h1>
          <p className="text-sm text-gray-600 mb-3 text-center">
            This site is password protected. Enter the shared access password to continue.
          </p>
          <p className="text-xs text-gray-500 mb-6 text-center">
            Access is restricted to prevent spam and manage costs because the tools use a paid AI API.
            To request access, contact{" "}
            <span className="font-medium text-purple-500">juliankim4321@gmail.com</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-200 via-blue-200 to-pink-200 text-purple-800 font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all border border-purple-100"
            >
              {isLoading ? "Checking..." : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}


