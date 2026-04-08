"use client"

import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

type ThemeToggleButtonProps = {
  className?: string
  showLabel?: boolean
}

export function ThemeToggleButton({
  className,
  showLabel = false,
}: ThemeToggleButtonProps) {
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <IconMoon size={18} className="block dark:hidden" />
      <IconSun size={18} className="hidden dark:block" />
      {showLabel ? (
        <span className="ml-2 text-sm font-medium text-foreground">
          Toggle theme
        </span>
      ) : null}
    </button>
  )
}
