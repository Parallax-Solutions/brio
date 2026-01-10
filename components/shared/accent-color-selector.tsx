"use client"

import * as React from "react"
import { Palette, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/lib/i18n/context"
import { updateAccentColor } from "@/lib/server/profile"

const ACCENT_COLORS = [
  { name: "blue", color: "hsl(221.2 83.2% 53.3%)", label: "Blue" },
  { name: "emerald", color: "hsl(142.1 76.2% 36.3%)", label: "Emerald" },
  { name: "violet", color: "hsl(262.1 83.3% 57.8%)", label: "Violet" },
  { name: "rose", color: "hsl(346.8 77.2% 49.8%)", label: "Rose" },
  { name: "amber", color: "hsl(43.3 96.4% 56.3%)", label: "Amber" },
  { name: "coral", color: "hsl(0 84% 60%)", label: "Coral ✦" },
] as const

type AccentColor = typeof ACCENT_COLORS[number]["name"]

export function AccentColorSelector() {
  const t = useTranslations("navigation")
  // Always initialize with "blue" to avoid hydration mismatch
  const [currentAccent, setCurrentAccent] = React.useState<AccentColor>("blue")

  // Load accent from localStorage after mount (client-side only)
  React.useEffect(() => {
    const stored = localStorage.getItem("accent-color") as AccentColor | null
    if (stored && ACCENT_COLORS.some(c => c.name === stored)) {
      setCurrentAccent(stored)
    }
  }, [])

  const handleAccentChange = async (accent: AccentColor) => {
    // Apply immediately for responsive UX
    setCurrentAccent(accent)
    localStorage.setItem("accent-color", accent)
    document.documentElement.setAttribute("data-accent", accent)
    
    // Save to database in background
    await updateAccentColor({ accentColor: accent })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">{t("accent") || "Accent Color"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ACCENT_COLORS.map((accent) => (
          <DropdownMenuItem
            key={accent.name}
            onClick={() => handleAccentChange(accent.name)}
            className="flex items-center gap-2"
          >
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: accent.color }}
            />
            <span>{accent.label}</span>
            {currentAccent === accent.name && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

