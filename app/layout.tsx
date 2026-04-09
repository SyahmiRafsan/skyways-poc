import type { Metadata } from "next"
import {
  IconChevronDown,
  IconListDetails,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react"
import { Geist_Mono, Inter } from "next/font/google"
import Image from "next/image"
import Link from "next/link"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logoutAction } from "@/features/auth/actions"
import { getSessionFromCookieStore } from "@/features/auth/session"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "SkyCaplist",
    template: "%s | SkyCaplist",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSessionFromCookieStore()
  const avatarSrc = session
    ? `https://i.pravatar.cc/150?u=${encodeURIComponent(session.email)}`
    : null
  const avatarFallback = session?.name?.slice(0, 1).toUpperCase() ?? "U"

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col">
            {session ? (
              <header className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center bg-[#051f44] p-3">
                  <Image
                    src="/logo-skyways.webp"
                    alt="Skyways"
                    width={160}
                    height={24}
                    className="h-4 w-auto"
                    priority
                  />
                </div>

                <div className="flex items-center gap-2">
                  <nav className="flex items-center gap-1">
                    <Link
                      href="/"
                      className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Dashboard
                    </Link>

                    <details className="group relative">
                      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                        Capabilities
                        <IconChevronDown
                          size={16}
                          className="text-muted-foreground transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <div className="absolute top-full left-0 z-20 mt-2 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
                        <Link
                          href="/capabilities"
                          className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <IconListDetails
                            size={16}
                            className="text-muted-foreground"
                          />
                          Master List
                        </Link>
                        <Link
                          href="/capabilities/new"
                          className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <IconPlus size={16} className="text-muted-foreground" />
                          Register PN
                        </Link>
                      </div>
                    </details>

                    <Link
                      href="/approvals"
                      className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Approvals
                    </Link>
                  </nav>

                  <details className="group relative">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={avatarSrc ?? undefined}
                          alt={session.name}
                        />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>
                      <span>{session.name}</span>
                      <IconChevronDown
                        size={16}
                        className="text-muted-foreground transition-transform group-open:rotate-180"
                      />
                    </summary>

                    <div className="absolute top-full right-0 z-20 mt-2 w-44 rounded-md border border-border bg-popover p-1 shadow-md">
                      <ThemeToggleButton
                        showLabel
                        className="h-9 w-full justify-start rounded-md border-0 px-2"
                      />
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <IconLogout
                            size={16}
                            className="text-muted-foreground"
                          />
                          Logout
                        </button>
                      </form>
                    </div>
                  </details>
                </div>
              </header>
            ) : null}
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
