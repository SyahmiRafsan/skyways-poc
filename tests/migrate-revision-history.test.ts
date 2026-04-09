import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"

import { migrateRevisionHistory } from "@/scripts/migrate-revision-history"
import { createDraftCapability } from "@/features/capabilities/server"
import type { Capability } from "@/features/capabilities/types"

test("migration script seeds baseline once and stays idempotent", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "skyways-revision-history-"))
  const filePath = path.join(dir, "capabilities.json")

  const seed = [
    {
      ...createDraftCapability({
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
        partNumberModelNos: ["D51791-C"],
        locations: { dkSgd: false, dkBll: false, myKul: true },
        maintenanceReferences: ["CMM 32-45-16"],
        equipmentTools: ["Propeller fixture set"],
      }),
      revisionHistory: undefined,
    } as unknown as Capability,
  ]

  await writeFile(filePath, `${JSON.stringify(seed, null, 2)}\n`, "utf8")

  const first = await migrateRevisionHistory({
    filePath,
    capturedAt: "2026-04-09T12:00:00.000Z",
  })
  assert.equal(first.changed, true)

  const firstRead = JSON.parse(await readFile(filePath, "utf8")) as Capability[]
  assert.equal(firstRead[0].revisionHistory.length, 1)
  assert.equal(firstRead[0].revisionHistory[0]?.trigger, "MIGRATION_BASELINE")

  const second = await migrateRevisionHistory({
    filePath,
    capturedAt: "2026-04-09T12:00:00.000Z",
  })
  assert.equal(second.changed, false)

  const secondRead = JSON.parse(await readFile(filePath, "utf8")) as Capability[]
  assert.equal(secondRead[0].revisionHistory.length, 1)

  await rm(dir, { recursive: true, force: true })
})
