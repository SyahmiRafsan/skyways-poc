import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import { getSessionFromCookieStore } from "@/features/auth/session"
import {
  getPendingApprovalsForRole,
  isCapabilityPendingApproval,
  readCapabilities,
} from "@/features/capabilities/server"
import type { AuthorityApproval } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Approvals",
}

export default async function ApprovalsPage() {
  const session = await getSessionFromCookieStore()
  const capabilities = await readCapabilities()
  const allPendingApprovals = capabilities.filter(isCapabilityPendingApproval)
  const myPendingApprovals = session
    ? getPendingApprovalsForRole(capabilities, session.role)
    : []
  const isUserRole = session?.role === "user"
  const userDraftCapabilities = isUserRole
    ? capabilities.filter(
        (capability) =>
          capability.status === "DRAFT" &&
          capability.submittedByUserId === session.id
      )
    : undefined
  const userRejectedCapabilities = isUserRole
    ? capabilities.filter(
        (capability) =>
          capability.status === "USER_EDIT_REQUIRED" &&
          capability.submittedByUserId === session.id
      )
    : undefined

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={myPendingApprovals}
      secondaryCapabilities={allPendingApprovals}
      draftCapabilities={userDraftCapabilities}
      rejectedCapabilities={userRejectedCapabilities}
      title="Approvals"
      countLabel="Pending Approvals"
      showDataViewToggle
      primaryLabel="My approvals"
      secondaryLabel="Pending"
      draftsLabel="Drafts"
      rejectedLabel="Rejected"
      defaultDataView="primary"
      showApprovalsCards={false}
    />
  )
}
