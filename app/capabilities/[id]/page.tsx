import type { Metadata } from "next"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  approveCapabilityAction,
  rejectCapabilityAction,
  submitCapabilityAction,
  updateCapabilityAction,
} from "@/features/capabilities/actions"
import { CapabilityForm } from "@/features/capabilities/components/capability-form"
import { CapabilityView } from "@/features/capabilities/components/capability-view"
import { ReviewPanel } from "@/features/capabilities/components/review-panel"
import {
  canReviewerAct,
  canUserEditCapability,
  findCapabilityById,
  toMultilineText,
} from "@/features/capabilities/server"
import { getSessionFromCookieStore } from "@/features/auth/session"

export const metadata: Metadata = {
  title: "Capability",
}

type PageProps = {
  params: Promise<{ id: string }>
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
            <CardTitle>Capability not found</CardTitle>
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
    aircraftModel: capability.aircraftModel,
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
  const canReview = canReviewerAct(capability, session.role)

  const boundUpdateAction = updateCapabilityAction.bind(null, capability.id)
  const boundSubmitAction = submitCapabilityAction.bind(null, capability.id)
  const boundApproveAction = approveCapabilityAction.bind(null, capability.id)
  const boundRejectAction = rejectCapabilityAction.bind(null, capability.id)

  return (
    <main className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Capability #{capability.referenceNo}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm md:grid-cols-4">
          <p>
            <span className="font-medium">Status:</span> {capability.status}
          </p>
          <p>
            <span className="font-medium">Revision:</span> R{capability.revision}
          </p>
          <p>
            <span className="font-medium">Current Reviewer:</span>{" "}
            {capability.currentReviewerRole ?? "-"}
          </p>
          <p>
            <span className="font-medium">Submitted By:</span>{" "}
            {capability.submittedByUserId}
          </p>
        </CardContent>
      </Card>

      {canEdit ? (
        <CapabilityForm
          title="Edit Capability"
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
          approveAction={boundApproveAction}
          rejectAction={boundRejectAction}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          {capability.reviewTrail.length === 0 ? (
            <p className="text-sm text-muted-foreground">No review events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {capability.reviewTrail.map((event, index) => (
                <li
                  key={`${event.at}-${index}`}
                  className="rounded-md border border-border p-3"
                >
                  <p>
                    <span className="font-medium">{event.action}</span> by{" "}
                    {event.byRole} ({event.byUserId})
                  </p>
                  <p className="text-muted-foreground">
                    {event.fromStatus} to {event.toStatus} at{" "}
                    {new Date(event.at).toLocaleString()}
                  </p>
                  {event.remarks ? (
                    <p className="text-muted-foreground">
                      Remarks: {event.remarks}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
