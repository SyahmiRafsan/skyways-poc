import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { ReviewHistory } from "@/features/capabilities/components/review-history"
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

function UserWithAvatar({
  name,
  avatarUrl,
  muted = false,
}: {
  name: string
  avatarUrl?: string
  muted?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar className="size-5">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className={muted ? "text-muted-foreground" : undefined}>
        {name}
      </span>
    </span>
  )
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
  const userIdToUser = new Map(
    usersData.map((user) => [user.id, user] as const)
  )
  const roleToUser = new Map(
    usersData.map((user) => [user.role, user] as const)
  )

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
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          <section className="mb-8 space-y-3">
            <h1 className="text-xl font-semibold">
              PN Form #{capability.referenceNo}
            </h1>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-4">
              <p>
                <span className="font-medium">Status</span>
                <span className="mt-1 block">
                  <Badge variant="secondary" className="font-normal">
                    {formatStatusLabel(capability.status)}
                  </Badge>
                </span>
              </p>
              <p>
                <span className="font-medium">Revision</span>
                <span className="mt-1 block text-muted-foreground">
                  R{capability.revision}
                </span>
              </p>
              {capability.status !== "AUTHORITY_APPROVED" ? (
                <p>
                  <span className="font-medium">Current Reviewer</span>
                  <span className="mt-1 block text-muted-foreground">
                    {capability.currentReviewerRole
                      ? (() => {
                          const reviewer = roleToUser.get(
                            capability.currentReviewerRole
                          )
                          if (!reviewer) return capability.currentReviewerRole
                          return (
                            <UserWithAvatar
                              name={reviewer.name}
                              avatarUrl={reviewer.avatarUrl}
                              muted
                            />
                          )
                        })()
                      : "-"}
                  </span>
                </p>
              ) : null}
              <p>
                <span className="font-medium">Submitted By</span>
                <span className="mt-1 block text-muted-foreground">
                  {(() => {
                    const submitter = userIdToUser.get(capability.submittedByUserId)
                    if (!submitter) {
                      return capability.submittedByUserId
                    }

                    return (
                      <UserWithAvatar
                        name={submitter.name}
                        avatarUrl={submitter.avatarUrl}
                        muted
                      />
                    )
                  })()}
                </span>
              </p>
            </div>
          </section>

          <Separator />

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
        </div>

        <div className="space-y-8 lg:col-span-1">
          {canReview ? (
            <ReviewPanel
              mode={reviewPanelMode}
              approveAction={boundApproveAction}
              rejectAction={boundRejectAction}
              markSubmittedAction={boundMarkSubmittedAction}
              markAuthorityApprovedAction={boundMarkAuthorityApprovedAction}
              markAuthorityRejectedAction={boundMarkAuthorityRejectedAction}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No actions available for your role in the current status.
                </p>
              </CardContent>
            </Card>
          )}

          <ReviewHistory
            events={capability.reviewTrail}
            users={usersData}
            variant="sidebar"
          />
        </div>
      </section>
    </main>
  )
}
