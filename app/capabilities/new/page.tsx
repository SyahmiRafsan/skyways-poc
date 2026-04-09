import type { Metadata } from "next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createCapabilityAction } from "@/features/capabilities/actions"
import { CapabilityForm } from "@/features/capabilities/components/capability-form"
import { readCapabilities } from "@/features/capabilities/server"
import { getSessionFromCookieStore } from "@/features/auth/session"
import type { CapabilityFormValues } from "@/features/capabilities/types"

export const metadata: Metadata = {
  title: "Register PN Form",
}

const EMPTY_VALUES: CapabilityFormValues = {
  referenceNo: "",
  aircraft: "",
  aircraftModels: "",
  manufacturer: "",
  rating: "",
  ataChapter: "",
  partDesignationDesc: "",
  category: "",
  partNumberSeries: "",
  partNumberModelNos: "",
  locationDkSgd: false,
  locationDkBll: false,
  locationMyKul: false,
  maintenanceReferences: "",
  equipmentTools: "",
}

export default async function NewCapabilityPage() {
  const session = await getSessionFromCookieStore()
  const capabilities = await readCapabilities()
  const demoPrefillConfig = {
    seedCapabilities: capabilities,
    year: new Date().getFullYear(),
  }

  if (!session || session.role !== "user") {
    return (
      <main className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only user role can register PN Forms.
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-6">
      <CapabilityForm
        title="Register PN Form"
        values={EMPTY_VALUES}
        saveAction={createCapabilityAction}
        saveButtonLabel="Create Draft"
        showDemoPrefill
        demoPrefillConfig={demoPrefillConfig}
      />
    </main>
  )
}
