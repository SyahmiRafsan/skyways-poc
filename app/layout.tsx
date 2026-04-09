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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/features/auth/actions"
import { getSessionFromCookieStore } from "@/features/auth/session"
import {
  getPendingApprovalsForRole,
  readCapabilities,
} from "@/features/capabilities/server"
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
  const currentYear = new Date().getFullYear()
  const session = await getSessionFromCookieStore()
  const myPendingCount = session
    ? getPendingApprovalsForRole(await readCapabilities(), session.role).length
    : 0
  const avatarSrc = session ? session.avatarUrl : null
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
                  <img
                    src="/logo-skyways.webp"
                    alt="Skyways"
                    className="h-4 w-auto"
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

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground"
                          />
                        }
                      >
                        Capabilities
                        <IconChevronDown
                          size={16}
                          className="text-muted-foreground"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-56 rounded-md border border-border bg-popover p-1 shadow-md"
                      >
                        <DropdownMenuItem
                          render={<Link href="/capabilities" />}
                          className="gap-2 rounded-md px-2 py-2"
                        >
                          <IconListDetails
                            size={16}
                            className="text-muted-foreground"
                          />
                          Master List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={<Link href="/capabilities/new" />}
                          className="gap-2 rounded-md px-2 py-2"
                        >
                          <IconPlus
                            size={16}
                            className="text-muted-foreground"
                          />
                          Register PN
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link
                      href="/approvals"
                      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Approvals
                      {myPendingCount > 0 ? (
                        <Badge className="min-w-5 px-1.5">
                          {myPendingCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </nav>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground"
                        />
                      }
                    >
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
                        className="text-muted-foreground"
                      />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-md border border-border bg-popover p-1 shadow-md"
                    >
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>
            ) : null}
            <main className="flex flex-1 flex-col">{children}</main>
            <footer className="mt-auto px-6 py-6 pb-4 text-center text-xs text-muted-foreground uppercase">
              © {currentYear} SkyCaplist by Skyways Technics. All rights
              reserved.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
