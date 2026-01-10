"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react"
import Link from "next/link"

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
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations, useLocale } from "@/lib/i18n/context"
import { Currency } from "@prisma/client"
import { toDisplayAmount } from "@/lib/utils/money"

interface ProjectionData {
  currentBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  projections: {
    months: number
    balance: number
  }[]
}

interface ChartProjectionsProps {
  data: ProjectionData
  currency?: Currency
  isLoading?: boolean
}

// Fixed semantic colors for positive/negative projections
const POSITIVE_COLOR = "hsl(142.1 76.2% 36.3%)"  // Emerald green
const NEGATIVE_COLOR = "hsl(346.8 77.2% 49.8%)" // Rose red

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartProjections({
  data,
  currency = "CRC",
  isLoading,
}: ChartProjectionsProps) {
  const t = useTranslations("dashboard")
  const tSavings = useTranslations("savings")
  const locale = useLocale()

  const formatCurrency = React.useCallback((value: number) => {
    const displayValue = toDisplayAmount(value, currency)
    return new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(displayValue)
  }, [locale, currency])

  const formatCurrencyFull = React.useCallback((value: number) => {
    const displayValue = toDisplayAmount(value, currency)
    return new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(displayValue)
  }, [locale, currency])

  // Build chart data including current month
  const chartData = React.useMemo(() => {
    const points = [
      {
        month: t("now"),
        balance: data.currentBalance,
        monthsFromNow: 0,
      },
      ...data.projections.map(p => ({
        month: `${p.months}m`,
        balance: p.balance,
        monthsFromNow: p.months,
      })),
    ]
    return points
  }, [data, t])

  const isPositiveNet = data.monthlyNet >= 0
  const hasNoBalance = data.currentBalance === 0

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (hasNoBalance) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        className="col-span-full"
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("financialProjections")}
            </CardTitle>
            <CardDescription>{t("projectionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <Wallet className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              {tSavings("noBalances")}
            </p>
            <Button asChild>
              <Link href="/savings">
                {tSavings("addBalance")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
      className="col-span-full"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("financialProjections")}
            </CardTitle>
            <CardDescription>{t("projectionsDescription")}</CardDescription>
          </div>
          
          {/* Summary Stats */}
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t("currentBalance")}</p>
              <p className="text-lg font-bold">{formatCurrencyFull(data.currentBalance)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t("monthlyNet")}</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${isPositiveNet ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositiveNet ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatCurrencyFull(data.monthlyNet)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositiveNet ? POSITIVE_COLOR : NEGATIVE_COLOR}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositiveNet ? POSITIVE_COLOR : NEGATIVE_COLOR}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} className="stroke-muted" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                width={70}
              />
              <ReferenceLine
                y={toDisplayAmount(data.currentBalance, currency)}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold">{formatCurrencyFull(value as number)}</span>
                    )}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="balance"
                type="monotone"
                fill="url(#fillBalance)"
                stroke={isPositiveNet ? POSITIVE_COLOR : NEGATIVE_COLOR}
                strokeWidth={2}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3 justify-between items-center">
          {/* Projection Badges */}
          <div className="flex flex-wrap gap-2">
            {data.projections.slice(0, 4).map(({ months, balance }) => (
              <Badge
                key={months}
                variant={balance >= data.currentBalance ? "default" : "destructive"}
                className="text-xs"
              >
                {months}m: {formatCurrency(balance)}
              </Badge>
            ))}
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/savings">
              {tSavings("manageSavings")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
