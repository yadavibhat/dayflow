"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Redirect directly to Employee Directory per wireframe specification
    setTimeout(() => {
      router.push("/employees");
    }, 600);
  };

  return (
    <div className="bg-slate-surface text-ink antialiased min-h-screen flex items-center justify-center p-gutter-mobile md:p-gutter-desktop selection:bg-secondary-fixed selection:text-ink font-sans">
      <main className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-border-light rounded-xl p-space-xl flex flex-col items-center shadow-sm">
          {/* Logo Branding */}
          <div className="flex flex-col items-center mb-space-xl text-center">
            <Link href="/dashboard" className="mb-space-sm">
              <Logo variant="full" size="lg" />
            </Link>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold mt-1">
              Human Resource Management System
            </p>
          </div>

          {/* Form */}
          <form className="w-full flex flex-col gap-space-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-unit">
              <label
                className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1"
                htmlFor="email"
              >
                Login ID / Email
              </label>
              <input
                className="w-full bg-surface-container-lowest border border-border-light rounded-lg px-space-md py-3 font-body-md text-ink placeholder-secondary-fixed-dim focus:outline-none focus:border-ink focus:ring-0 transition-colors duration-200"
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-unit">
              <div className="flex justify-between items-center w-full mb-1">
                <label
                  className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="font-label-sm text-label-sm text-secondary hover:text-ink transition-colors duration-200 hover:underline"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot?
                </a>
              </div>
              <input
                className="w-full bg-surface-container-lowest border border-border-light rounded-lg px-space-md py-3 font-body-md text-ink placeholder-secondary-fixed-dim focus:outline-none focus:border-ink focus:ring-0 transition-colors duration-200"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full mt-space-sm bg-ink text-on-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary transition-colors duration-200 flex justify-center items-center gap-space-sm group active:scale-98 cursor-pointer"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform duration-200">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-space-lg text-center font-body-md text-body-md text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            className="text-ink font-medium hover:underline underline-offset-4 decoration-border-light hover:decoration-ink transition-colors duration-200"
            href="/signup"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
