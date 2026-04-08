import type { Metadata } from "next"
import { IconLogout } from "@tabler/icons-react"
import { Geist_Mono, Inter } from "next/font/google"
import Image from "next/image"

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
          <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col">
            {session ? (
              <header className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center bg-[#051f44] p-3">
                  <Image
                    src="/logo-skyways.webp"
                    alt="Skyways"
                    width={112}
                    height={16}
                    className="h-4 w-auto"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{session.name}</span>
                  <Avatar className="size-9">
                    <AvatarImage
                      src={avatarSrc ?? undefined}
                      alt={session.name}
                    />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <ThemeToggleButton />
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
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
