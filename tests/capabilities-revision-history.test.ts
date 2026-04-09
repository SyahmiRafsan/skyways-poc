import test from "node:test"
import assert from "node:assert/strict"

import {
  createDraftCapability,
  transitionCapabilityToSubmitted,
} from "@/features/capabilities/server"
import { seedBaselineRevisionSnapshots } from "@/features/capabilities/revision-history"
import type { Capability } from "@/features/capabilities/types"

function buildDraft(overrides?: Partial<Capability>): Capability {
  const base = createDraftCapability({
    id: "cap-1",
    submittedByUserId: "U001",
    referenceNo: "CA/2026/1001",
    aircraft: "Aircraft",
    aircraftModels: ["A320"],
    manufacturer: "SAFRAN",
    rating: "C14",
    ataChapter: 32,
    partDesignationDesc: "NOSE LANDING GEAR ACTUATOR",
    category: "LANDING GEAR",
    partNumberSeries: "D51791",
    partNumberModelNos: ["D51791-C", "D51791-40"],
    locations: {
      dkSgd: false,
      dkBll: false,
      myKul: true,
    },
    maintenanceReferences: ["CMM 32-45-16"],
    equipmentTools: ["Propeller fixture set"],
  })

  return {
    ...base,
    ...overrides,
  }
}

test("create draft capability initializes revisionHistory as empty", () => {
  const capability = buildDraft()
  assert.deepEqual(capability.revisionHistory, [])
})

test("first submit does not append revision snapshot", () => {
  const current = buildDraft()
  const next = transitionCapabilityToSubmitted({
    capability: current,
    capabilities: [current],
    byUserId: "U001",
    now: new Date("2026-04-09T00:00:00.000Z"),
  })

  assert.equal(next.status, "TSM_REVIEW")
  assert.equal(next.revision, 0)
  assert.equal(next.referenceNo, current.referenceNo)
  assert.equal(next.revisionHistory.length, 0)
  assert.equal(next.reviewTrail.at(-1)?.action, "SUBMIT")
})

test("resubmit increments revision and appends exactly one revision snapshot", () => {
  const current = buildDraft({
    status: "USER_EDIT_REQUIRED",
    currentReviewerRole: null,
  })
  const capabilities = [
    current,
    buildDraft({ id: "cap-2", referenceNo: "CA/2026/1005" }),
  ]

  const next = transitionCapabilityToSubmitted({
    capability: current,
    capabilities,
    byUserId: "U001",
    now: new Date("2026-04-09T00:00:00.000Z"),
  })

  assert.equal(next.status, "TSM_REVIEW")
  assert.equal(next.revision, 1)
  assert.equal(next.referenceNo, "CA/2026/1006")
  assert.equal(next.revisionHistory.length, 1)
  assert.equal(next.reviewTrail.at(-1)?.action, "RESUBMIT")

  const snapshot = next.revisionHistory[0]
  assert.equal(snapshot.revision, 1)
  assert.equal(snapshot.trigger, "RESUBMIT")
  assert.equal(snapshot.referenceNo, "CA/2026/1006")
  assert.equal(snapshot.capturedByUserId, "U001")

  assert.deepEqual(snapshot.payload, {
    aircraft: next.aircraft,
    aircraftModels: next.aircraftModels,
    manufacturer: next.manufacturer,
    rating: next.rating,
    ataChapter: next.ataChapter,
    partDesignationDesc: next.partDesignationDesc,
    category: next.category,
    partNumberSeries: next.partNumberSeries,
    partNumberModelNos: next.partNumberModelNos,
    locations: next.locations,
    maintenanceReferences: next.maintenanceReferences,
    equipmentTools: next.equipmentTools,
  })
})

test("baseline migration adds one snapshot when none exists and is idempotent", () => {
  const capturedAt = "2026-04-09T12:00:00.000Z"
  const legacyCapability = {
    ...buildDraft({ id: "legacy-1", revision: 2 }),
    revisionHistory: undefined,
  } as unknown as Capability

  const first = seedBaselineRevisionSnapshots([legacyCapability], {
    capturedAt,
  })
  assert.equal(first.changed, true)
  assert.equal(first.capabilities[0].revisionHistory.length, 1)
  assert.equal(
    first.capabilities[0].revisionHistory[0]?.trigger,
    "MIGRATION_BASELINE"
  )
  assert.equal(first.capabilities[0].revisionHistory[0]?.capturedAt, capturedAt)

  const second = seedBaselineRevisionSnapshots(first.capabilities, {
    capturedAt,
  })
  assert.equal(second.changed, false)
  assert.equal(second.capabilities[0].revisionHistory.length, 1)
})
