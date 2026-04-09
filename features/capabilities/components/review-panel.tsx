"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { CapabilityActionState } from "@/features/capabilities/types"

type ReviewAction = (
  state: CapabilityActionState,
  formData: FormData
) => Promise<CapabilityActionState>

type ReviewPanelProps = {
  approveAction: ReviewAction
  rejectAction: ReviewAction
}

const INITIAL_STATE: CapabilityActionState = { ok: false, error: null }

export function ReviewPanel({ approveAction, rejectAction }: ReviewPanelProps) {
  const [approveState, approveFormAction, isApproving] = useActionState(
    approveAction,
    INITIAL_STATE
  )
  const [rejectState, rejectFormAction, isRejecting] = useActionState(
    rejectAction,
    INITIAL_STATE
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <form action={approveFormAction} className="space-y-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Approve Remarks (optional)</span>
            <Textarea name="remarks" placeholder="Optional note" />
          </label>
          {approveState.error ? (
            <p className="text-sm text-destructive">{approveState.error}</p>
          ) : null}
          <Button type="submit" disabled={isApproving}>
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </form>

        <form action={rejectFormAction} className="space-y-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Reject Remarks (required)</span>
            <Textarea name="remarks" placeholder="Provide rejection reason" required />
          </label>
          {rejectState.error ? (
            <p className="text-sm text-destructive">{rejectState.error}</p>
          ) : null}
          <Button type="submit" variant="destructive" disabled={isRejecting}>
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
