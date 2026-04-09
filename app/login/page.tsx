import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"

export const metadata: Metadata = {
  title: "Login",
}

export default function LoginPage() {
  return (
    <section className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <div className="mb-4 flex w-fit items-center bg-[#051f44] p-3">
          <img src="/logo-skyways.webp" alt="Skyways" className="h-4 w-auto" />
        </div>{" "}
        <h1 className="text-center text-xl font-semibold">
          Login to SkyCaplist
        </h1>
        <p className="text-sm text-muted-foreground">
          Use one of: user@skycaplist.test, tsm@skycaplist.test,
          qam@skycaplist.test, wm@skycaplist.test.
        </p>
        <LoginForm />
      </div>
    </section>
  )
}
