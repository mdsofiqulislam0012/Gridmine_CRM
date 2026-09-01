"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    const res = await login(email, password, remember);
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Login failed.");
    else router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center text-3xl font-extrabold">
            <span className="text-brand">Grid</span>
            <span className="rounded bg-brand px-1.5 text-white">mine</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Login</h1>
          <p className="mt-1 text-[13px] text-gray-500">Welcome, please sign in to your dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">Email Address</span>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-1.5 block">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-700">Password</span>
              <a href="#" className="text-[13px] text-brand hover:underline">Forgot Password?</a>
            </div>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-5 mt-3 flex items-center gap-2 text-[13px] text-gray-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-gray-300" />
            Remember me
          </label>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-md bg-brand-dark py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="mt-4 text-center text-[12px] text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-semibold text-brand hover:underline">
            Create Account
          </a>
        </p>
        </form>
      </div>
    </div>
  );
}
