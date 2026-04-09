import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { CAPABILITY_DATA_FILE } from "@/features/capabilities/constants"
import { seedBaselineRevisionSnapshots } from "@/features/capabilities/revision-history"
import type { Capability } from "@/features/capabilities/types"

export async function migrateRevisionHistory(options?: {
  filePath?: string
  capturedAt?: string
}): Promise<{ changed: boolean; count: number }> {
  const targetPath = options?.filePath
    ? path.resolve(options.filePath)
    : path.join(process.cwd(), CAPABILITY_DATA_FILE)

  const raw = await readFile(targetPath, "utf8")
  const parsed = JSON.parse(raw) as Capability[]
  const result = seedBaselineRevisionSnapshots(parsed, {
    capturedAt: options?.capturedAt,
  })

  if (!result.changed) {
    return { changed: false, count: result.capabilities.length }
  }

  const tmpPath = `${targetPath}.tmp`
  const payload = `${JSON.stringify(result.capabilities, null, 2)}\n`
  await writeFile(tmpPath, payload, "utf8")
  await rename(tmpPath, targetPath)

  return { changed: true, count: result.capabilities.length }
}

async function runCli() {
  const outcome = await migrateRevisionHistory()
  if (outcome.changed) {
    console.log(`Migrated revision history for ${outcome.count} capability records.`)
  } else {
    console.log("No migration needed. Revision history is already seeded.")
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error: unknown) => {
    console.error("Revision history migration failed:", error)
    process.exit(1)
  })
}
