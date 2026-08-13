"use client";

import { FormEvent, useState } from "react";
import { Lock } from "lucide-react";
import { setLearnPassword } from "@/lib/learn/client";

export default function LearnUnlock({
  onUnlock,
}: {
  onUnlock: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tools/learn/subjects?password=${encodeURIComponent(password)}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Invalid password.");
        return;
      }
      setLearnPassword(password);
      onUnlock(password);
    } catch {
      setError("Failed to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUnlock} className="border-y border-border py-5">
      <label className="block">
        <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <Lock className="h-3.5 w-3.5" />
          Password
        </span>
        <div className="flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full max-w-xs border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            Unlock
          </button>
        </div>
      </label>
      {error && <p className="mt-3 text-sm text-text-secondary">{error}</p>}
    </form>
  );
}
