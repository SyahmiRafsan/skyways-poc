import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import capabilitiesData from "@/features/capabilities/data/capabilities.json"
import type {
  AuthorityApproval,
  Capability,
} from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Approvals",
}

const PENDING_APPROVAL_STATUSES = new Set<Capability["status"]>([
  "TSM_REVIEW",
  "QAM_REVIEW",
  "WM_REVIEW",
  "READY_FOR_SUBMISSION",
  "SUBMITTED_TO_AUTHORITY",
  "AUTHORITY_REJECTED",
])

export default async function ApprovalsPage() {
  const pendingForms = (capabilitiesData as Capability[]).filter((capability) =>
    PENDING_APPROVAL_STATUSES.has(capability.status)
  )

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={pendingForms}
      title="Approvals"
      countLabel="Pending Approvals"
    />
  )
}
