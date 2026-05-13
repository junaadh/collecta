"use client";

import { Button } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login({ email, password });

      router.push(user.role == "SUPERVISOR" ? "/admin" : "/agent");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen dark:bg-[#09090b] bg-[#fcfcfc] flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-sm fade-up">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl dark:bg-amber-500/10 bg-orange-500/10 border dark:border-amber-500/20 border-orange-500/20 mb-4">
              <span className="text-orange-400 dark:text-amber-400 text-lg font-mono font-bold">
                C0
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold dark:text-zinc-100 text-zinc-900 tracking-tight">
              Collecta
            </h1>
            <p className="dark:text-zinc-600 text-zinc-400 text-[13px] mt-1 font-mono">
              Loan Collection Management
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#f4f4f4] dark:bg-[#111113] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-[#fafafa] dark:bg-[#18181b] border border-[#e4e4e7] dark:border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-amber-500 dark:focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#fafafa] dark:bg-[#18181b] border border-[#e4e4e7] dark:border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-amber-500 dark:focus:border-amber-600 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50/50  dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-lg px-4 py-2.5 text-[12px] dark:text-red-400 text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || password.length == 0 || email.length == 0}
                className="w-full justify-center"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>

          <DemoCredentials
            enabled={showDemoAccounts}
            setEmail={setEmail}
            setPassword={setPassword}
          />
        </div>
      </div>
    </>
  );
}

function DemoCredentials({
  enabled = false,
  setEmail,
  setPassword,
}: {
  enabled?: boolean;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <>
      {enabled && (
        <div className="mt-5 bg-[#f7f7f8] dark:bg-[#0f0f10] border border-[#e4e4e7] dark:border-[#1e1e21] rounded-lg p-4">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-700 uppercase tracking-widest mb-2">
            Demo accounts
          </div>

          <div className="space-y-1.5">
            {[
              {
                email: "supervisor@collecta.local",
                password: "Aishath@Collecta123",
                role: "Supervisor",
              },
              {
                email: "ali@collecta.local",
                password: "Ali@Collecta123",
                role: "Agent",
              },
              {
                email: "ahmed@collecta.local",
                password: "Ahmed@Collecta123",
                role: "Agent",
              },
            ].map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                }}
                className="w-full min-h-11 flex items-center justify-between text-left px-3 py-1.5 rounded  hover:bg-[#ededf0] dark:hover:bg-[#18181b] transition-colors touch-manipulation"
              >
                <span className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400">
                  {cred.email}
                </span>

                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-700 uppercase">
                  {cred.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
