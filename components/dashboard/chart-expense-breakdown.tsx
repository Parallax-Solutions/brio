"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"
import { motion } from "framer-motion"
import { TrendingDown, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations, useLocale } from "@/lib/i18n/context"
import { formatMonth } from "@/lib/utils/dates"
import { Currency } from "@prisma/client"

interface ChartExpenseBreakdownProps {
  recurringTotal: number
  subscriptionsTotal: number
  extraExpensesTotal: number
  currency?: Currency
  isLoading?: boolean
  periodStart?: Date
}

const COLORS = {
  recurring: "hsl(var(--chart-1))",
  subscriptions: "hsl(var(--chart-2))",
  extra: "hsl(var(--chart-3))",
}

export function ChartExpenseBreakdown({
  recurringTotal,
  subscriptionsTotal,
  extraExpensesTotal,
  currency = "CRC",
  isLoading,
  periodStart,
}: ChartExpenseBreakdownProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  // Use the server-provided period start to ensure consistency with data
  const periodDate = periodStart ? new Date(periodStart) : new Date()
  const currentMonth = formatMonth(periodDate, locale === "es" ? "es-CR" : "en-US")

  const totalExpenses = recurringTotal + subscriptionsTotal + extraExpensesTotal

  const chartData = React.useMemo(() => [
    { 
      name: "recurring", 
      value: recurringTotal,
      fill: COLORS.recurring,
    },
    { 
      name: "subscriptions", 
      value: subscriptionsTotal,
      fill: COLORS.subscriptions,
    },
    { 
      name: "extra", 
      value: extraExpensesTotal,
      fill: COLORS.extra,
    },
  ].filter(item => item.value > 0), [recurringTotal, subscriptionsTotal, extraExpensesTotal])

  const chartConfig: ChartConfig = {
    value: {
      label: t("expenses"),
    },
    recurring: {
      label: t("recurringExpenses"),
      color: COLORS.recurring,
    },
    subscriptions: {
      label: t("subscriptionsExpenses"),
      color: COLORS.subscriptions,
    },
    extra: {
      label: t("extraExpenses"),
      color: COLORS.extra,
    },
  }

  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [locale, currency])

  // Compact format for inside the donut (symbol + abbreviated number)
  const formatCompact = React.useCallback((value: number) => {
    const symbol = currency === "CRC" ? "₡" : currency === "USD" ? "$" : "C$"
    if (value >= 1000000) {
      return `${symbol}${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${symbol}${(value / 1000).toFixed(0)}K`
    }
    return `${symbol}${value}`
  }, [currency])

  // Find the largest expense category
  const largestCategory = chartData.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current, { name: "", value: 0 })
  
  const largestPercentage = totalExpenses > 0 
    ? Math.round((largestCategory.value / totalExpenses) * 100) 
    : 0

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <Skeleton className="mx-auto aspect-square h-[200px] rounded-full" />
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    )
  }

  if (totalExpenses === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-base">{t("expenseBreakdown")}</CardTitle>
            <CardDescription className="capitalize">{currentMonth}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pb-0">
            <div className="text-center text-muted-foreground py-8">
              <TrendingUp className="mx-auto h-8 w-8 mb-2 text-emerald-500" />
              <p className="text-sm">{t("noExpensesYet")}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
    >
      <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-base">{t("expenseBreakdown")}</CardTitle>
          <CardDescription className="capitalize">{currentMonth}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 px-2 sm:px-6">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[180px] sm:max-h-[200px]"
          >
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => {
                      const label = chartConfig[name as keyof typeof chartConfig]?.label || name
                      return (
                        <span className="flex items-center gap-2">
                          <span>{label}:</span>
                          <span className="font-semibold">{formatCurrency(value as number)}</span>
                        </span>
                      )
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={65}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 4}
                            className="fill-foreground text-sm font-bold"
                          >
                            {formatCompact(totalExpenses)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 10}
                            className="fill-muted-foreground text-[9px]"
                          >
                            {t("total")}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="flex-wrap justify-center gap-x-3 gap-y-1 text-xs"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm pt-2">
          <div className="flex items-center gap-2 font-medium leading-none text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            {t("largestExpense")}: {chartConfig[largestCategory.name as keyof typeof chartConfig]?.label} ({largestPercentage}%)
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
