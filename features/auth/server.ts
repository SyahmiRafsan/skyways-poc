import users from "@/features/auth/data/users.json"
import type { AuthUser, SessionPayload } from "@/features/auth/types"

const VALID_ROLES = new Set(["user", "tsm", "qam", "wm"])

export function findUserByEmail(email: string): AuthUser | null {
  const found = (users as AuthUser[]).find((user) => user.email === email)
  return found ?? null
}

export function validateLoginInput(email: string, password: string) {
  if (!email.includes("@")) {
    return { ok: false as const, message: "Email must include @" }
  }

  if (!password.trim()) {
    return { ok: false as const, message: "Password is required" }
  }

  return { ok: true as const }
}

export function serializeSession(session: SessionPayload): string {
  return JSON.stringify(session)
}

export function parseSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SessionPayload>

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      !VALID_ROLES.has(parsed.role)
    ) {
      return null
    }

    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      avatarUrl:
        typeof parsed.avatarUrl === "string" && parsed.avatarUrl
          ? parsed.avatarUrl
          : `https://i.pravatar.cc/150?u=${encodeURIComponent(parsed.email)}`,
    }
  } catch {
    return null
  }
}
