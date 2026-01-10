"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useTranslations } from "@/lib/i18n/context"

interface ConversionWarning {
  from: string
  to: string
  type: 'missing' | 'chain'
  chain?: string[]
}

interface ConversionWarningsProps {
  warnings: ConversionWarning[]
}

export function ConversionWarnings({ warnings }: ConversionWarningsProps) {
  const t = useTranslations("dashboard")

  useEffect(() => {
    // Only collect missing rate warnings (chain conversions work silently)
    const missingRates: string[] = []

    for (const warning of warnings) {
      if (warning.type === 'missing') {
        missingRates.push(`${warning.from} → ${warning.to}`)
      }
      // Chain conversions are handled silently - no toast needed
    }

    // Show missing rate warnings only
    if (missingRates.length > 0) {
      const uniqueMissing = [...new Set(missingRates)]
      toast.warning(t("missingRates"), {
        description: uniqueMissing.join(', '),
        duration: 8000,
      })
    }
  }, [warnings, t])

  return null
}
