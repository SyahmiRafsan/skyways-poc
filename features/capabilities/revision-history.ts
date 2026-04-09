import type {
  Capability,
  CapabilityRevisionSnapshot,
} from "@/features/capabilities/types"
import {
  appendRevisionSnapshot,
  normalizeCapability,
  toRevisionSnapshot,
} from "@/features/capabilities/server"

export function seedBaselineRevisionSnapshots(
  capabilities: Capability[],
  input?: { capturedAt?: string }
): { capabilities: Capability[]; changed: boolean } {
  const capturedAt = input?.capturedAt ?? new Date().toISOString()
  let changed = false

  const next = capabilities.map((rawCapability) => {
    const capability = normalizeCapability(rawCapability)
    if (capability.revisionHistory.length > 0) {
      return capability
    }

    changed = true
    const baseline: CapabilityRevisionSnapshot = toRevisionSnapshot(capability, {
      capturedByUserId: capability.submittedByUserId,
      trigger: "MIGRATION_BASELINE",
      capturedAt,
    })

    return appendRevisionSnapshot(capability, baseline)
  })

  return { capabilities: next, changed }
}
