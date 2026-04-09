"use client"

import { useMemo } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { CapabilityRevisionSnapshot } from "@/features/capabilities/types"

type RevisionHistoryUser = {
  id: string
  name: string
  avatarUrl?: string
}

type RevisionHistoryProps = {
  snapshots: CapabilityRevisionSnapshot[]
  users: RevisionHistoryUser[]
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

function formatTriggerLabel(trigger: CapabilityRevisionSnapshot["trigger"]): string {
  if (trigger === "MIGRATION_BASELINE") {
    return "Migration Baseline"
  }

  return "Resubmit"
}

export function RevisionHistory({ snapshots, users }: RevisionHistoryProps) {
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((left, right) => right.revision - left.revision),
    [snapshots]
  )
  const userIdToUser = new Map(users.map((user) => [user.id, user] as const))

  if (sortedSnapshots.length === 0) {
    return <p className="text-sm text-muted-foreground">No revision snapshots yet.</p>
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Revision History</h2>
      <ul className="space-y-3 text-sm">
        {sortedSnapshots.map((snapshot, index) => {
          const actor = userIdToUser.get(snapshot.capturedByUserId)

          return (
            <li key={`${snapshot.capturedAt}-${snapshot.revision}-${index}`}>
              <details className="rounded-md border border-border p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2 pr-2">
                    <div className="inline-flex items-center gap-2">
                      <Badge variant="secondary">R{snapshot.revision}</Badge>
                      <span className="font-medium">{formatTriggerLabel(snapshot.trigger)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatReviewTimestamp(snapshot.capturedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      {actor ? (
                        <Avatar className="size-5">
                          <AvatarImage src={actor.avatarUrl} alt={actor.name} />
                          <AvatarFallback>
                            {actor.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <span>{actor?.name ?? snapshot.capturedByUserId}</span>
                    </span>
                    <span>Ref: {snapshot.referenceNo}</span>
                  </div>
                </summary>

                <div className="mt-3 grid grid-cols-1 gap-2 rounded-md bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Aircraft:</span>{" "}
                    {snapshot.payload.aircraft}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Aircraft Models:</span>{" "}
                    {snapshot.payload.aircraftModels.join(" | ") || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Manufacturer:</span>{" "}
                    {snapshot.payload.manufacturer}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Rating:</span>{" "}
                    {snapshot.payload.rating}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">ATA Chapter:</span>{" "}
                    {snapshot.payload.ataChapter}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Designation:</span>{" "}
                    {snapshot.payload.partDesignationDesc}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Category:</span>{" "}
                    {snapshot.payload.category}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">P/N Series:</span>{" "}
                    {snapshot.payload.partNumberSeries}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">P/N Models:</span>{" "}
                    {snapshot.payload.partNumberModelNos.join(" | ") || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Locations:</span>{" "}
                    {[
                      snapshot.payload.locations.dkSgd ? "DK-SGD" : null,
                      snapshot.payload.locations.dkBll ? "DK-BLL" : null,
                      snapshot.payload.locations.myKul ? "MY-KUL" : null,
                    ]
                      .filter(Boolean)
                      .join(" | ") || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Maintenance References:</span>{" "}
                    {snapshot.payload.maintenanceReferences.join(" | ") || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Equipment/Tools:</span>{" "}
                    {snapshot.payload.equipmentTools.join(" | ") || "-"}
                  </p>
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
