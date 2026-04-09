"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { useId, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type {
  CapabilityReviewEvent,
  CapabilityStatus,
} from "@/features/capabilities/types"
import { cn } from "@/lib/utils"

type ReviewHistoryUser = {
  id: string
  name: string
  avatarUrl?: string
}

type ReviewHistoryProps = {
  events: CapabilityReviewEvent[]
  users: ReviewHistoryUser[]
  variant?: "sidebar" | "card"
}

function formatDuration(fromIso: string, toIso: string): string {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()

  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return "-"
  }

  const totalMinutes = Math.floor((to - from) / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const chunks: string[] = []
  if (days > 0) chunks.push(`${days}d`)
  if (hours > 0) chunks.push(`${hours}h`)
  if (minutes > 0 || chunks.length === 0) chunks.push(`${minutes}m`)

  return chunks.join(" ")
}

function formatReviewTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  const parts = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date)

  const valueByType = new Map(parts.map((part) => [part.type, part.value]))
  const day = valueByType.get("day") ?? ""
  const month = valueByType.get("month") ?? ""
  const year = valueByType.get("year") ?? ""
  const hour = valueByType.get("hour") ?? ""
  const minute = valueByType.get("minute") ?? "00"
  const dayPeriod = (valueByType.get("dayPeriod") ?? "").toUpperCase()

  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`.trim()
}

function getActionLabel(action: string, byRole: string): string {
  if (action === "MARK_SUBMITTED_TO_AUTHORITY") return "Submitted by"
  if (action === "MARK_AUTHORITY_APPROVED") return "MARKED APPROVED BY"
  if (action === "REJECT" || action === "MARK_AUTHORITY_REJECTED") {
    return "Rejected by"
  }
  if (byRole === "user") return "Prepared by"
  if (byRole === "tsm") return "Checked by"
  if (byRole === "qam" || byRole === "wm") return "Approved by"
  return "Updated by"
}

function formatStatusLabel(status: CapabilityStatus): string {
  if (status === "TSM_REVIEW") return "TSM Review"
  if (status === "QAM_REVIEW") return "QAM Review"
  if (status === "WM_REVIEW") return "WM Review"
  if (status === "READY_FOR_SUBMISSION") return "Ready for Submission"
  if (status === "SUBMITTED_TO_AUTHORITY") return "Submitted to Authority"
  if (status === "AUTHORITY_APPROVED") return "Authority Approved"
  if (status === "AUTHORITY_REJECTED") return "Authority Rejected"
  if (status === "USER_EDIT_REQUIRED") return "User Edit Required"
  if (status === "DRAFT") return "Draft"
  return status
}

function UserAvatarOnly({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string
}) {
  return (
    <Avatar className="size-5" title={name}>
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}

export function ReviewHistory({
  events,
  users,
  variant = "card",
}: ReviewHistoryProps) {
  const [showStatusBadges, setShowStatusBadges] = useState(false)
  const switchId = useId()

  const userIdToUser = new Map(users.map((user) => [user.id, user] as const))

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Review History</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor={switchId} className="text-xs text-muted-foreground">
            Show statuses
          </Label>
          <Switch
            id={switchId}
            checked={showStatusBadges}
            onCheckedChange={setShowStatusBadges}
            size="sm"
            aria-label="Show or hide review status badges"
          />
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No review events yet.</p>
      ) : (
        <ul
          className={cn(
            "space-y-4 text-sm",
            !showStatusBadges && "[&_.review-status-row]:hidden"
          )}
        >
          {events.map((event, index) => {
            const previous = events[index - 1]
            const sincePrevious = previous
              ? formatDuration(previous.at, event.at)
              : "-"
            const showDuration = sincePrevious !== "-"

            return (
              <li
                key={`${event.at}-${index}`}
                className="relative rounded-md border border-border p-3"
              >
                {index < events.length - 1 ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-full left-1/2 h-4 w-px -translate-x-1/2 bg-border"
                  />
                ) : null}

                <div className="flex items-start justify-between gap-4">
                  <p className="inline-flex items-center gap-2 whitespace-nowrap">
                    <span
                      className={cn(
                        variant === "sidebar"
                          ? "text-xs font-medium uppercase"
                          : "font-medium"
                      )}
                    >
                      {getActionLabel(event.action, event.byRole)}
                    </span>{" "}
                    {(() => {
                      const actor = userIdToUser.get(event.byUserId)
                      if (!actor) return event.byUserId

                      return (
                        <UserAvatarOnly
                          name={actor.name}
                          avatarUrl={actor.avatarUrl}
                        />
                      )
                    })()}
                  </p>

                  {variant === "card" ? (
                    showDuration ? (
                      <span className="text-xs text-muted-foreground">
                        {sincePrevious}
                      </span>
                    ) : null
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {formatReviewTimestamp(event.at)}
                    </p>
                  )}
                </div>

                <div
                  className={cn(
                    "review-status-row flex flex-wrap items-center gap-2 text-muted-foreground",
                    variant === "sidebar" ? "mt-2" : "mt-1"
                  )}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "justify-start",
                      variant === "sidebar"
                        ? "max-w-34 lg:max-w-36"
                        : "max-w-24"
                    )}
                    title={formatStatusLabel(event.fromStatus)}
                  >
                    <span
                      className={cn(
                        "block w-full truncate text-left",
                        variant === "card" && "[direction:rtl]"
                      )}
                      title={formatStatusLabel(event.fromStatus)}
                    >
                      {formatStatusLabel(event.fromStatus)}
                    </span>
                  </Badge>
                  <IconArrowRight size={14} className="shrink-0" />
                  <Badge
                    variant="secondary"
                    className={cn(
                      "justify-start",
                      variant === "sidebar"
                        ? "max-w-34 lg:max-w-36"
                        : "max-w-24"
                    )}
                    title={formatStatusLabel(event.toStatus)}
                  >
                    <span
                      className={cn(
                        "block w-full truncate text-left",
                        variant === "card" && "[direction:rtl]"
                      )}
                      title={formatStatusLabel(event.toStatus)}
                    >
                      {formatStatusLabel(event.toStatus)}
                    </span>
                  </Badge>
                </div>

                {variant === "card" ? (
                  <p className="mt-1 text-muted-foreground">
                    {formatReviewTimestamp(event.at)}
                  </p>
                ) : null}

                {event.remarks ? (
                  <p className="mt-3 text-muted-foreground">
                    <span className="text-xs uppercase">Remarks</span>
                    <br /> {event.remarks}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
