import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionFromRequest } from "@/features/auth/session"

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true
  if (pathname.startsWith("/_next")) return true
  if (pathname === "/favicon.ico") return true
  if (pathname === "/icon.png") return true
  if (pathname.includes(".")) return true
  return false
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = getSessionFromRequest(request)
  const isLoginPage = pathname === "/login"

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isPublicPath(pathname) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
}
