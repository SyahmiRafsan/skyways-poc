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

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={myPendingApprovals}
      secondaryCapabilities={allPendingApprovals}
      title="Approvals"
      countLabel="Pending Approvals"
      showDataViewToggle
      primaryLabel="My approvals"
      secondaryLabel="All pending"
      defaultDataView="primary"
      showApprovalsCards={false}
    />
  )
}
