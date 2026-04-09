import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"

export const metadata: Metadata = {
  title: "Login",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-xl font-semibold">SkyCaplist Login</h1>
        <p className="text-sm text-muted-foreground">
          Use one of: user@skycaplist.test, tsm@skycaplist.test,
          qam@skycaplist.test, wm@skycaplist.test.
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
