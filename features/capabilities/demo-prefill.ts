import type {
  Capability,
  CapabilityAircraftType,
  CapabilityFormValues,
} from "@/features/capabilities/types"

export type DemoPrefillFactoryInput = {
  seedCapabilities: Capability[]
  year: number
}

type CapabilitySeedTemplate = {
  aircraft: CapabilityAircraftType
  aircraftModels: string[]
  manufacturer: string
  rating: string
  ataChapter: number
  partDesignationDesc: string
  category: string
  partNumberSeries: string
  partNumberModelNos: string[]
  maintenanceReferences: string[]
  equipmentTools: string[]
  locations: {
    dkSgd: boolean
    dkBll: boolean
    myKul: boolean
  }
}

const FALLBACK_TEMPLATES: CapabilitySeedTemplate[] = [
  {
    aircraft: "Aircraft",
    aircraftModels: ["ATR 42 DHC8-100"],
    manufacturer: "HAMILTON SUNDSTRAND",
    rating: "C16",
    ataChapter: 61,
    partDesignationDesc: "PROPELLER SPINNER",
    category: "PROPELLERS",
    partNumberSeries: "790176",
    partNumberModelNos: ["790176-1"],
    maintenanceReferences: ["CMM 61-13-02"],
    equipmentTools: ["Standard propeller balancing kit"],
    locations: {
      dkSgd: true,
      dkBll: true,
      myKul: true,
    },
  },
  {
    aircraft: "Aircraft",
    aircraftModels: ["A320 FAMILY"],
    manufacturer: "SAFRAN",
    rating: "C14",
    ataChapter: 32,
    partDesignationDesc: "NOSE LANDING GEAR ACTUATOR",
    category: "LANDING GEAR",
    partNumberSeries: "D51785",
    partNumberModelNos: ["D51785-12"],
    maintenanceReferences: ["CMM 32-45-11"],
    equipmentTools: ["Hydraulic pressure test bench"],
    locations: {
      dkSgd: true,
      dkBll: false,
      myKul: true,
    },
  },
]

function sampleOne<T>(values: T[]): T {
  const index = Math.floor(Math.random() * values.length)
  return values[index]
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function sampleSome(values: string[], minCount: number, maxCount: number): string[] {
  if (values.length === 0) {
    return []
  }

  const shuffled = [...values].sort(() => Math.random() - 0.5)
  const safeMin = Math.max(1, minCount)
  const safeMax = Math.max(safeMin, maxCount)
  const takeCount = Math.min(
    shuffled.length,
    safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1))
  )

  return shuffled.slice(0, takeCount)
}

function toMultiline(values: string[]): string {
  return values.join("\n")
}

function findMaxReferenceSequence(capabilities: Capability[], year: number): number {
  const prefix = `CA/${year}/`

  return capabilities.reduce((max, capability) => {
    if (!capability.referenceNo.startsWith(prefix)) {
      return max
    }

    const rawSeq = capability.referenceNo.slice(prefix.length)
    const sequence = Number(rawSeq)
    if (!Number.isInteger(sequence)) {
      return max
    }

    return Math.max(max, sequence)
  }, 999)
}

export function getNextReferenceNo(seedCapabilities: Capability[], year: number): string {
  const nextSequence = findMaxReferenceSequence(seedCapabilities, year) + 1
  return `CA/${year}/${nextSequence}`
}

function normalizeTemplate(capability: Capability): CapabilitySeedTemplate {
  return {
    aircraft: capability.aircraft,
    aircraftModels: capability.aircraftModels.filter(Boolean),
    manufacturer: capability.manufacturer,
    rating: capability.rating,
    ataChapter: capability.ataChapter,
    partDesignationDesc: capability.partDesignationDesc,
    category: capability.category,
    partNumberSeries: capability.partNumberSeries,
    partNumberModelNos: capability.partNumberModelNos.filter(Boolean),
    maintenanceReferences: capability.maintenanceReferences.filter(Boolean),
    equipmentTools: capability.equipmentTools.filter(Boolean),
    locations: capability.locations,
  }
}

function jitterNumericSuffix(value: string): string {
  const match = value.match(/^(.*?)(\d+)([^0-9]*)$/)
  if (!match) {
    return `${value}-${Math.floor(Math.random() * 90 + 10)}`
  }

  const [, prefix, digits, suffix] = match
  const base = Number(digits)
  if (!Number.isInteger(base)) {
    return value
  }

  const next = base + Math.floor(Math.random() * 7 + 1)
  return `${prefix}${next}${suffix}`
}

function buildPartNumberModelsFromSeries(series: string): string[] {
  const count = randomInt(1, 3)
  const results: string[] = []

  for (let index = 0; index < count; index += 1) {
    const style = randomInt(0, 2)
    if (style === 0) {
      results.push(`${series}-${randomInt(1, 99)}`)
    } else if (style === 1) {
      const letter = String.fromCharCode(65 + randomInt(0, 25))
      results.push(`${series}-${letter}`)
    } else {
      results.push(`${series}-${randomInt(10, 99)}${String.fromCharCode(65 + randomInt(0, 25))}`)
    }
  }

  return Array.from(new Set(results))
}

function randomizeLocations(template: CapabilitySeedTemplate): CapabilitySeedTemplate["locations"] {
  const options = [
    template.locations,
    { dkSgd: true, dkBll: false, myKul: true },
    { dkSgd: true, dkBll: true, myKul: false },
    { dkSgd: false, dkBll: true, myKul: true },
    { dkSgd: true, dkBll: false, myKul: false },
    { dkSgd: false, dkBll: true, myKul: false },
    { dkSgd: false, dkBll: false, myKul: true },
  ]

  const picked = sampleOne(options)
  if (picked.dkSgd || picked.dkBll || picked.myKul) {
    return picked
  }

  return { dkSgd: true, dkBll: false, myKul: false }
}

export function buildDemoPrefillFactory({
  seedCapabilities,
  year,
}: DemoPrefillFactoryInput): () => CapabilityFormValues {
  const templates = seedCapabilities.length
    ? seedCapabilities.map(normalizeTemplate)
    : FALLBACK_TEMPLATES
  const aircraftModelPool = Array.from(
    new Set(templates.flatMap((template) => template.aircraftModels))
  )
  const maintenanceRefPool = Array.from(
    new Set(templates.flatMap((template) => template.maintenanceReferences))
  )
  const equipmentToolPool = Array.from(
    new Set(templates.flatMap((template) => template.equipmentTools))
  )
  const ataChapterPool = Array.from(
    new Set(templates.map((template) => template.ataChapter))
  )
  void year

  return () => {
    const template = sampleOne(templates)
    const randomLocations = randomizeLocations(template)
    const baseAta = ataChapterPool.length
      ? sampleOne(ataChapterPool)
      : template.ataChapter
    const ataChapter = Math.min(100, Math.max(1, baseAta + randomInt(-4, 4)))
    const partNumberSeries = jitterNumericSuffix(template.partNumberSeries)

    const generatedModels = sampleSome(
      aircraftModelPool.length ? aircraftModelPool : template.aircraftModels,
      1,
      2
    ).map(jitterNumericSuffix)
    const generatedPartNumbers = buildPartNumberModelsFromSeries(partNumberSeries)
    const generatedMaintenanceRefs = sampleSome(
      maintenanceRefPool.length ? maintenanceRefPool : template.maintenanceReferences,
      1,
      2
    ).map(jitterNumericSuffix)
    const generatedTools = sampleSome(
      equipmentToolPool.length ? equipmentToolPool : template.equipmentTools,
      1,
      2
    )

    return {
      referenceNo: "",
      aircraft: template.aircraft,
      aircraftModels: toMultiline(generatedModels),
      manufacturer: template.manufacturer,
      rating: template.rating,
      ataChapter: String(ataChapter),
      partDesignationDesc: template.partDesignationDesc,
      category: template.category,
      partNumberSeries,
      partNumberModelNos: toMultiline(generatedPartNumbers),
      locationDkSgd: randomLocations.dkSgd,
      locationDkBll: randomLocations.dkBll,
      locationMyKul: randomLocations.myKul,
      maintenanceReferences: toMultiline(generatedMaintenanceRefs),
      equipmentTools: toMultiline(generatedTools),
    }
  }
}
