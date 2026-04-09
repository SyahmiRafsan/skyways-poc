"use client"

import { useActionState, useRef, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type IrreversibleActionButtonProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  triggerLabel: string
  pendingLabel: string
  confirmLabel: string
  disabled: boolean
  destructive?: boolean
  onConfirm: () => void
  onBeforeOpen?: () => boolean
}

const INITIAL_STATE: CapabilityActionState = { ok: false, error: null }
const IRREVERSIBLE_DESCRIPTION =
  "This status update cannot be reversed. Please confirm to continue."

function IrreversibleActionButton({
  open,
  onOpenChange,
  title,
  triggerLabel,
  pendingLabel,
  confirmLabel,
  disabled,
  destructive = false,
  onConfirm,
  onBeforeOpen,
}: IrreversibleActionButtonProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <Button
        type="button"
        variant={destructive ? "destructive" : "default"}
        disabled={disabled}
        onClick={() => {
          if (onBeforeOpen && !onBeforeOpen()) {
            return
          }
          onOpenChange(true)
        }}
      >
        {disabled ? pendingLabel : triggerLabel}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {IRREVERSIBLE_DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disabled}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={disabled}
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            {disabled ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

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

  const approveFormRef = useRef<HTMLFormElement>(null)
  const rejectFormRef = useRef<HTMLFormElement>(null)
  const markSubmittedFormRef = useRef<HTMLFormElement>(null)
  const markAuthorityApprovedFormRef = useRef<HTMLFormElement>(null)
  const markAuthorityRejectedFormRef = useRef<HTMLFormElement>(null)

  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [isMarkSubmittedConfirmOpen, setIsMarkSubmittedConfirmOpen] =
    useState(false)
  const [isMarkAuthorityApprovedConfirmOpen, setIsMarkAuthorityApprovedConfirmOpen] =
    useState(false)
  const [isMarkAuthorityRejectedConfirmOpen, setIsMarkAuthorityRejectedConfirmOpen] =
    useState(false)

  if (mode === "authority_ready") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authority Submission Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form ref={markSubmittedFormRef} action={markSubmittedFormAction}>
            <IrreversibleActionButton
              open={isMarkSubmittedConfirmOpen}
              onOpenChange={setIsMarkSubmittedConfirmOpen}
              title="Confirm Mark Submitted to Authority?"
              triggerLabel="Mark Submitted to Authority"
              pendingLabel="Marking Submitted..."
              confirmLabel="Confirm Mark Submitted"
              disabled={isMarkingSubmitted}
              onConfirm={() => markSubmittedFormRef.current?.requestSubmit()}
            />
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
        <CardContent className="grid grid-cols-1 gap-4">
          <form
            ref={markAuthorityApprovedFormRef}
            action={markAuthorityApprovedFormAction}
            className="space-y-3"
          >
            {markAuthorityApprovedState.error ? (
              <p className="text-sm text-destructive">
                {markAuthorityApprovedState.error}
              </p>
            ) : null}
            <IrreversibleActionButton
              open={isMarkAuthorityApprovedConfirmOpen}
              onOpenChange={setIsMarkAuthorityApprovedConfirmOpen}
              title="Confirm Mark Authority Approved?"
              triggerLabel="Mark Authority Approved"
              pendingLabel="Marking Authority Approved..."
              confirmLabel="Confirm Mark Authority Approved"
              disabled={isMarkingAuthorityApproved}
              onConfirm={() =>
                markAuthorityApprovedFormRef.current?.requestSubmit()
              }
            />
          </form>

          <Separator />

          <form
            ref={markAuthorityRejectedFormRef}
            action={markAuthorityRejectedFormAction}
            className="space-y-3"
          >
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
            <IrreversibleActionButton
              open={isMarkAuthorityRejectedConfirmOpen}
              onOpenChange={setIsMarkAuthorityRejectedConfirmOpen}
              title="Confirm Mark Authority Rejected?"
              triggerLabel="Mark Authority Rejected"
              pendingLabel="Marking Authority Rejected..."
              confirmLabel="Confirm Mark Authority Rejected"
              disabled={isMarkingAuthorityRejected}
              destructive
              onBeforeOpen={() =>
                markAuthorityRejectedFormRef.current?.reportValidity() ?? false
              }
              onConfirm={() =>
                markAuthorityRejectedFormRef.current?.requestSubmit()
              }
            />
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
      <CardContent className="grid grid-cols-1 gap-4">
        <form ref={approveFormRef} action={approveFormAction} className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Approve Remarks (optional)</span>
            <Textarea name="remarks" placeholder="Optional note" />
          </label>
          {approveState.error ? (
            <p className="text-sm text-destructive">{approveState.error}</p>
          ) : null}
          <IrreversibleActionButton
            open={isApproveConfirmOpen}
            onOpenChange={setIsApproveConfirmOpen}
            title="Confirm Approve?"
            triggerLabel="Approve"
            pendingLabel="Approving..."
            confirmLabel="Confirm Approve"
            disabled={isApproving}
            onConfirm={() => approveFormRef.current?.requestSubmit()}
          />
        </form>

        <Separator />

        <form ref={rejectFormRef} action={rejectFormAction} className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Reject Remarks (required)</span>
            <Textarea name="remarks" placeholder="Provide rejection reason" required />
          </label>
          {rejectState.error ? (
            <p className="text-sm text-destructive">{rejectState.error}</p>
          ) : null}
          <IrreversibleActionButton
            open={isRejectConfirmOpen}
            onOpenChange={setIsRejectConfirmOpen}
            title="Confirm Reject?"
            triggerLabel="Reject"
            pendingLabel="Rejecting..."
            confirmLabel="Confirm Reject"
            disabled={isRejecting}
            destructive
            onBeforeOpen={() => rejectFormRef.current?.reportValidity() ?? false}
            onConfirm={() => rejectFormRef.current?.requestSubmit()}
          />
        </form>
      </CardContent>
    </Card>
  )
}
