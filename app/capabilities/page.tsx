import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import { readCapabilities } from "@/features/capabilities/server"
import type { AuthorityApproval, Capability } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Master List",
}

export default async function CapabilitiesMasterListPage() {
  const capabilities = await readCapabilities()

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={capabilities as Capability[]}
      showHeader={false}
      showSearch={false}
      showApprovalsCards={false}
    />
  )
}
