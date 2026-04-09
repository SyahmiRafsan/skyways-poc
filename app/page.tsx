import type { Metadata } from "next"

import { CapabilityDashboard } from "@/features/capabilities/components/capability-dashboard"
import approvalsData from "@/features/capabilities/data/authorities-lvl.json"
import { readCapabilities } from "@/features/capabilities/server"
import type { AuthorityApproval, Capability } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Home | SkyCaplist",
}

export default async function Page() {
  const capabilities = await readCapabilities()
  const approvedCapabilities = (capabilities as Capability[]).filter(
    (capability) => capability.status === "AUTHORITY_APPROVED"
  )

  return (
    <CapabilityDashboard
      approvals={approvalsData as AuthorityApproval[]}
      capabilities={approvedCapabilities}
    />
  )
}
