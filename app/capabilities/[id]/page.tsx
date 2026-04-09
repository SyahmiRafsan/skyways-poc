import type { Metadata } from "next"
import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

function formatReviewTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  const parts = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
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
  if (action === "REJECT" || action === "MARK_AUTHORITY_REJECTED") {
    return "Rejected by"
  }
  if (byRole === "user") return "Prepared by"
  if (byRole === "tsm") return "Checked by"
  if (byRole === "qam" || byRole === "wm") return "Approved by"
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

  if (!canEdit) {
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
                      const submitter = userIdToUser.get(
                        capability.submittedByUserId
                      )
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

            <CapabilityView capability={capability} />
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

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Review History</h2>
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
                          <p className="inline-flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs font-medium uppercase">
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
                          {/*{showDuration ? (
                            <span className="text-xs text-muted-foreground">
                              {sincePrevious}
                            </span>
                          ) : null}*/}
                          <p className="text-xs text-muted-foreground">
                            {formatReviewTimestamp(event.at)}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
                          <Badge
                            variant="secondary"
                            className="max-w-34 justify-start lg:max-w-36"
                          >
                            <span
                              className="block w-full truncate text-left"
                              title={formatStatusLabel(event.fromStatus)}
                            >
                              {formatStatusLabel(event.fromStatus)}
                            </span>
                          </Badge>
                          <IconArrowRight size={14} className="shrink-0" />
                          <Badge
                            variant="secondary"
                            className="max-w-34 justify-start lg:max-w-36"
                          >
                            <span
                              className="block w-full truncate text-left"
                              title={formatStatusLabel(event.toStatus)}
                            >
                              {formatStatusLabel(event.toStatus)}
                            </span>
                          </Badge>
                        </div>
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
            </section>
          </div>
        </section>
      </main>
    )
  }

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
                    const reviewer = roleToUser.get(
                      capability.currentReviewerRole
                    )
                    if (!reviewer) return capability.currentReviewerRole
                    return (
                      <UserWithAvatar
                        name={reviewer.name}
                        avatarUrl={reviewer.avatarUrl}
                      />
                    )
                  })()
                : "-"}
            </p>
          ) : null}
          <p>
            <span className="font-medium">Submitted By:</span>{" "}
            {(() => {
              const submitter = userIdToUser.get(capability.submittedByUserId)
              if (!submitter) {
                return capability.submittedByUserId
              }

              return (
                <UserWithAvatar
                  name={submitter.name}
                  avatarUrl={submitter.avatarUrl}
                />
              )
            })()}
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
                      <p className="inline-flex items-center gap-2 whitespace-nowrap">
                        <span className="font-medium">
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
                      {showDuration ? (
                        <span className="text-xs text-muted-foreground">
                          {sincePrevious}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className="max-w-24 justify-start"
                        title={formatStatusLabel(event.fromStatus)}
                      >
                        <span
                          className="block w-full truncate text-left [direction:rtl]"
                          title={formatStatusLabel(event.fromStatus)}
                        >
                          {formatStatusLabel(event.fromStatus)}
                        </span>
                      </Badge>
                      <IconArrowRight size={14} className="shrink-0" />
                      <Badge
                        variant="secondary"
                        className="max-w-24 justify-start"
                        title={formatStatusLabel(event.toStatus)}
                      >
                        <span
                          className="block w-full truncate text-left [direction:rtl]"
                          title={formatStatusLabel(event.toStatus)}
                        >
                          {formatStatusLabel(event.toStatus)}
                        </span>
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {formatReviewTimestamp(event.at)}
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
