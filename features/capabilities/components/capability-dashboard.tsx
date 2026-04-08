"use client"

import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
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
}

const columnConfigs = [
  { key: "rating", label: "Rating" },
  { key: "ata", label: "ATA" },
  { key: "category", label: "Category" },
  { key: "designation", label: "Designation" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "aircraftModel", label: "Aircraft Model" },
  { key: "pnSeries", label: "P/N Series" },
  { key: "pn", label: "P/N" },
  { key: "maintenanceReference", label: "Maintenance Reference" },
  { key: "dkSgd", label: "DK-SGD" },
  { key: "dkBll", label: "DK-BLL" },
  { key: "myKul", label: "MY-KUL" },
  { key: "referenceNo", label: "Reference No." },
] as const

type ColumnKey = (typeof columnConfigs)[number]["key"]

function getFilterValue(item: Capability, key: ColumnKey): string {
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
}: CapabilityDashboardProps) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] =
    useState<Record<ColumnKey, string>>(createInitialFilters)

  const filterOptions = useMemo(() => {
    return columnConfigs.reduce(
      (accumulator, column) => {
        const uniqueValues = Array.from(
          new Set(capabilities.map((item) => getFilterValue(item, column.key)))
        ).sort((a, b) => a.localeCompare(b))

        accumulator[column.key] = uniqueValues
        return accumulator
      },
      {} as Record<ColumnKey, string[]>
    )
  }, [capabilities])

  const filteredCapabilities = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return capabilities.filter((item) => {
      const matchesQuery =
        !keyword ||
        [
          item.rating,
          item.ata,
          item.category,
          item.designation,
          item.pn,
          item.pnSeries,
          item.manufacturer,
          item.aircraftModel,
          item.maintenanceReference,
          item.referenceNo,
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
  }, [capabilities, filters, query])

  return (
    <div className="space-y-8 px-4 py-8 md:px-6 md:py-10">
      <section className="space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Capability List Management
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            Total Capabilities: {filteredCapabilities.length}
          </p>
        </div>

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
              placeholder="Search by caplist, PN, OEM, Aircraft Type"
            />
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {approvals.map((approval) => (
          <Card key={approval.authority} className="gap-2">
            <CardHeader className="">
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
              {filteredCapabilities.map((capability, index) => (
                <TableRow
                  key={capability.id}
                  className={index % 2 ? "bg-muted/20" : "bg-background"}
                >
                  <TableCell className="border-b py-4 pr-3 pl-6 font-medium">
                    {capability.rating}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.ata}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.category}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.designation}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.manufacturer}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.aircraftModel}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.pnSeries}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.pn}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 font-medium">
                    {capability.maintenanceReference}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 text-center">
                    {capability.dkSgd ? (
                      <IconCheck className="mx-auto" size={18} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 text-center">
                    {capability.dkBll ? (
                      <IconCheck className="mx-auto" size={18} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="border-b px-3 py-4 text-center">
                    {capability.myKul ? (
                      <IconCheck className="mx-auto" size={18} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="border-b py-4 pr-6 pl-3 font-medium">
                    {capability.referenceNo}
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
