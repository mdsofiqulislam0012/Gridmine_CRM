"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await signup(name, email, password);

    setLoading(false);

    if (!res.ok) {
      setError(res.error ?? "Signup failed.");
      return;
    }

    if (res.needsConfirmation) {
      setMessage(
        "Account created. Please check your email and confirm your account."
      );
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center text-3xl font-extrabold">
            <span className="text-brand">Grid</span>
            <span className="rounded bg-brand px-1.5 text-white">mine</span>
          </div>

          <h1 className="text-xl font-bold text-gray-900">Create Account</h1>

          <p className="mt-1 text-[13px] text-gray-500">
            Create your Gridmine CRM account
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
              {message}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Full Name
            </span>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Email Address
            </span>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Password
            </span>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Confirm Password
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border-subtle px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-dark py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-4 text-center text-[12px] text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}