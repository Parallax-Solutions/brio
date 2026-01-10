"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { motion } from "framer-motion"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations, useLocale } from "@/lib/i18n/context"
import { Currency } from "@prisma/client"

export interface ChartDataPoint {
  date: string
  income: number
  expenses: number
}

interface ChartAreaInteractiveProps {
  data?: ChartDataPoint[]
  currency?: Currency
  isLoading?: boolean
}

// Fixed semantic colors for income/expenses - always green/red regardless of accent
const INCOME_COLOR = "hsl(142.1 76.2% 36.3%)"  // Emerald green
const EXPENSE_COLOR = "hsl(346.8 77.2% 49.8%)" // Rose red

const chartConfig = {
  budget: {
    label: "Budget",
  },
  income: {
    label: "Income",
    color: INCOME_COLOR,
  },
  expenses: {
    label: "Expenses",
    color: EXPENSE_COLOR,
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data = [], currency = "CRC", isLoading }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const [timeRange, setTimeRange] = React.useState("6m")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("3m")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    let monthsToShow = 12
    
    if (timeRange === "6m") {
      monthsToShow = 6
    } else if (timeRange === "3m") {
      monthsToShow = 3
    }
    
    return data.slice(-monthsToShow)
  }, [timeRange, data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center px-6 py-4">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
    >
      <Card className="@container/chart transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{t("budgetOverview")}</CardTitle>
          <CardDescription>{t("incomeVsExpenses")}</CardDescription>
        </div>
        <div className="flex items-center px-6 py-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value)
            }}
            variant="outline"
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem
              value="12m"
              className="h-8 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {t("12months")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="6m"
              className="h-8 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {t("6months")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="3m"
              className="h-8 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {t("3months")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} className="stroke-muted" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString(locale === "es" ? "es-CR" : "en-US", {
                  month: "short",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
              width={70}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(locale === "es" ? "es-CR" : "en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => {
                    const label = name === "income" 
                      ? (locale === "es" ? "Ingresos" : "Income")
                      : (locale === "es" ? "Gastos" : "Expenses")
                    return (
                      <span>
                        {label}: {formatCurrency(value as number)}
                      </span>
                    )
                  }}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="expenses"
              type="monotone"
              fill="url(#fillExpenses)"
              stroke="var(--color-expenses)"
              strokeWidth={2}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              dataKey="income"
              type="monotone"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              strokeWidth={2}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
    </motion.div>
  )
}
