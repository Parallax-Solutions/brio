"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, Wallet } from "lucide-react"

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
import { Currency } from "@prisma/client"

interface IncomeSource {
  id: string
  name: string
  amount: number
  currency: Currency
}

interface ChartIncomeSourcesProps {
  incomes: IncomeSource[]
  totalIncome: number
  currency?: Currency
  isLoading?: boolean
}

// Vibrant color palette for multiple income sources
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
]

export function ChartIncomeSources({
  incomes,
  totalIncome,
  currency = "CRC",
  isLoading,
}: ChartIncomeSourcesProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()

  const chartData = React.useMemo(() => 
    incomes.map((income, index) => ({
      name: income.name,
      value: income.amount,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    })).filter(item => item.value > 0)
  , [incomes])

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      value: {
        label: t("income"),
      },
    }
    
    incomes.forEach((income, index) => {
      config[income.name] = {
        label: income.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    
    return config
  }, [incomes, t])

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

  // Find primary income source (largest)
  const primarySource = chartData.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current, { name: "", value: 0 })
  
  const primaryPercentage = totalIncome > 0 
    ? Math.round((primarySource.value / totalIncome) * 100) 
    : 0

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-44 mt-1" />
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

  if (totalIncome === 0 || incomes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      >
        <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-base">{t("incomeSources")}</CardTitle>
            <CardDescription>{t("activeIncome")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pb-0">
            <div className="text-center text-muted-foreground py-8">
              <Wallet className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t("noIncomeYet")}</p>
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
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
    >
      <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-base">{t("incomeSources")}</CardTitle>
          <CardDescription>{t("activeIncome")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => {
                      return (
                        <span className="flex items-center gap-2">
                          <span>{name}:</span>
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
                innerRadius={50}
                outerRadius={80}
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
                            y={(viewBox.cy || 0) - 6}
                            className="fill-foreground text-base font-bold"
                          >
                            {formatCompact(totalIncome)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 12}
                            className="fill-muted-foreground text-[10px]"
                          >
                            {t("monthly")}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm pt-2">
          <div className="flex items-center gap-2 font-medium leading-none text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {t("primarySource")}: {primarySource.name} ({primaryPercentage}%)
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
