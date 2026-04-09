import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import capabilitiesData from "@/features/capabilities/data/capabilities.json"
import type { AuthorityApproval, Capability } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Master List",
}

export default async function CapabilitiesMasterListPage() {
  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={capabilitiesData as Capability[]}
      showHeader={false}
      showSearch={false}
      showApprovalsCards={false}
    />
  )
}
