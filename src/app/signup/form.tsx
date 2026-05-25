"use client";
import { useState, useTransition } from "react";
import { signupAction } from "./actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signupAction(formData);
          if (result?.error) setError(result.error);
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" required className="input" placeholder="Alex Doe" />
      </div>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={6} className="input" placeholder="At least 6 characters" />
      </div>
      {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}
      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center disabled:opacity-50">
        {isPending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}
