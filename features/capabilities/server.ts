import { readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  CAPABILITY_DATA_FILE,
  NEXT_STATUS_BY_REVIEW_ROLE,
  QAM_AUTHORITY_ACTION_STATUSES,
  REVIEW_STATUS_BY_ROLE,
} from "@/features/capabilities/constants"
import type { Role } from "@/features/auth/types"
import type {
  CapabilityAircraftType,
  Capability,
  CapabilityAction,
  CapabilityFormValues,
  CapabilityLocations,
  CapabilityRevisionSnapshot,
  CapabilityRevisionSnapshotPayload,
  CapabilityRevisionSnapshotTrigger,
  CapabilityReviewEvent,
  CapabilityStatus,
  ReviewerRole,
} from "@/features/capabilities/types"

const CAPABILITY_FILE_PATH = path.join(process.cwd(), CAPABILITY_DATA_FILE)
const PENDING_APPROVAL_STATUSES = new Set<CapabilityStatus>([
  "TSM_REVIEW",
  "QAM_REVIEW",
  "WM_REVIEW",
  "READY_FOR_SUBMISSION",
  "SUBMITTED_TO_AUTHORITY",
  "AUTHORITY_REJECTED",
])

type ValidationResult =
  | {
      ok: true
      value: {
        referenceNo: string
        aircraft: CapabilityAircraftType
        aircraftModels: string[]
        manufacturer: string
        rating: string
        ataChapter: number
        partDesignationDesc: string
        category: string
        partNumberSeries: string
        partNumberModelNos: string[]
        locations: CapabilityLocations
        maintenanceReferences: string[]
        equipmentTools: string[]
      }
    }
  | { ok: false; error: string }

type CapabilityCoreFields = {
  referenceNo: string
  aircraft: CapabilityAircraftType
  aircraftModels: string[]
  manufacturer: string
  rating: string
  ataChapter: number
  partDesignationDesc: string
  category: string
  partNumberSeries: string
  partNumberModelNos: string[]
  locations: CapabilityLocations
  maintenanceReferences: string[]
  equipmentTools: string[]
}

export function splitMultilineLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function extractFormValues(formData: FormData): CapabilityFormValues {
  return {
    referenceNo: String(formData.get("referenceNo") ?? "").trim(),
    aircraft: String(formData.get("aircraft") ?? "").trim(),
    aircraftModels: String(formData.get("aircraftModels") ?? "").trim(),
    manufacturer: String(formData.get("manufacturer") ?? "").trim(),
    rating: String(formData.get("rating") ?? "").trim(),
    ataChapter: String(formData.get("ataChapter") ?? "").trim(),
    partDesignationDesc: String(formData.get("partDesignationDesc") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    partNumberSeries: String(formData.get("partNumberSeries") ?? "").trim(),
    partNumberModelNos: String(formData.get("partNumberModelNos") ?? "").trim(),
    locationDkSgd: formData.get("locationDkSgd") === "on",
    locationDkBll: formData.get("locationDkBll") === "on",
    locationMyKul: formData.get("locationMyKul") === "on",
    maintenanceReferences: String(formData.get("maintenanceReferences") ?? "").trim(),
    equipmentTools: String(formData.get("equipmentTools") ?? "").trim(),
  }
}

export function validateCapabilityFormValues(values: CapabilityFormValues): ValidationResult {
  if (!values.referenceNo) {
    return { ok: false, error: "Reference number is required" }
  }

  if (!values.aircraft) {
    return { ok: false, error: "Aircraft/Engine is required" }
  }

  if (values.aircraft !== "Aircraft" && values.aircraft !== "Engine") {
    return { ok: false, error: "Aircraft must be either Aircraft or Engine" }
  }

  const aircraftModels = splitMultilineLines(values.aircraftModels)
  if (aircraftModels.length === 0) {
    return { ok: false, error: "Aircraft model is required" }
  }

  if (!values.manufacturer) {
    return { ok: false, error: "Manufacturer is required" }
  }

  if (!values.rating) {
    return { ok: false, error: "Rating is required" }
  }

  const ataChapter = Number(values.ataChapter)
  if (!Number.isInteger(ataChapter) || ataChapter < 1 || ataChapter > 100) {
    return { ok: false, error: "ATA chapter must be an integer between 1 and 100" }
  }

  if (!values.partDesignationDesc) {
    return { ok: false, error: "Part designation/description is required" }
  }

  if (!values.category) {
    return { ok: false, error: "Category is required" }
  }

  if (!values.partNumberSeries) {
    return { ok: false, error: "Part number series is required" }
  }

  const partNumberModelNos = splitMultilineLines(values.partNumberModelNos)
  if (partNumberModelNos.length === 0) {
    return { ok: false, error: "Part number / model no is required" }
  }

  const locations: CapabilityLocations = {
    dkSgd: values.locationDkSgd,
    dkBll: values.locationDkBll,
    myKul: values.locationMyKul,
  }

  if (!locations.dkSgd && !locations.dkBll && !locations.myKul) {
    return { ok: false, error: "Select at least one location" }
  }

  const maintenanceReferences = splitMultilineLines(values.maintenanceReferences)
  if (maintenanceReferences.length === 0) {
    return { ok: false, error: "Maintenance reference is required" }
  }

  const equipmentTools = splitMultilineLines(values.equipmentTools)
  if (equipmentTools.length === 0) {
    return { ok: false, error: "Equipment/tools is required" }
  }

  return {
    ok: true,
    value: {
      referenceNo: values.referenceNo,
      aircraft: values.aircraft,
      aircraftModels,
      manufacturer: values.manufacturer,
      rating: values.rating,
      ataChapter,
      partDesignationDesc: values.partDesignationDesc,
      category: values.category,
      partNumberSeries: values.partNumberSeries,
      partNumberModelNos,
      locations,
      maintenanceReferences,
      equipmentTools,
    },
  }
}

export async function readCapabilities(): Promise<Capability[]> {
  const raw = await readFile(CAPABILITY_FILE_PATH, "utf8")
  const parsed = JSON.parse(raw) as Capability[]
  return parsed.map(normalizeCapability)
}

export async function writeCapabilities(capabilities: Capability[]): Promise<void> {
  const tempPath = `${CAPABILITY_FILE_PATH}.tmp`
  const payload = `${JSON.stringify(capabilities, null, 2)}\n`

  await writeFile(tempPath, payload, "utf8")
  await rename(tempPath, CAPABILITY_FILE_PATH)
}

export async function findCapabilityById(id: string): Promise<Capability | null> {
  const capabilities = await readCapabilities()
  return capabilities.find((capability) => capability.id === id) ?? null
}

export function normalizeCapability(capability: Capability): Capability {
  return {
    ...capability,
    revisionHistory: Array.isArray(capability.revisionHistory)
      ? capability.revisionHistory
      : [],
  }
}

export function toRevisionSnapshotPayload(
  capability: Capability | CapabilityCoreFields
): CapabilityRevisionSnapshotPayload {
  return {
    aircraft: capability.aircraft,
    aircraftModels: [...capability.aircraftModels],
    manufacturer: capability.manufacturer,
    rating: capability.rating,
    ataChapter: capability.ataChapter,
    partDesignationDesc: capability.partDesignationDesc,
    category: capability.category,
    partNumberSeries: capability.partNumberSeries,
    partNumberModelNos: [...capability.partNumberModelNos],
    locations: { ...capability.locations },
    maintenanceReferences: [...capability.maintenanceReferences],
    equipmentTools: [...capability.equipmentTools],
  }
}

export function toRevisionSnapshot(
  capability: Capability,
  input: {
    capturedByUserId: string
    trigger: CapabilityRevisionSnapshotTrigger
    capturedAt?: string
  }
): CapabilityRevisionSnapshot {
  return {
    revision: capability.revision,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    capturedByUserId: input.capturedByUserId,
    trigger: input.trigger,
    referenceNo: capability.referenceNo,
    payload: toRevisionSnapshotPayload(capability),
  }
}

export function appendRevisionSnapshot(
  capability: Capability,
  snapshot: CapabilityRevisionSnapshot
): Capability {
  return {
    ...capability,
    revisionHistory: [...capability.revisionHistory, snapshot],
  }
}

export function createDraftCapability(
  input: CapabilityCoreFields & {
    id: string
    submittedByUserId: string
  }
): Capability {
  return {
    id: input.id,
    referenceNo: input.referenceNo,
    aircraft: input.aircraft,
    aircraftModels: input.aircraftModels,
    manufacturer: input.manufacturer,
    rating: input.rating,
    ataChapter: input.ataChapter,
    partDesignationDesc: input.partDesignationDesc,
    category: input.category,
    partNumberSeries: input.partNumberSeries,
    partNumberModelNos: input.partNumberModelNos,
    locations: input.locations,
    maintenanceReferences: input.maintenanceReferences,
    equipmentTools: input.equipmentTools,
    status: "DRAFT",
    submittedByUserId: input.submittedByUserId,
    revision: 0,
    reviewTrail: [],
    revisionHistory: [],
    currentReviewerRole: null,
  }
}

export function statusForReviewer(role: ReviewerRole): CapabilityStatus {
  return REVIEW_STATUS_BY_ROLE[role]
}

export function nextStatusForReviewer(role: ReviewerRole): CapabilityStatus {
  return NEXT_STATUS_BY_REVIEW_ROLE[role]
}

export function canUserEditCapability(capability: Capability, userId: string, role: Role): boolean {
  if (role !== "user") {
    return false
  }

  if (capability.submittedByUserId !== userId) {
    return false
  }

  return capability.status === "DRAFT" || capability.status === "USER_EDIT_REQUIRED"
}

export function canReviewerAct(capability: Capability, role: Role): role is ReviewerRole {
  if (role !== "tsm" && role !== "qam" && role !== "wm") {
    return false
  }

  return (
    capability.currentReviewerRole === role &&
    capability.status === REVIEW_STATUS_BY_ROLE[role]
  )
}

export function canQamAuthorityAct(capability: Capability, role: Role): boolean {
  if (role !== "qam") {
    return false
  }

  if (capability.currentReviewerRole !== "qam") {
    return false
  }

  return QAM_AUTHORITY_ACTION_STATUSES.includes(capability.status)
}

export function isCapabilityPendingApproval(capability: Capability): boolean {
  return PENDING_APPROVAL_STATUSES.has(capability.status)
}

export function canRoleApproveCapability(capability: Capability, role: Role): boolean {
  if (!isCapabilityPendingApproval(capability)) {
    return false
  }

  if (role === "user") {
    return false
  }

  return canReviewerAct(capability, role) || canQamAuthorityAct(capability, role)
}

export function getPendingApprovalsForRole(
  capabilities: Capability[],
  role: Role
): Capability[] {
  return capabilities.filter((capability) => canRoleApproveCapability(capability, role))
}

export function generateReferenceNo(capabilities: Capability[], now: Date = new Date()): string {
  const year = now.getFullYear()
  const prefix = `CA/${year}/`

  const maxSeq = capabilities.reduce((currentMax, capability) => {
    if (!capability.referenceNo.startsWith(prefix)) {
      return currentMax
    }

    const rawSeq = capability.referenceNo.slice(prefix.length)
    const seq = Number(rawSeq)
    if (!Number.isInteger(seq)) {
      return currentMax
    }

    return Math.max(currentMax, seq)
  }, 999)

  return `${prefix}${maxSeq + 1}`
}

export function appendReviewEvent(
  capability: Capability,
  input: {
    byUserId: string
    byRole: Role
    action: CapabilityAction
    fromStatus: CapabilityStatus
    toStatus: CapabilityStatus
    remarks?: string
  }
): Capability {
  const event: CapabilityReviewEvent = {
    at: new Date().toISOString(),
    byUserId: input.byUserId,
    byRole: input.byRole,
    action: input.action,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    ...(input.remarks ? { remarks: input.remarks } : {}),
  }

  return {
    ...capability,
    reviewTrail: [...capability.reviewTrail, event],
  }
}

export function transitionCapabilityToSubmitted(
  input: {
    capability: Capability
    capabilities: Capability[]
    byUserId: string
    now?: Date
  }
): Capability {
  const fromStatus = input.capability.status
  const isResubmit = fromStatus === "USER_EDIT_REQUIRED"
  const nextReferenceNo = isResubmit
    ? generateReferenceNo(input.capabilities, input.now)
    : input.capability.referenceNo

  let next: Capability = {
    ...input.capability,
    referenceNo: nextReferenceNo,
    status: "TSM_REVIEW",
    currentReviewerRole: "tsm",
    revision: isResubmit ? input.capability.revision + 1 : input.capability.revision,
  }

  if (isResubmit) {
    next = appendRevisionSnapshot(
      next,
      toRevisionSnapshot(next, {
        capturedByUserId: input.byUserId,
        trigger: "RESUBMIT",
      })
    )
  }

  return appendReviewEvent(next, {
    byUserId: input.byUserId,
    byRole: "user",
    action: isResubmit ? "RESUBMIT" : "SUBMIT",
    fromStatus,
    toStatus: "TSM_REVIEW",
  })
}

export function toMultilineText(lines: string[]): string {
  return lines.join("\n")
}
