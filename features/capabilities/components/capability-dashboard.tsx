"use client"

import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  AuthorityApproval,
  Capability,
} from "@/features/capabilities/types"

type CapabilityDashboardProps = {
  approvals: AuthorityApproval[]
  capabilities: Capability[]
  secondaryCapabilities?: Capability[]
  title?: string
  countLabel?: string
  searchPlaceholder?: string
  showHeader?: boolean
  showSearch?: boolean
  showApprovalsCards?: boolean
  showDataViewToggle?: boolean
  defaultDataView?: "primary" | "secondary"
  primaryLabel?: string
  secondaryLabel?: string
}

type DashboardRow = {
  id: string
  rating: string
  ataChapter: string
  category: string
  partDesignationDesc: string
  manufacturer: string
  aircraftModel: string
  partNumberSeries: string
  partNumberModelNos: string
  maintenanceReferences: string
  dkSgd: boolean
  dkBll: boolean
  myKul: boolean
  referenceNo: string
  aircraft: string
}

const columnConfigs = [
  { key: "rating", label: "Rating" },
  { key: "ataChapter", label: "ATA" },
  { key: "category", label: "Category" },
  { key: "partDesignationDesc", label: "Designation" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "aircraftModel", label: "Aircraft Model" },
  { key: "partNumberSeries", label: "P/N Series" },
  { key: "partNumberModelNos", label: "P/N" },
  { key: "maintenanceReferences", label: "Maintenance Reference" },
  { key: "dkSgd", label: "DK-SGD" },
  { key: "dkBll", label: "DK-BLL" },
  { key: "myKul", label: "MY-KUL" },
  { key: "referenceNo", label: "Reference No." },
] as const

type ColumnKey = (typeof columnConfigs)[number]["key"]

function mapCapabilityToRow(capability: Capability): DashboardRow {
  return {
    id: capability.id,
    rating: capability.rating,
    ataChapter: String(capability.ataChapter),
    category: capability.category,
    partDesignationDesc: capability.partDesignationDesc,
    manufacturer: capability.manufacturer,
    aircraftModel: capability.aircraftModels.join(" | "),
    partNumberSeries: capability.partNumberSeries,
    partNumberModelNos: capability.partNumberModelNos[0] ?? "",
    maintenanceReferences: capability.maintenanceReferences.join(" | "),
    dkSgd: capability.locations.dkSgd,
    dkBll: capability.locations.dkBll,
    myKul: capability.locations.myKul,
    referenceNo: capability.referenceNo,
    aircraft: capability.aircraft,
  }
}

function getFilterValue(item: DashboardRow, key: ColumnKey): string {
  const value = item[key]
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return String(value)
}

function createInitialFilters(): Record<ColumnKey, string> {
  return columnConfigs.reduce(
    (accumulator, column) => {
      accumulator[column.key] = "All"
      return accumulator
    },
    {} as Record<ColumnKey, string>
  )
}

type FilterComboboxProps = {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

function FilterCombobox({
  label,
  options,
  value,
  onChange,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between rounded-md border-border px-2 text-xs font-normal"
            aria-label={`Filter ${label}`}
          />
        }
      >
        <span className="truncate">{value}</span>
        <IconChevronDown size={14} className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandItem
              value="All"
              data-checked={value === "All"}
              onSelect={() => {
                onChange("All")
                setOpen(false)
              }}
            >
              All
            </CommandItem>
            {options.map((option) => (
              <CommandItem
                key={option}
                value={option}
                data-checked={value === option}
                onSelect={() => {
                  onChange(option)
                  setOpen(false)
                }}
              >
                {option}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CapabilityDashboard({
  approvals,
  capabilities,
  secondaryCapabilities,
  title = "Capability List Management",
  countLabel = "Total Capabilities",
  searchPlaceholder = "Search by caplist, PN, OEM, Aircraft Type",
  showHeader = true,
  showSearch = true,
  showApprovalsCards = true,
  showDataViewToggle = false,
  defaultDataView = "primary",
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
}: CapabilityDashboardProps) {
  const [query, setQuery] = useState("")
  const [dataView, setDataView] = useState<"primary" | "secondary">(
    defaultDataView
  )
  const [filters, setFilters] =
    useState<Record<ColumnKey, string>>(createInitialFilters)
  const hasSecondaryData = Boolean(secondaryCapabilities)
  const primaryCount = capabilities.length
  const secondaryCount = secondaryCapabilities?.length ?? 0
  const sourceCapabilities = useMemo(
    () =>
      showDataViewToggle && hasSecondaryData && dataView === "secondary"
        ? (secondaryCapabilities ?? [])
        : capabilities,
    [
      capabilities,
      dataView,
      hasSecondaryData,
      secondaryCapabilities,
      showDataViewToggle,
    ]
  )

  const rows = useMemo(
    () => sourceCapabilities.map(mapCapabilityToRow),
    [sourceCapabilities]
  )

  const filterOptions = useMemo(() => {
    return columnConfigs.reduce(
      (accumulator, column) => {
        const uniqueValues = Array.from(
          new Set(rows.map((item) => getFilterValue(item, column.key)))
        ).sort((a, b) => a.localeCompare(b))

        accumulator[column.key] = uniqueValues
        return accumulator
      },
      {} as Record<ColumnKey, string[]>
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesQuery =
        !keyword ||
        [
          item.rating,
          item.ataChapter,
          item.category,
          item.partDesignationDesc,
          item.manufacturer,
          item.aircraftModel,
          item.partNumberSeries,
          item.partNumberModelNos,
          item.maintenanceReferences,
          item.referenceNo,
          item.aircraft,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword)

      if (!matchesQuery) {
        return false
      }

      return columnConfigs.every((column) => {
        const selected = filters[column.key]
        if (selected === "All") {
          return true
        }
        return getFilterValue(item, column.key) === selected
      })
    })
  }, [filters, query, rows])

  return (
    <div className="space-y-8 px-4 py-8 md:px-6 md:py-10">
      {showHeader ? (
        <section className="space-y-6 text-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-lg font-medium text-muted-foreground">
              {countLabel}: {filteredRows.length}
            </p>
          </div>

          {showSearch ? (
            <div className="flex flex-col justify-center gap-3 md:flex-row md:items-center">
              <label className="relative max-w-md flex-1">
                <IconSearch
                  size={20}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 pl-10"
                  placeholder={searchPlaceholder}
                />
              </label>
              {showDataViewToggle && hasSecondaryData ? (
                <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
                  <Button
                    type="button"
                    variant={dataView === "primary" ? "default" : "outline"}
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setDataView("primary")}
                  >
                    <span>{primaryLabel}</span>
                    {primaryCount > 0 ? (
                      <Badge variant="secondary" className="min-w-5 px-1.5">
                        {primaryCount}
                      </Badge>
                    ) : null}
                  </Button>
                  <Button
                    type="button"
                    variant={dataView === "secondary" ? "default" : "outline"}
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setDataView("secondary")}
                  >
                    <span>{secondaryLabel}</span>
                    {secondaryCount > 0 ? (
                      <Badge variant="secondary" className="min-w-5 px-1.5">
                        {secondaryCount}
                      </Badge>
                    ) : null}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {showApprovalsCards ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {approvals.map((approval) => (
            <Card key={approval.authority} className="gap-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {approval.authority}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Issue No:{" "}
                  <span className="font-semibold text-foreground">
                    {approval.issueNo}
                  </span>
                </p>
                <p>
                  Revision No:{" "}
                  <span className="font-semibold text-foreground">
                    {approval.revisionNo}
                  </span>
                </p>
                <p>
                  Revision Date:{" "}
                  <span className="font-semibold text-foreground">
                    {approval.revisionDate}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <Table className="w-full min-w-[1280px] border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columnConfigs.map((column, columnIndex) => (
                  <TableHead
                    key={column.key}
                    className={`h-auto px-3 pt-4 pb-3 text-left text-xs font-semibold uppercase ${
                      columnIndex === 0 ? "pl-6" : ""
                    } ${columnIndex === columnConfigs.length - 1 ? "pr-6" : ""}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {columnConfigs.map((column, columnIndex) => (
                  <TableHead
                    key={`${column.key}-filter`}
                    className={`h-auto border-b px-2 py-2 ${
                      columnIndex === 0 ? "pl-6" : ""
                    } ${columnIndex === columnConfigs.length - 1 ? "pr-6" : ""}`}
                  >
                    <FilterCombobox
                      label={column.label}
                      value={filters[column.key]}
                      options={filterOptions[column.key]}
                      onChange={(nextValue) =>
                        setFilters((previous) => ({
                          ...previous,
                          [column.key]: nextValue,
                        }))
                      }
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.map((capability, index) => (
                <TableRow
                  key={capability.id}
                  className={index % 2 ? "bg-muted/20" : "bg-background"}
                >
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block py-4 pr-3 pl-6 font-medium hover:bg-muted/40"
                    >
                      {capability.rating}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.ataChapter}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.category}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.partDesignationDesc}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.manufacturer}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.aircraftModel}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.partNumberSeries}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.partNumberModelNos}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 font-medium hover:bg-muted/40"
                    >
                      {capability.maintenanceReferences}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0 text-center">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 hover:bg-muted/40"
                    >
                      {capability.dkSgd ? (
                        <IconCheck className="mx-auto" size={18} />
                      ) : (
                        "-"
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0 text-center">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 hover:bg-muted/40"
                    >
                      {capability.dkBll ? (
                        <IconCheck className="mx-auto" size={18} />
                      ) : (
                        "-"
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0 text-center">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block px-3 py-4 hover:bg-muted/40"
                    >
                      {capability.myKul ? (
                        <IconCheck className="mx-auto" size={18} />
                      ) : (
                        "-"
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="border-b p-0">
                    <Link
                      href={`/capabilities/${capability.id}`}
                      className="block py-4 pr-6 pl-3 font-medium hover:bg-muted/40"
                    >
                      {capability.referenceNo}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
