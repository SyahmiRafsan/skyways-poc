export type AuthorityApproval = {
  authority: string
  issueNo: string
  revisionNo: string
  revisionDate: string
}

export type Capability = {
  id: string
  rating: string
  ata: string
  category: string
  designation: string
  manufacturer: string
  aircraftModel: string
  pnSeries: string
  pn: string
  maintenanceReference: string
  dkSgd: boolean
  dkBll: boolean
  myKul: boolean
  referenceNo: string
}
