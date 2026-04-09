"use client"

import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { LOCATION_OPTIONS } from "@/features/capabilities/constants"
import type {
  CapabilityActionState,
  CapabilityFormValues,
} from "@/features/capabilities/types"

type CapabilityFormAction = (
  state: CapabilityActionState,
  formData: FormData
) => Promise<CapabilityActionState>

type CapabilityFormProps = {
  title: string
  values: CapabilityFormValues
  readOnly?: boolean
  saveAction?: CapabilityFormAction
  saveButtonLabel?: string
  submitAction?: CapabilityFormAction
}

const INITIAL_STATE: CapabilityActionState = { ok: false, error: null }

function parseMultilineValue(value: string): string[] {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.length > 0 ? lines : [""]
}

export function CapabilityForm({
  title,
  values,
  readOnly = false,
  saveAction,
  saveButtonLabel = "Save",
  submitAction,
}: CapabilityFormProps) {
  const [locationDkSgd, setLocationDkSgd] = useState(values.locationDkSgd)
  const [locationDkBll, setLocationDkBll] = useState(values.locationDkBll)
  const [locationMyKul, setLocationMyKul] = useState(values.locationMyKul)
  const [maintenanceLines, setMaintenanceLines] = useState(() =>
    parseMultilineValue(values.maintenanceReferences)
  )
  const [equipmentLines, setEquipmentLines] = useState(() =>
    parseMultilineValue(values.equipmentTools)
  )
  const [partNumberModelLines, setPartNumberModelLines] = useState(() =>
    parseMultilineValue(values.partNumberModelNos)
  )

  const [saveState, saveFormAction, isSaving] = useActionState(
    saveAction ?? (async () => ({ ok: false, error: "Save not available" })),
    INITIAL_STATE
  )

  const [submitState, submitFormAction, isSubmitting] = useActionState(
    submitAction ?? (async () => ({ ok: false, error: "Submit not available" })),
    INITIAL_STATE
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={saveFormAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Reference No</span>
              <Input
                name="referenceNo"
                defaultValue={values.referenceNo}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Aircraft</span>
              <Input
                name="aircraft"
                defaultValue={values.aircraft}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">ATA Chapter (1-100)</span>
              <Input
                name="ataChapter"
                type="number"
                min={1}
                max={100}
                step={1}
                defaultValue={values.ataChapter}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Category</span>
              <Input
                name="category"
                defaultValue={values.category}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Part Designation/Description</span>
              <Input
                name="partDesignationDesc"
                defaultValue={values.partDesignationDesc}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Part Number Series</span>
              <Input
                name="partNumberSeries"
                defaultValue={values.partNumberSeries}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Part Number / Model No (one line each)
              </label>
              <input
                type="hidden"
                name="partNumberModelNos"
                value={partNumberModelLines.join("\n")}
              />
              <div className="mt-1 space-y-2">
                {partNumberModelLines.map((line, index) => (
                  <div key={`pn-model-${index}`} className="flex items-center gap-2">
                    <Input
                      value={line}
                      disabled={readOnly}
                      onChange={(event) =>
                        setPartNumberModelLines((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          )
                        )
                      }
                      placeholder={`Part number/model ${index + 1}`}
                    />
                    {!readOnly ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setPartNumberModelLines((previous) =>
                            previous.length === 1
                              ? [""]
                              : previous.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                      >
                        <IconTrash size={16} />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPartNumberModelLines((previous) => [...previous, ""])
                    }
                  >
                    <IconPlus size={16} />
                    Add line
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Location</legend>
            <div className="flex flex-wrap gap-4">
              {LOCATION_OPTIONS.map((location) => {
                const checkedValue =
                  location.key === "dkSgd"
                    ? locationDkSgd
                    : location.key === "dkBll"
                      ? locationDkBll
                      : locationMyKul

                const inputName =
                  location.key === "dkSgd"
                    ? "locationDkSgd"
                    : location.key === "dkBll"
                      ? "locationDkBll"
                      : "locationMyKul"

                return (
                  <label key={location.key} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checkedValue}
                      onCheckedChange={(nextChecked) => {
                        const isChecked = Boolean(nextChecked)
                        if (location.key === "dkSgd") setLocationDkSgd(isChecked)
                        if (location.key === "dkBll") setLocationDkBll(isChecked)
                        if (location.key === "myKul") setLocationMyKul(isChecked)
                      }}
                      disabled={readOnly}
                    />
                    {!readOnly && checkedValue ? (
                      <input type="hidden" name={inputName} value="on" />
                    ) : null}
                    {location.label}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium">
              Maintenance References (one line each)
            </label>
            <input
              type="hidden"
              name="maintenanceReferences"
              value={maintenanceLines.join("\n")}
            />
            <div className="mt-1 space-y-2">
              {maintenanceLines.map((line, index) => (
                <div key={`maintenance-${index}`} className="flex items-center gap-2">
                  <Input
                    value={line}
                    disabled={readOnly}
                    onChange={(event) =>
                      setMaintenanceLines((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item
                        )
                      )
                    }
                    placeholder={`Maintenance reference ${index + 1}`}
                  />
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setMaintenanceLines((previous) =>
                          previous.length === 1
                            ? [""]
                            : previous.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      <IconTrash size={16} />
                    </Button>
                  ) : null}
                </div>
              ))}
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMaintenanceLines((previous) => [...previous, ""])}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Equipment / Tools (one line each)
            </label>
            <input
              type="hidden"
              name="equipmentTools"
              value={equipmentLines.join("\n")}
            />
            <div className="mt-1 space-y-2">
              {equipmentLines.map((line, index) => (
                <div key={`equipment-${index}`} className="flex items-center gap-2">
                  <Input
                    value={line}
                    disabled={readOnly}
                    onChange={(event) =>
                      setEquipmentLines((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item
                        )
                      )
                    }
                    placeholder={`Equipment/tool ${index + 1}`}
                  />
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setEquipmentLines((previous) =>
                          previous.length === 1
                            ? [""]
                            : previous.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      <IconTrash size={16} />
                    </Button>
                  ) : null}
                </div>
              ))}
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipmentLines((previous) => [...previous, ""])}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
            </div>
          </div>

          {saveState.error ? (
            <p className="text-sm text-destructive">{saveState.error}</p>
          ) : null}

          {!readOnly && saveAction ? (
            <Button type="submit" disabled={isSaving} className="mt-2">
              {isSaving ? "Saving..." : saveButtonLabel}
            </Button>
          ) : null}
        </form>

        {!readOnly && submitAction ? (
          <form action={submitFormAction}>
            {submitState.error ? (
              <p className="mb-2 text-sm text-destructive">{submitState.error}</p>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Submitting..." : "Submit For Review"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
