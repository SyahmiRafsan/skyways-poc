import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import capabilitiesData from "@/features/capabilities/data/capabilities.json"
import type { AuthorityApproval, Capability } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Home | SkyCaplist",
}

export default async function Page() {
  const approvedCapabilities = (capabilitiesData as Capability[]).filter(
    (capability) => capability.status === "APPROVED"
  )

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={approvedCapabilities}
    />
  )
}
