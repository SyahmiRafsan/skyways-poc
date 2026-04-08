import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { logoutAction } from "@/features/auth/actions"
import { getSessionFromCookieStore } from "@/features/auth/session"

export const metadata: Metadata = {
  title: "Home | SkyCaplist",
}

export default async function Page() {
  const session = await getSessionFromCookieStore()

  return (
    <main className="flex min-h-svh p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">SkyCaplist</h1>
        <p className="text-sm text-muted-foreground">
          Authenticated session details
        </p>
        <div className="rounded-md border border-border p-4 text-sm leading-relaxed">
          <p>
            <span className="font-medium">Name:</span> {session?.name ?? "-"}
          </p>
          <p>
            <span className="font-medium">Email:</span> {session?.email ?? "-"}
          </p>
          <p>
            <span className="font-medium">Role:</span> {session?.role ?? "-"}
          </p>
          <p>
            <span className="font-medium">ID:</span> {session?.id ?? "-"}
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit">Logout</Button>
        </form>
      </div>
    </main>
  )
}
