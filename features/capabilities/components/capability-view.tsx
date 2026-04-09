import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Capability } from "@/features/capabilities/types"

type CapabilityViewProps = {
  capability: Capability
}

export function CapabilityView({ capability }: CapabilityViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PN Form Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 font-medium">Reference No</p>
            <p className="text-muted-foreground">{capability.referenceNo}</p>
          </div>

          <div>
            <p className="mb-1 font-medium">Locations</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {[
                capability.locations.dkSgd ? "DK-SGD" : null,
                capability.locations.dkBll ? "DK-BLL" : null,
                capability.locations.myKul ? "MY-KUL" : null,
              ]
                .filter(Boolean)
                .map((location) => <li key={location}>{location}</li>)}
            </ul>
          </div>

          <div>
            <p className="mb-1 font-medium">Aircraft / Engine</p>
            <p className="text-muted-foreground">{capability.aircraft}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">Rating</p>
            <p className="text-muted-foreground">{capability.rating}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">ATA Chapter</p>
            <p className="text-muted-foreground">{capability.ataChapter}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">Category</p>
            <p className="text-muted-foreground">{capability.category}</p>
          </div>
          <div className="md:col-span-2">
            <p className="mb-1 font-medium">Part Designation/Desc</p>
            <p className="text-muted-foreground">{capability.partDesignationDesc}</p>
          </div>

          <div>
            <p className="mb-1 font-medium">Manufacturer</p>
            <p className="text-muted-foreground">{capability.manufacturer}</p>
          </div>

          <div>
            <p className="mb-1 font-medium">Aircraft Model</p>
            <p className="text-muted-foreground">{capability.aircraftModel}</p>
          </div>

          <div className="md:col-span-2">
            <p className="mb-1 font-medium">Part Number Series</p>
            <p className="text-muted-foreground">{capability.partNumberSeries}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 font-medium">Part Number / Model No</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {capability.partNumberModelNos.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 font-medium">Maintenance References</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {capability.maintenanceReferences.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 font-medium">Equipment / Tools</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {capability.equipmentTools.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
