"use client"

import { useActionState } from "react"

import { loginAction } from "@/features/auth/actions"

const INITIAL_STATE = { error: null as string | null }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE
  )

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          placeholder="user@skycaplist.test"
          defaultValue="user@skycaplist.test"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          placeholder="anything"
          defaultValue="anything"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
