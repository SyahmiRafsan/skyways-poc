"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { CapabilityActionState } from "@/features/capabilities/types"

type ReviewAction = (
  state: CapabilityActionState,
  formData: FormData
) => Promise<CapabilityActionState>

type ReviewPanelMode = "internal" | "authority_ready" | "authority_submitted"

type ReviewPanelProps = {
  mode: ReviewPanelMode
  approveAction?: ReviewAction
  rejectAction?: ReviewAction
  markSubmittedAction?: ReviewAction
  markAuthorityApprovedAction?: ReviewAction
  markAuthorityRejectedAction?: ReviewAction
}

const INITIAL_STATE: CapabilityActionState = { ok: false, error: null }

export function ReviewPanel({
  mode,
  approveAction,
  rejectAction,
  markSubmittedAction,
  markAuthorityApprovedAction,
  markAuthorityRejectedAction,
}: ReviewPanelProps) {
  const [approveState, approveFormAction, isApproving] = useActionState(
    approveAction ?? (async () => ({ ok: false, error: "Approve not available" })),
    INITIAL_STATE
  )
  const [rejectState, rejectFormAction, isRejecting] = useActionState(
    rejectAction ?? (async () => ({ ok: false, error: "Reject not available" })),
    INITIAL_STATE
  )

  const [markSubmittedState, markSubmittedFormAction, isMarkingSubmitted] =
    useActionState(
      markSubmittedAction ??
        (async () => ({ ok: false, error: "Submit-to-authority not available" })),
      INITIAL_STATE
    )

  const [markAuthorityApprovedState, markAuthorityApprovedFormAction, isMarkingAuthorityApproved] =
    useActionState(
      markAuthorityApprovedAction ??
        (async () => ({ ok: false, error: "Authority-approved action not available" })),
      INITIAL_STATE
    )

  const [markAuthorityRejectedState, markAuthorityRejectedFormAction, isMarkingAuthorityRejected] =
    useActionState(
      markAuthorityRejectedAction ??
        (async () => ({ ok: false, error: "Authority-rejected action not available" })),
      INITIAL_STATE
    )

  if (mode === "authority_ready") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authority Submission Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={markSubmittedFormAction}>
            <Button type="submit" disabled={isMarkingSubmitted}>
              {isMarkingSubmitted
                ? "Marking Submitted..."
                : "Mark Submitted to Authority"}
            </Button>
          </form>
          {markSubmittedState.error ? (
            <p className="text-sm text-destructive">{markSubmittedState.error}</p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (mode === "authority_submitted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authority Submission Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1">
          <form action={markAuthorityApprovedFormAction} className="space-y-3">
            {markAuthorityApprovedState.error ? (
              <p className="text-sm text-destructive">
                {markAuthorityApprovedState.error}
              </p>
            ) : null}
            <Button type="submit" disabled={isMarkingAuthorityApproved}>
              {isMarkingAuthorityApproved
                ? "Marking Authority Approved..."
                : "Mark Authority Approved"}
            </Button>
          </form>

          <Separator />

          <form action={markAuthorityRejectedFormAction} className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                Authority Reject Remarks (required)
              </span>
              <Textarea
                name="remarks"
                placeholder="Provide authority rejection reason"
                required
              />
            </label>
            {markAuthorityRejectedState.error ? (
              <p className="text-sm text-destructive">
                {markAuthorityRejectedState.error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="destructive"
              disabled={isMarkingAuthorityRejected}
            >
              {isMarkingAuthorityRejected
                ? "Marking Authority Rejected..."
                : "Mark Authority Rejected"}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-1">
        <form action={approveFormAction} className="space-y-3">
          <label className="flex flex-col gap-1">
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

        <Separator />

        <form action={rejectFormAction} className="space-y-3">
          <label className="flex flex-col gap-1">
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
