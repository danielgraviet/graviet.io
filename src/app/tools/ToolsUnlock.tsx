"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function ToolsUnlock() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Invalid password.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUnlock} className="mx-auto max-w-xl border-y border-border py-6">
      <label className="block">
        <span className="mb-2 flex items-center gap-1.5 text-sm text-text-secondary">
          <Lock className="h-3.5 w-3.5" />
          Password
        </span>
        <div className="flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            className="w-full max-w-xs border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            Unlock
          </button>
        </div>
      </label>
      {error && <p className="mt-3 text-sm text-text-secondary">{error}</p>}
    </form>
  );
}
