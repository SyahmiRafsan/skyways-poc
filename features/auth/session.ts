import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/features/auth/constants"
import { parseSession, serializeSession } from "@/features/auth/server"
import type { SessionPayload } from "@/features/auth/types"

export async function setSessionCookie(session: SessionPayload): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, serializeSession(session), AUTH_COOKIE_OPTIONS)
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getSessionFromCookieStore(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return parseSession(raw)
}

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const raw = request.cookies.get(AUTH_COOKIE_NAME)?.value
  return parseSession(raw)
}
