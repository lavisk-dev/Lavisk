"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();

    if (!json.success) {
      setError(json.error ?? "Incorrect username or password");
      setIsLoading(false);
      return;
    }

    const redirectTo = searchParams.get("from") ?? "/admin";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="ambient-bg">
        <div
          className="ambient-blob"
          style={{
            top: "-10%",
            left: "-8%",
            width: "46vw",
            height: "46vw",
            background: "radial-gradient(circle at 40% 40%,#FFB6C9,transparent 68%)",
            opacity: 0.5,
          }}
        />
      </div>

      <div className="relative w-full max-w-sm rounded-lg bg-white p-8 shadow-pop">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-extrabold text-ink">
            {BRAND_NAME}
            <span className="text-brand">.</span>
          </div>
          <p className="mt-2 text-sm text-muted">Sign in to manage your store.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          This is a placeholder credentials gate — set ADMIN_USERNAME / ADMIN_PASSWORD in your
          environment, or swap it for Supabase Auth.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
