"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const multilineLineSchema = z.object({
  value: z.string().trim().min(1, "This line is required"),
})

const capabilityFormSchema = z
  .object({
    referenceNo: z.string().trim().min(1, "Reference number is required"),
    aircraft: z
      .union([z.literal(""), z.literal("Aircraft"), z.literal("Engine")])
      .refine((value): boolean => value !== "", {
        message: "Aircraft/Engine is required",
      }),
    aircraftModels: z
      .array(multilineLineSchema)
      .min(1, "Aircraft model is required"),
    manufacturer: z.string().trim().min(1, "Manufacturer is required"),
    rating: z.string().trim().min(1, "Rating is required"),
    ataChapter: z
      .string()
      .trim()
      .min(1, "ATA chapter is required")
      .refine((value) => {
        const numeric = Number(value)
        return Number.isInteger(numeric) && numeric >= 1 && numeric <= 100
      }, "ATA chapter must be an integer between 1 and 100"),
    partDesignationDesc: z
      .string()
      .trim()
      .min(1, "Part designation/description is required"),
    category: z.string().trim().min(1, "Category is required"),
    partNumberSeries: z
      .string()
      .trim()
      .min(1, "Part number series is required"),
    partNumberModelNos: z
      .array(multilineLineSchema)
      .min(1, "Part number / model no is required"),
    locationDkSgd: z.boolean(),
    locationDkBll: z.boolean(),
    locationMyKul: z.boolean(),
    maintenanceReferences: z
      .array(multilineLineSchema)
      .min(1, "Maintenance reference is required"),
    equipmentTools: z
      .array(multilineLineSchema)
      .min(1, "Equipment/tools is required"),
  })
  .superRefine((value, context) => {
    if (!value.locationDkSgd && !value.locationDkBll && !value.locationMyKul) {
      context.addIssue({
        code: "custom",
        message: "Select at least one location",
        path: ["locationDkSgd"],
      })
    }
  })

type CapabilityFormInput = z.infer<typeof capabilityFormSchema>

function parseMultilineValue(value: string): Array<{ value: string }> {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return (lines.length > 0 ? lines : [""]).map((line) => ({ value: line }))
}

function toDefaultValues(values: CapabilityFormValues): CapabilityFormInput {
  return {
    referenceNo: values.referenceNo,
    aircraft:
      values.aircraft === "Aircraft" || values.aircraft === "Engine"
        ? values.aircraft
        : "",
    aircraftModels: parseMultilineValue(values.aircraftModels),
    manufacturer: values.manufacturer,
    rating: values.rating,
    ataChapter: values.ataChapter,
    partDesignationDesc: values.partDesignationDesc,
    category: values.category,
    partNumberSeries: values.partNumberSeries,
    partNumberModelNos: parseMultilineValue(values.partNumberModelNos),
    locationDkSgd: values.locationDkSgd,
    locationDkBll: values.locationDkBll,
    locationMyKul: values.locationMyKul,
    maintenanceReferences: parseMultilineValue(values.maintenanceReferences),
    equipmentTools: parseMultilineValue(values.equipmentTools),
  }
}

function toMultilinePayload(lines: Array<{ value: string }>): string {
  return lines
    .map((line) => line.value.trim())
    .filter(Boolean)
    .join("\n")
}

function toFormData(values: CapabilityFormInput): FormData {
  const formData = new FormData()

  formData.set("referenceNo", values.referenceNo.trim())
  formData.set("aircraft", values.aircraft)
  formData.set("aircraftModels", toMultilinePayload(values.aircraftModels))
  formData.set("manufacturer", values.manufacturer.trim())
  formData.set("rating", values.rating.trim())
  formData.set("ataChapter", values.ataChapter.trim())
  formData.set("partDesignationDesc", values.partDesignationDesc.trim())
  formData.set("category", values.category.trim())
  formData.set("partNumberSeries", values.partNumberSeries.trim())
  formData.set(
    "partNumberModelNos",
    toMultilinePayload(values.partNumberModelNos)
  )
  formData.set(
    "maintenanceReferences",
    toMultilinePayload(values.maintenanceReferences)
  )
  formData.set("equipmentTools", toMultilinePayload(values.equipmentTools))

  if (values.locationDkSgd) formData.set("locationDkSgd", "on")
  if (values.locationDkBll) formData.set("locationDkBll", "on")
  if (values.locationMyKul) formData.set("locationMyKul", "on")

  return formData
}

export function CapabilityForm({
  title,
  values,
  readOnly = false,
  saveAction,
  saveButtonLabel = "Save",
  submitAction,
}: CapabilityFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CapabilityFormInput>({
    resolver: zodResolver(capabilityFormSchema),
    defaultValues: toDefaultValues(values),
    mode: "onSubmit",
  })

  useEffect(() => {
    form.reset(toDefaultValues(values))
  }, [form, values])

  const partNumberModelNos = useFieldArray({
    control: form.control,
    name: "partNumberModelNos",
  })
  const aircraftModels = useFieldArray({
    control: form.control,
    name: "aircraftModels",
  })

  const maintenanceReferences = useFieldArray({
    control: form.control,
    name: "maintenanceReferences",
  })

  const equipmentTools = useFieldArray({
    control: form.control,
    name: "equipmentTools",
  })

  const locationError =
    form.formState.errors.locationDkSgd ??
    form.formState.errors.locationDkBll ??
    form.formState.errors.locationMyKul
  const aircraftError = form.formState.errors.aircraft
  const aircraftModelsError = form.formState.errors.aircraftModels as
    | { message?: string }
    | undefined
  const partNumberModelNosError = form.formState.errors.partNumberModelNos as
    | { message?: string }
    | undefined
  const maintenanceReferencesError = form.formState.errors
    .maintenanceReferences as { message?: string } | undefined
  const equipmentToolsError = form.formState.errors.equipmentTools as
    | { message?: string }
    | undefined

  async function runSave(input: CapabilityFormInput): Promise<boolean> {
    if (!saveAction) {
      return false
    }

    setServerError(null)
    setIsSaving(true)

    const result = await saveAction(
      { ok: false, error: null },
      toFormData(input)
    )

    setIsSaving(false)

    if (!result.ok) {
      setServerError(result.error ?? "Unable to save PN Form")
      return false
    }

    return true
  }

  const handleSave = form.handleSubmit(async (input) => {
    await runSave(input)
  })

  const handleSubmitForReview = form.handleSubmit(async (input) => {
    const didSave = await runSave(input)

    if (!didSave || !submitAction) {
      return
    }

    setIsSubmitting(true)
    const result = await submitAction(
      { ok: false, error: null },
      new FormData()
    )
    setIsSubmitting(false)

    if (!result.ok) {
      setServerError(result.error ?? "Unable to submit PN Form")
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError ? <FieldError>{serverError}</FieldError> : null}

        <form onSubmit={handleSave} className="space-y-6">
          <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
            <Field data-invalid={!!form.formState.errors.referenceNo}>
              <FieldLabel htmlFor="referenceNo">Reference Number</FieldLabel>
              <Input
                id="referenceNo"
                {...form.register("referenceNo")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.referenceNo]} />
            </Field>

            <div className="space-y-1">
              <FieldLabel className={locationError ? "text-destructive" : ""}>
                Location
              </FieldLabel>
              <div className="inline-block max-w-full overflow-x-auto rounded-md border border-border p-3">
                <div className="flex min-w-max flex-row items-center gap-6">
                  {LOCATION_OPTIONS.map((location) => {
                    const fieldName =
                      location.key === "dkSgd"
                        ? "locationDkSgd"
                        : location.key === "dkBll"
                          ? "locationDkBll"
                          : "locationMyKul"
                    const checkboxId = `location-${location.key}`

                    return (
                      <Controller
                        key={location.key}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <div className="flex flex-none items-center gap-2">
                            <Checkbox
                              id={checkboxId}
                              checked={field.value}
                              onCheckedChange={(nextChecked) =>
                                field.onChange(Boolean(nextChecked))
                              }
                              disabled={readOnly}
                            />
                            <FieldLabel htmlFor={checkboxId} className="w-auto flex-none">
                              {location.label}
                            </FieldLabel>
                          </div>
                        )}
                      />
                    )
                  })}
                </div>
              </div>
              <FieldError errors={[locationError]} />
            </div>

            <Controller
              control={form.control}
              name="aircraft"
              render={({ field }) => (
                <Field data-invalid={!!aircraftError}>
                  <FieldLabel
                    className={aircraftError ? "text-destructive" : ""}
                  >
                    Aircraft / Engine
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(nextValue) =>
                      field.onChange(nextValue ?? "")
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aircraft">Aircraft</SelectItem>
                      <SelectItem value="Engine">Engine</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[aircraftError]} />
                </Field>
              )}
            />

            <Field data-invalid={!!form.formState.errors.rating}>
              <FieldLabel htmlFor="rating">Rating</FieldLabel>
              <Input
                id="rating"
                {...form.register("rating")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.rating]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.ataChapter}>
              <FieldLabel htmlFor="ataChapter">ATA Chapter (1-100)</FieldLabel>
              <Input
                id="ataChapter"
                type="number"
                min={1}
                max={100}
                step={1}
                {...form.register("ataChapter")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.ataChapter]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.category}>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                {...form.register("category")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.category]} />
            </Field>

            <Field
              className="md:col-span-2"
              data-invalid={!!form.formState.errors.partDesignationDesc}
            >
              <FieldLabel htmlFor="partDesignationDesc">
                Part Designation/Description
              </FieldLabel>
              <Input
                id="partDesignationDesc"
                {...form.register("partDesignationDesc")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError
                errors={[form.formState.errors.partDesignationDesc]}
              />
            </Field>

          </FieldGroup>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
            <Field data-invalid={!!form.formState.errors.manufacturer}>
              <FieldLabel htmlFor="manufacturer">Manufacturer</FieldLabel>
              <Input
                id="manufacturer"
                {...form.register("manufacturer")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.manufacturer]} />
            </Field>

            <FieldSet>
              <FieldLegend
                variant="label"
                className={aircraftModelsError ? "text-destructive" : ""}
              >
                Aircraft Model (one line each)
              </FieldLegend>
              <FieldGroup>
                {aircraftModels.fields.map((item, index) => (
                  <Field
                    key={item.id}
                    data-invalid={
                      !!form.formState.errors.aircraftModels?.[index]?.value
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(`aircraftModels.${index}.value` as const)}
                        readOnly={readOnly}
                        disabled={readOnly}
                        placeholder={`Aircraft model ${index + 1}`}
                      />
                      {!readOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            if (aircraftModels.fields.length === 1) {
                              form.setValue("aircraftModels.0.value", "")
                              return
                            }
                            aircraftModels.remove(index)
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
                      ) : null}
                    </div>
                    <FieldError
                      errors={[form.formState.errors.aircraftModels?.[index]?.value]}
                    />
                  </Field>
                ))}
              </FieldGroup>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => aircraftModels.append({ value: "" })}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
              <FieldError errors={[aircraftModelsError]} />
            </FieldSet>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
            <Field data-invalid={!!form.formState.errors.partNumberSeries}>
              <FieldLabel htmlFor="partNumberSeries">
                Part Number Series
              </FieldLabel>
              <Input
                id="partNumberSeries"
                {...form.register("partNumberSeries")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FieldError errors={[form.formState.errors.partNumberSeries]} />
            </Field>

            <FieldSet>
              <FieldLegend
                variant="label"
                className={partNumberModelNosError ? "text-destructive" : ""}
              >
                Part Number / Model Number (one line each)
              </FieldLegend>
              <FieldGroup>
                {partNumberModelNos.fields.map((item, index) => (
                  <Field
                    key={item.id}
                    data-invalid={
                      !!form.formState.errors.partNumberModelNos?.[index]?.value
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(
                          `partNumberModelNos.${index}.value` as const
                        )}
                        readOnly={readOnly}
                        disabled={readOnly}
                        placeholder={`Part number/model ${index + 1}`}
                      />
                      {!readOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            if (partNumberModelNos.fields.length === 1) {
                              form.setValue(`partNumberModelNos.0.value`, "")
                              return
                            }
                            partNumberModelNos.remove(index)
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
                      ) : null}
                    </div>
                    <FieldError
                      errors={[
                        form.formState.errors.partNumberModelNos?.[index]?.value,
                      ]}
                    />
                  </Field>
                ))}
              </FieldGroup>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => partNumberModelNos.append({ value: "" })}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
              <FieldError errors={[partNumberModelNosError]} />
            </FieldSet>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
            <FieldSet>
              <FieldLegend
                variant="label"
                className={maintenanceReferencesError ? "text-destructive" : ""}
              >
                Maintenance References (one line each)
              </FieldLegend>
              <FieldGroup>
                {maintenanceReferences.fields.map((item, index) => (
                  <Field
                    key={item.id}
                    data-invalid={
                      !!form.formState.errors.maintenanceReferences?.[index]
                        ?.value
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(
                          `maintenanceReferences.${index}.value` as const
                        )}
                        readOnly={readOnly}
                        disabled={readOnly}
                        placeholder={`Maintenance reference ${index + 1}`}
                      />
                      {!readOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            if (maintenanceReferences.fields.length === 1) {
                              form.setValue(`maintenanceReferences.0.value`, "")
                              return
                            }
                            maintenanceReferences.remove(index)
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
                      ) : null}
                    </div>
                    <FieldError
                      errors={[
                        form.formState.errors.maintenanceReferences?.[index]
                          ?.value,
                      ]}
                    />
                  </Field>
                ))}
              </FieldGroup>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => maintenanceReferences.append({ value: "" })}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
              <FieldError errors={[maintenanceReferencesError]} />
            </FieldSet>

            <FieldSet>
              <FieldLegend
                variant="label"
                className={equipmentToolsError ? "text-destructive" : ""}
              >
                Equipment / Tools (one line each)
              </FieldLegend>
              <FieldGroup>
                {equipmentTools.fields.map((item, index) => (
                  <Field
                    key={item.id}
                    data-invalid={
                      !!form.formState.errors.equipmentTools?.[index]?.value
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(
                          `equipmentTools.${index}.value` as const
                        )}
                        readOnly={readOnly}
                        disabled={readOnly}
                        placeholder={`Equipment/tool ${index + 1}`}
                      />
                      {!readOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            if (equipmentTools.fields.length === 1) {
                              form.setValue(`equipmentTools.0.value`, "")
                              return
                            }
                            equipmentTools.remove(index)
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
                      ) : null}
                    </div>
                    <FieldError
                      errors={[
                        form.formState.errors.equipmentTools?.[index]?.value,
                      ]}
                    />
                  </Field>
                ))}
              </FieldGroup>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => equipmentTools.append({ value: "" })}
                >
                  <IconPlus size={16} />
                  Add line
                </Button>
              ) : null}
              <FieldError errors={[equipmentToolsError]} />
            </FieldSet>
          </div>

          {!readOnly ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {saveAction ? (
                <Button type="submit" disabled={isSaving || isSubmitting}>
                  {isSaving ? "Saving..." : saveButtonLabel}
                </Button>
              ) : null}

              {submitAction ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving || isSubmitting}
                  onClick={handleSubmitForReview}
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
