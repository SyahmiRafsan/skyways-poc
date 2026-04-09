import type { Role } from "@/features/auth/types"

export type AuthorityApproval = {
  authority: string
  issueNo: string
  revisionNo: string
  revisionDate: string
}

export type CapabilityStatus =
  | "DRAFT"
  | "TSM_REVIEW"
  | "QAM_REVIEW"
  | "WM_REVIEW"
  | "APPROVED"
  | "USER_EDIT_REQUIRED"

export type ReviewerRole = "tsm" | "qam" | "wm"

export type ReviewDecision = "APPROVE" | "REJECT"

export type CapabilityAction = "SUBMIT" | "APPROVE" | "REJECT" | "RESUBMIT"

export type CapabilityLocations = {
  dkSgd: boolean
  dkBll: boolean
  myKul: boolean
}

export type CapabilityReviewEvent = {
  at: string
  byUserId: string
  byRole: Role
  action: CapabilityAction
  remarks?: string
  fromStatus: CapabilityStatus
  toStatus: CapabilityStatus
}

export type CapabilityAircraftType = "Aircraft" | "Engine"

export type Capability = {
  id: string
  referenceNo: string
  aircraft: CapabilityAircraftType
  aircraftModel: string
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
  status: CapabilityStatus
  submittedByUserId: string
  revision: number
  reviewTrail: CapabilityReviewEvent[]
  currentReviewerRole: ReviewerRole | null
}

export type CapabilityFormValues = {
  referenceNo: string
  aircraft: string
  aircraftModel: string
  manufacturer: string
  rating: string
  ataChapter: string
  partDesignationDesc: string
  category: string
  partNumberSeries: string
  partNumberModelNos: string
  locationDkSgd: boolean
  locationDkBll: boolean
  locationMyKul: boolean
  maintenanceReferences: string
  equipmentTools: string
}

export type CapabilityActionState = {
  ok: boolean
  error: string | null
}
