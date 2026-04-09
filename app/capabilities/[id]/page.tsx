import type { Metadata } from "next"
import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  approveCapabilityAction,
  markAuthorityApprovedAction,
  markAuthorityRejectedAction,
  markSubmittedToAuthorityAction,
  rejectCapabilityAction,
  submitCapabilityAction,
  updateCapabilityAction,
} from "@/features/capabilities/actions"
import { CapabilityForm } from "@/features/capabilities/components/capability-form"
import { CapabilityView } from "@/features/capabilities/components/capability-view"
import { ReviewPanel } from "@/features/capabilities/components/review-panel"
import {
  canQamAuthorityAct,
  canReviewerAct,
  canUserEditCapability,
  findCapabilityById,
  toMultilineText,
} from "@/features/capabilities/server"
import usersData from "@/features/auth/data/users.json"
import { getSessionFromCookieStore } from "@/features/auth/session"

export const metadata: Metadata = {
  title: "PN Form",
}

type PageProps = {
  params: Promise<{ id: string }>
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

function getActionLabel(action: string): string {
  if (action === "SUBMIT") return "Submitted by"
  if (action === "RESUBMIT") return "Resubmitted by"
  if (action === "APPROVE") return "Approved by"
  if (action === "REJECT") return "Rejected by"
  if (action === "MARK_SUBMITTED_TO_AUTHORITY") return "Marked submitted by"
  if (action === "MARK_AUTHORITY_APPROVED") return "Authority approved by"
  if (action === "MARK_AUTHORITY_REJECTED") return "Authority rejected by"
  return "Updated by"
}

function formatStatusLabel(status: string): string {
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

export default async function CapabilityDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSessionFromCookieStore()
  const capability = await findCapabilityById(id)

  if (!capability) {
    return (
      <main className="space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>PN Form not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-sm text-primary underline">
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!session) {
    return null
  }

  const formValues = {
    referenceNo: capability.referenceNo,
    aircraft: capability.aircraft,
    aircraftModels: toMultilineText(capability.aircraftModels),
    manufacturer: capability.manufacturer,
    rating: capability.rating,
    ataChapter: String(capability.ataChapter),
    partDesignationDesc: capability.partDesignationDesc,
    category: capability.category,
    partNumberSeries: capability.partNumberSeries,
    partNumberModelNos: toMultilineText(capability.partNumberModelNos),
    locationDkSgd: capability.locations.dkSgd,
    locationDkBll: capability.locations.dkBll,
    locationMyKul: capability.locations.myKul,
    maintenanceReferences: toMultilineText(capability.maintenanceReferences),
    equipmentTools: toMultilineText(capability.equipmentTools),
  }

  const canEdit = canUserEditCapability(capability, session.id, session.role)
  const canReview =
    canReviewerAct(capability, session.role) ||
    canQamAuthorityAct(capability, session.role)
  const userIdToName = new Map(
    usersData.map((user) => [user.id, user.name] as const)
  )
  const roleToUser = new Map(usersData.map((user) => [user.role, user] as const))

  const boundUpdateAction = updateCapabilityAction.bind(null, capability.id)
  const boundSubmitAction = submitCapabilityAction.bind(null, capability.id)
  const boundApproveAction = approveCapabilityAction.bind(null, capability.id)
  const boundRejectAction = rejectCapabilityAction.bind(null, capability.id)
  const boundMarkSubmittedAction = markSubmittedToAuthorityAction.bind(
    null,
    capability.id
  )
  const boundMarkAuthorityApprovedAction = markAuthorityApprovedAction.bind(
    null,
    capability.id
  )
  const boundMarkAuthorityRejectedAction = markAuthorityRejectedAction.bind(
    null,
    capability.id
  )

  const reviewPanelMode =
    capability.status === "READY_FOR_SUBMISSION"
      ? "authority_ready"
      : capability.status === "SUBMITTED_TO_AUTHORITY"
        ? "authority_submitted"
        : "internal"

  return (
    <main className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>PN Form #{capability.referenceNo}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm md:grid-cols-4">
          <p>
            <span className="font-medium">Status:</span>{" "}
            <Badge variant="secondary">
              {formatStatusLabel(capability.status)}
            </Badge>
          </p>
          <p>
            <span className="font-medium">Revision:</span> R
            {capability.revision}
          </p>
          {capability.status !== "AUTHORITY_APPROVED" ? (
            <p>
              <span className="font-medium">Current Reviewer:</span>{" "}
              {capability.currentReviewerRole
                ? (() => {
                    const reviewer = roleToUser.get(capability.currentReviewerRole)
                    if (!reviewer) return capability.currentReviewerRole
                    return `${reviewer.name} (${reviewer.id})`
                  })()
                : "-"}
            </p>
          ) : null}
          <p>
            <span className="font-medium">Submitted By:</span>{" "}
            {userIdToName.get(capability.submittedByUserId) ??
              capability.submittedByUserId}{" "}
            ({capability.submittedByUserId})
          </p>
        </CardContent>
      </Card>

      {canEdit ? (
        <CapabilityForm
          title="Update PN Form"
          values={formValues}
          saveAction={boundUpdateAction}
          saveButtonLabel="Save Changes"
          submitAction={boundSubmitAction}
        />
      ) : (
        <CapabilityView capability={capability} />
      )}

      {canReview ? (
        <ReviewPanel
          mode={reviewPanelMode}
          approveAction={boundApproveAction}
          rejectAction={boundRejectAction}
          markSubmittedAction={boundMarkSubmittedAction}
          markAuthorityApprovedAction={boundMarkAuthorityApprovedAction}
          markAuthorityRejectedAction={boundMarkAuthorityRejectedAction}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          {capability.reviewTrail.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No review events yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {capability.reviewTrail.map((event, index) => {
                const previous = capability.reviewTrail[index - 1]
                const sincePrevious = previous
                  ? formatDuration(previous.at, event.at)
                  : "-"
                const showDuration = sincePrevious !== "-"

                return (
                  <li
                    key={`${event.at}-${index}`}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p>
                        <span className="font-medium">
                          {getActionLabel(event.action)}
                        </span>{" "}
                        {userIdToName.get(event.byUserId) ?? event.byUserId}
                      </p>
                      {showDuration ? (
                        <span className="text-xs text-muted-foreground">
                          {sincePrevious}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                      <Badge variant="secondary">
                        {formatStatusLabel(event.fromStatus)}
                      </Badge>
                      <IconArrowRight size={14} />
                      <Badge variant="secondary">
                        {formatStatusLabel(event.toStatus)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(event.at).toLocaleString()}
                    </p>
                    {event.remarks ? (
                      <p className="text-muted-foreground">
                        Remarks: {event.remarks}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
