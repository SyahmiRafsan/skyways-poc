"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ReviewHistory } from "@/features/capabilities/components/review-history"
import { RevisionHistory } from "@/features/capabilities/components/revision-history"
import type {
  CapabilityReviewEvent,
  CapabilityRevisionSnapshot,
} from "@/features/capabilities/types"

type HistoryTabsUser = {
  id: string
  name: string
  avatarUrl?: string
}

type HistoryTabsProps = {
  reviewEvents: CapabilityReviewEvent[]
  revisionSnapshots: CapabilityRevisionSnapshot[]
  users: HistoryTabsUser[]
}

export function HistoryTabs({
  reviewEvents,
  revisionSnapshots,
  users,
}: HistoryTabsProps) {
  const [tab, setTab] = useState<"review" | "revision">("review")

  return (
    <section className="space-y-3">
      <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
        <Button
          type="button"
          variant={tab === "review" ? "default" : "outline"}
          size="sm"
          className="h-9 px-3"
          onClick={() => setTab("review")}
        >
          Review History
        </Button>
        <Button
          type="button"
          variant={tab === "revision" ? "default" : "outline"}
          size="sm"
          className="h-9 px-3"
          onClick={() => setTab("revision")}
        >
          Revision History
        </Button>
      </div>

      {tab === "review" ? (
        <ReviewHistory events={reviewEvents} users={users} variant="sidebar" />
      ) : (
        <RevisionHistory snapshots={revisionSnapshots} users={users} />
      )}
    </section>
  )
}
