"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionFromCookieStore } from "@/features/auth/session"
import {
  appendReviewEvent,
  canQamAuthorityAct,
  canReviewerAct,
  canUserEditCapability,
  createDraftCapability,
  extractFormValues,
  nextStatusForReviewer,
  readCapabilities,
  transitionCapabilityToSubmitted,
  validateCapabilityFormValues,
  writeCapabilities,
} from "@/features/capabilities/server"
import type {
  Capability,
  CapabilityActionState,
} from "@/features/capabilities/types"

function revalidateCapabilityRoutes(id?: string) {
  revalidatePath("/")
  revalidatePath("/capabilities/new")
  if (id) {
    revalidatePath(`/capabilities/${id}`)
  }
}

function validateStoredCapability(capability: Capability): string | null {
  if (!capability.referenceNo.trim()) return "Reference number is required"
  if (!capability.aircraft) return "Aircraft/Engine is required"
  if (capability.aircraft !== "Aircraft" && capability.aircraft !== "Engine") {
    return "Aircraft must be either Aircraft or Engine"
  }
  if (capability.aircraftModels.length === 0) return "Aircraft model is required"
  if (!capability.manufacturer.trim()) return "Manufacturer is required"
  if (!capability.rating.trim()) return "Rating is required"
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
    return { ok: false, error: "Only user role can register PN Form" }
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
    ...createDraftCapability({
      id: randomUUID(),
      submittedByUserId: session.id,
      ...validated.value,
    }),
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
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canUserEditCapability(current, session.id, session.role)) {
    return { ok: false, error: "You cannot update this PN Form" }
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
    referenceNo: nextReferenceNo,
    aircraft: validated.value.aircraft,
    aircraftModels: validated.value.aircraftModels,
    manufacturer: validated.value.manufacturer,
    rating: validated.value.rating,
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
    return { ok: false, error: "Only user role can submit PN Form" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canUserEditCapability(current, session.id, session.role)) {
    return { ok: false, error: "You cannot submit this PN Form" }
  }

  const validationError = validateStoredCapability(current)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const next = transitionCapabilityToSubmitted({
    capability: current,
    capabilities,
    byUserId: session.id,
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
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canReviewerAct(current, session.role)) {
    return { ok: false, error: "You cannot approve this PN Form" }
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
          : toStatus === "READY_FOR_SUBMISSION"
            ? "qam"
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

export async function markSubmittedToAuthorityAction(
  id: string,
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  void formData

  const session = await getSessionFromCookieStore()
  if (!session) {
    return { ok: false, error: "Unauthorized" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canQamAuthorityAct(current, session.role)) {
    return { ok: false, error: "You cannot mark this PN Form as submitted to authority" }
  }

  if (current.status !== "READY_FOR_SUBMISSION") {
    return { ok: false, error: "PN Form is not ready for submission" }
  }

  let next: Capability = {
    ...current,
    status: "SUBMITTED_TO_AUTHORITY",
    currentReviewerRole: "qam",
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: "MARK_SUBMITTED_TO_AUTHORITY",
    fromStatus: current.status,
    toStatus: "SUBMITTED_TO_AUTHORITY",
  })

  capabilities[index] = next
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  redirect(`/capabilities/${id}`)
}

export async function markAuthorityApprovedAction(
  id: string,
  _previousState: CapabilityActionState,
  formData: FormData
): Promise<CapabilityActionState> {
  void formData

  const session = await getSessionFromCookieStore()
  if (!session) {
    return { ok: false, error: "Unauthorized" }
  }

  const capabilities = await readCapabilities()
  const index = capabilities.findIndex((item) => item.id === id)
  if (index === -1) {
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canQamAuthorityAct(current, session.role)) {
    return { ok: false, error: "You cannot mark this PN Form as authority approved" }
  }

  if (current.status !== "SUBMITTED_TO_AUTHORITY") {
    return { ok: false, error: "PN Form must be submitted to authority first" }
  }

  let next: Capability = {
    ...current,
    status: "AUTHORITY_APPROVED",
    currentReviewerRole: null,
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: "MARK_AUTHORITY_APPROVED",
    fromStatus: current.status,
    toStatus: "AUTHORITY_APPROVED",
  })

  capabilities[index] = next
  await writeCapabilities(capabilities)
  revalidateCapabilityRoutes(id)
  redirect(`/capabilities/${id}`)
}

export async function markAuthorityRejectedAction(
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
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canQamAuthorityAct(current, session.role)) {
    return { ok: false, error: "You cannot mark this PN Form as authority rejected" }
  }

  if (current.status !== "SUBMITTED_TO_AUTHORITY") {
    return { ok: false, error: "PN Form must be submitted to authority first" }
  }

  const remarks = String(formData.get("remarks") ?? "").trim()
  if (!remarks) {
    return { ok: false, error: "Remarks are required for authority reject" }
  }

  let next = appendReviewEvent(current, {
    byUserId: session.id,
    byRole: session.role,
    action: "MARK_AUTHORITY_REJECTED",
    fromStatus: current.status,
    toStatus: "AUTHORITY_REJECTED",
    remarks,
  })

  next = {
    ...next,
    status: "USER_EDIT_REQUIRED",
    currentReviewerRole: null,
  }

  next = appendReviewEvent(next, {
    byUserId: session.id,
    byRole: session.role,
    action: "REJECT",
    fromStatus: "AUTHORITY_REJECTED",
    toStatus: "USER_EDIT_REQUIRED",
    remarks,
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
    return { ok: false, error: "PN Form not found" }
  }

  const current = capabilities[index]
  if (!canReviewerAct(current, session.role)) {
    return { ok: false, error: "You cannot reject this PN Form" }
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
