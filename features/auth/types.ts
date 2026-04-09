export type Role = "user" | "tsm" | "qam" | "wm"

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type SessionPayload = AuthUser

export type LoginActionState = {
  error: string | null
}
