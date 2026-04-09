import type { CapabilityStatus, ReviewerRole } from "@/features/capabilities/types"

export const CAPABILITY_DATA_FILE = "features/capabilities/data/capabilities.json"

export const LOCATION_OPTIONS = [
  { key: "dkSgd", label: "DK-SGD" },
  { key: "dkBll", label: "DK-BLL" },
  { key: "myKul", label: "MY-KUL" },
] as const

export const REVIEW_STATUS_BY_ROLE: Record<ReviewerRole, CapabilityStatus> = {
  tsm: "TSM_REVIEW",
  qam: "QAM_REVIEW",
  wm: "WM_REVIEW",
}

export const NEXT_STATUS_BY_REVIEW_ROLE: Record<ReviewerRole, CapabilityStatus> = {
  tsm: "QAM_REVIEW",
  qam: "WM_REVIEW",
  wm: "APPROVED",
}
