"use server"

import { redirect } from "next/navigation"

import { findUserByEmail, validateLoginInput } from "@/features/auth/server"
import { clearSessionCookie, setSessionCookie } from "@/features/auth/session"
import type { LoginActionState } from "@/features/auth/types"

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  const validated = validateLoginInput(email, password)
  if (!validated.ok) {
    return { error: validated.message }
  }

  const user = findUserByEmail(email)
  if (!user) {
    return { error: "Invalid credentials" }
  }

  await setSessionCookie(user)
  redirect("/")
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect("/login")
}
