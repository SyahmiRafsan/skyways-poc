"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionFromCookieStore } from "@/features/auth/session"
import {
  appendReviewEvent,
  canReviewerAct,
  canUserEditCapability,
  extractFormValues,
  generateReferenceNo,
  nextStatusForReviewer,
  readCapabilities,
  validateCapabilityFormValues,
  writeCapabilities,
} from "@/features/capabilities/server"
import type {
  Capability,
  CapabilityActionState,
} from "@/features/capabilities/types"

function toLegacyFields(input: {
  aircraft: string
  ataChapter: number
  partDesignationDesc: string
  partNumberSeries: string
  partNumberModelNos: string[]
  maintenanceReferences: string[]
  locations: Capability["locations"]
  category: string
  rating: string
  manufacturer: string
  pn: string
}) {
  return {
    rating: input.rating,
    ata: String(input.ataChapter),
    designation: input.partDesignationDesc,
    manufacturer: input.manufacturer,
    aircraftModel: input.aircraft,
    pnSeries: input.partNumberSeries,
    pn: input.partNumberModelNos[0] ?? input.pn,
    maintenanceReference: input.maintenanceReferences.join(" | "),
    dkSgd: input.locations.dkSgd,
    dkBll: input.locations.dkBll,
    myKul: input.locations.myKul,
    category: input.category,
  }
}

function revalidateCapabilityRoutes(id?: string) {
  revalidatePath("/")
  revalidatePath("/capabilities/new")
  if (id) {
    revalidatePath(`/capabilities/${id}`)
  }
}

function validateStoredCapability(capability: Capability): string | null {
  if (!capability.referenceNo.trim()) return "Reference number is required"
  if (!capability.aircraft.trim()) return "Aircraft is required"
  if (!Number.isInteger(capability.ataChapter) || capability.ataChapter < 1 || capability.ataChapter > 100) {
    return "ATA chapter must be an integer between 1 and 100"
  }
  if (!capability.partDesignationDesc.trim()) return "Part designation/description is required"
  if (!capability.category.trim()) return "Category is required"
  if (!capability.partNumberSeries.trim()) return "Part number series is required"
  if (capability.partNumberModelNos.length === 0) return "Part number / model no is required"

  const hasLocation = capability.locations.dkSgd || capability.locations.dkBll || capability.locations.myKul
  if (!hasLocation) return "Select at least one location"

  if (capability.maintenanceReferences.length === 0) return "Maintenance reference is required"
  if (capability.equipmentTools.length === 0) return "Equipment/tools is required"

  return null
}

export async function createCapabilityAction(
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  const session = await getSessionFromCookieStore()
  if (!session || session.role !== "user") {
    return { ok: false, error: "Only user role can create capability" }
  }

  const formValues = extractFormValues(formData)
  const validated = validateCapabilityFormValues(formValues)
  if (!validated.ok) {
    return { ok: false, error: validated.error }
  }

  const capabilities = await readCapabilities()
  const duplicatedRef = capabilities.some(
    (item) => item.referenceNo === validated.value.referenceNo
  )
  if (duplicatedRef) {
    return { ok: false, error: "Reference number already exists" }
  }

  const created: Capability = {
    id: randomUUID(),
    ...toLegacyFields({
      aircraft: validated.value.aircraft,
      ataChapter: validated.value.ataChapter,
      partDesignationDesc: validated.value.partDesignationDesc,
      partNumberSeries: validated.value.partNumberSeries,
      partNumberModelNos: validated.value.partNumberModelNos,
      maintenanceReferences: validated.value.maintenanceReferences,
      locations: validated.value.locations,
      category: validated.value.category,
      rating: "N/A",
      manufacturer: "N/A",
      pn: "N/A",
    }),
    referenceNo: validated.value.referenceNo,
    aircraft: validated.value.aircraft,
    ataChapter: validated.value.ataChapter,
    partDesignationDesc: validated.value.partDesignationDesc,
    category: validated.value.category,
    partNumberSeries: validated.value.partNumberSeries,
    partNumberModelNos: validated.value.partNumberModelNos,
    locations: validated.value.locations,
    maintenanceReferences: validated.value.maintenanceReferences,
    equipmentTools: validated.value.equipmentTools,
    status: "DRAFT",
    submittedByUserId: session.id,
    revision: 0,
    reviewTrail: [],
    currentReviewerRole: null,
  }

  capabilities.push(created)
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(created.id)
  redirect(`/capabilities/${created.id}`)
}

export async function updateCapabilityAction(
  id: string,
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  const session = await getSessionFromCookieStore()
  if (!session) {
    return { ok: false, error: "Unauthorized" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "Capability not found" }
  }

  const current = capabilities[index]
  if (!canUserEditCapability(current, session.id, session.role)) {
    return { ok: false, error: "You cannot edit this capability" }
  }

  const formValues = extractFormValues(formData)
  const validated = validateCapabilityFormValues(formValues)
  if (!validated.ok) {
    return { ok: false, error: validated.error }
  }

  const nextReferenceNo =
    current.status === "DRAFT"
      ? validated.value.referenceNo
      : current.referenceNo

  if (
    current.status === "DRAFT" &&
    nextReferenceNo !== current.referenceNo &&
    capabilities.some(
      (item) => item.id !== current.id && item.referenceNo === nextReferenceNo
    )
  ) {
    return { ok: false, error: "Reference number already exists" }
  }

  capabilities[index] = {
    ...current,
    ...toLegacyFields({
      aircraft: validated.value.aircraft,
      ataChapter: validated.value.ataChapter,
      partDesignationDesc: validated.value.partDesignationDesc,
      partNumberSeries: validated.value.partNumberSeries,
      partNumberModelNos: validated.value.partNumberModelNos,
      maintenanceReferences: validated.value.maintenanceReferences,
      locations: validated.value.locations,
      category: validated.value.category,
      rating: current.rating,
      manufacturer: current.manufacturer,
      pn: current.pn,
    }),
    referenceNo: nextReferenceNo,
    aircraft: validated.value.aircraft,
    ataChapter: validated.value.ataChapter,
    partDesignationDesc: validated.value.partDesignationDesc,
    category: validated.value.category,
    partNumberSeries: validated.value.partNumberSeries,
    partNumberModelNos: validated.value.partNumberModelNos,
    locations: validated.value.locations,
    maintenanceReferences: validated.value.maintenanceReferences,
    equipmentTools: validated.value.equipmentTools,
  }

  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  return { ok: true, error: null }
}

export async function submitCapabilityAction(
  id: string,
  previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  void previousState
  void formData

  const session = await getSessionFromCookieStore()
  if (!session || session.role !== "user") {
    return { ok: false, error: "Only user role can submit capability" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "Capability not found" }
  }

  const current = capabilities[index]
  if (!canUserEditCapability(current, session.id, session.role)) {
    return { ok: false, error: "You cannot submit this capability" }
  }

  const validationError = validateStoredCapability(current)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const fromStatus = current.status
  const isResubmit = fromStatus === "USER_EDIT_REQUIRED"
  const nextReferenceNo = isResubmit
    ? generateReferenceNo(capabilities)
    : current.referenceNo

  let next: Capability = {
    ...current,
    referenceNo: nextReferenceNo,
    ata: String(current.ataChapter),
    designation: current.partDesignationDesc,
    aircraftModel: current.aircraft,
    pnSeries: current.partNumberSeries,
    pn: current.partNumberModelNos[0] ?? current.pn,
    maintenanceReference: current.maintenanceReferences.join(" | "),
    dkSgd: current.locations.dkSgd,
    dkBll: current.locations.dkBll,
    myKul: current.locations.myKul,
    status: "TSM_REVIEW",
    currentReviewerRole: "tsm",
    revision: isResubmit ? current.revision + 1 : current.revision,
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: isResubmit ? "RESUBMIT" : "SUBMIT",
    fromStatus,
    toStatus: "TSM_REVIEW",
  })

  capabilities[index] = next
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  redirect(`/capabilities/${id}`)
}

export async function approveCapabilityAction(
  id: string,
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  const session = await getSessionFromCookieStore()
  if (!session) {
    return { ok: false, error: "Unauthorized" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "Capability not found" }
  }

  const current = capabilities[index]
  if (!canReviewerAct(current, session.role)) {
    return { ok: false, error: "You cannot approve this capability" }
  }

  const reviewerRole = session.role
  const toStatus = nextStatusForReviewer(reviewerRole)
  const remarks = String(formData.get("remarks") ?? "").trim()

  let next: Capability = {
    ...current,
    status: toStatus,
    currentReviewerRole:
      toStatus === "QAM_REVIEW"
        ? "qam"
        : toStatus === "WM_REVIEW"
          ? "wm"
          : null,
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: "APPROVE",
    fromStatus: current.status,
    toStatus,
    ...(remarks ? { remarks } : {}),
  })

  capabilities[index] = next
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  redirect(`/capabilities/${id}`)
}

export async function rejectCapabilityAction(
  id: string,
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  const session = await getSessionFromCookieStore()
  if (!session) {
    return { ok: false, error: "Unauthorized" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "Capability not found" }
  }

  const current = capabilities[index]
  if (!canReviewerAct(current, session.role)) {
    return { ok: false, error: "You cannot reject this capability" }
  }

  const remarks = String(formData.get("remarks") ?? "").trim()
  if (!remarks) {
    return { ok: false, error: "Remarks are required for reject" }
  }

  let next: Capability = {
    ...current,
    status: "USER_EDIT_REQUIRED",
    currentReviewerRole: null,
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: "REJECT",
    fromStatus: current.status,
    toStatus: "USER_EDIT_REQUIRED",
    remarks,
  })

  capabilities[index] = next
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  redirect(`/capabilities/${id}`)
}
