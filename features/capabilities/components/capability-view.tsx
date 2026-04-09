import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Capability } from "@/features/capabilities/types"

type CapabilityViewProps = {
  capability: Capability
}

export function CapabilityView({ capability }: CapabilityViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capability Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <p><span className="font-medium">Reference No:</span> {capability.referenceNo}</p>
          <p><span className="font-medium">Aircraft / Engine:</span> {capability.aircraft}</p>
          <p><span className="font-medium">Aircraft Model:</span> {capability.aircraftModel}</p>
          <p><span className="font-medium">Manufacturer:</span> {capability.manufacturer}</p>
          <p><span className="font-medium">Rating:</span> {capability.rating}</p>
          <p><span className="font-medium">ATA Chapter:</span> {capability.ataChapter}</p>
          <p><span className="font-medium">Category:</span> {capability.category}</p>
          <p className="md:col-span-2"><span className="font-medium">Part Designation/Desc:</span> {capability.partDesignationDesc}</p>
          <p className="md:col-span-2"><span className="font-medium">Part Number Series:</span> {capability.partNumberSeries}</p>
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
          <p className="mb-1 font-medium">Locations</p>
          <p className="text-muted-foreground">
            {[
              capability.locations.dkSgd ? "DK-SGD" : null,
              capability.locations.dkBll ? "DK-BLL" : null,
              capability.locations.myKul ? "MY-KUL" : null,
            ]
              .filter(Boolean)
              .join(", ") || "-"}
          </p>
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
