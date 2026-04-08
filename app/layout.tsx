import type { Metadata } from "next"
import { IconLogout } from "@tabler/icons-react"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
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
          {session ? (
            <header className="flex items-center justify-end border-b px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{session.name}</span>
                <Avatar className="size-9">
                  <AvatarImage
                    src={avatarSrc ?? undefined}
                    alt={session.name}
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    aria-label="Logout"
                    title="Logout"
                    className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <IconLogout size={18} />
                  </button>
                </form>
              </div>
            </header>
          ) : null}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
