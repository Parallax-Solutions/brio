"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { TrendingDownIcon, TrendingUpIcon, MinusIcon, Calendar, DollarSign, ArrowRight, Wallet, CreditCard, Repeat, Check, Circle } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatMoney } from "@/lib/utils/money"
import { Currency, IncomeCadence, PaymentCadence } from "@prisma/client"
import { useTranslations } from "@/lib/i18n/context"
import { markPaymentAsPaid, unmarkPaymentAsPaid } from "@/lib/server/recurring-payments"
import { markSubscriptionAsPaid, unmarkSubscriptionAsPaid } from "@/lib/server/subscriptions"
import { toast } from "sonner"

interface Income {
  id: string
  name: string
  amount: number
  currency: Currency
  cadence: IncomeCadence
  owner: string | null
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  currency: Currency
  date: Date
}

interface RecurringPayment {
  id: string
  name: string
  category: string
  amount: number
  currency: Currency
  cadence: PaymentCadence
  dueDay: number | null
}

interface Subscription {
  id: string
  name: string
  amount: number
  currency: Currency
  cadence: PaymentCadence
}

interface BudgetCardsProps {
  totalIncome: number
  totalExpenses: number
  remainingBudget: number
  upcomingPayments: number
  paidPaymentsCount?: number
  currency?: Currency
  isLoading?: boolean
  // Detailed data for modals
  incomes?: Income[]
  expenses?: Expense[]
  recurringPayments?: RecurringPayment[]
  subscriptions?: Subscription[]
  // Converted totals for expense breakdown (in base currency)
  extraExpensesTotal?: number
  recurringTotal?: number
  subscriptionsTotal?: number
  // Payment status - arrays for serialization between server and client
  paidRecurringIds?: string[]
  paidSubscriptionIds?: string[]
}

type ModalType = "income" | "expenses" | "budget" | "payments" | null

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
}

const numberVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.2,
      duration: 0.3,
    },
  },
}

export function BudgetCards({
  totalIncome,
  totalExpenses,
  remainingBudget,
  upcomingPayments,
  paidPaymentsCount = 0,
  currency = "CRC",
  isLoading,
  incomes = [],
  expenses = [],
  recurringPayments = [],
  subscriptions = [],
  extraExpensesTotal = 0,
  recurringTotal = 0,
  subscriptionsTotal = 0,
  paidRecurringIds = [],
  paidSubscriptionIds = [],
}: BudgetCardsProps) {
  const t = useTranslations("dashboard")
  const tIncome = useTranslations("income")
  const tRecurring = useTranslations("recurring")
  const tCommon = useTranslations("common")
  
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [isPending, startTransition] = useTransition()
  
  // Convert arrays to Sets - memoized for performance
  const serverPaidRecurring = useMemo(() => new Set(paidRecurringIds), [paidRecurringIds])
  const serverPaidSubs = useMemo(() => new Set(paidSubscriptionIds), [paidSubscriptionIds])
  
  // Track only local overrides for optimistic updates (added or removed)
  const [localOverridesRecurring, setLocalOverridesRecurring] = useState<Map<string, boolean>>(new Map())
  const [localOverridesSubs, setLocalOverridesSubs] = useState<Map<string, boolean>>(new Map())
  
  // Compute effective paid state by combining server state with local overrides
  const isRecurringPaid = (id: string) => {
    if (localOverridesRecurring.has(id)) {
      return localOverridesRecurring.get(id)!
    }
    return serverPaidRecurring.has(id)
  }
  
  const isSubPaid = (id: string) => {
    if (localOverridesSubs.has(id)) {
      return localOverridesSubs.get(id)!
    }
    return serverPaidSubs.has(id)
  }
  
  const handleMarkRecurringPaid = async (paymentId: string, cadence: PaymentCadence, amount: number, currency: Currency) => {
    const isPaid = isRecurringPaid(paymentId)
    
    // Optimistic update - set local override
    setLocalOverridesRecurring(prev => {
      const next = new Map(prev)
      next.set(paymentId, !isPaid)
      return next
    })
    
    startTransition(async () => {
      try {
        const result = isPaid 
          ? await unmarkPaymentAsPaid(paymentId, cadence)
          : await markPaymentAsPaid(paymentId, cadence, amount, currency)
        
        if (!result.success) {
          // Revert on error - remove the override
          setLocalOverridesRecurring(prev => {
            const next = new Map(prev)
            next.delete(paymentId)
            return next
          })
          toast.error(result.error)
        } else {
          // Clear override since server is now in sync
          setLocalOverridesRecurring(prev => {
            const next = new Map(prev)
            next.delete(paymentId)
            return next
          })
          toast.success(isPaid ? t("markedUnpaid") : t("markedPaid"))
        }
      } catch {
        toast.error(tCommon("error"))
      }
    })
  }

  const handleMarkSubPaid = async (subId: string, cadence: PaymentCadence, amount: number, currency: Currency) => {
    const isPaid = isSubPaid(subId)
    
    // Optimistic update - set local override
    setLocalOverridesSubs(prev => {
      const next = new Map(prev)
      next.set(subId, !isPaid)
      return next
    })
    
    startTransition(async () => {
      try {
        const result = isPaid 
          ? await unmarkSubscriptionAsPaid(subId, cadence)
          : await markSubscriptionAsPaid(subId, cadence, amount, currency)
        
        if (!result.success) {
          // Revert on error - remove the override
          setLocalOverridesSubs(prev => {
            const next = new Map(prev)
            next.delete(subId)
            return next
          })
          toast.error(result.error)
        } else {
          // Clear override since server is now in sync
          setLocalOverridesSubs(prev => {
            const next = new Map(prev)
            next.delete(subId)
            return next
          })
          toast.success(isPaid ? t("markedUnpaid") : t("markedPaid"))
        }
      } catch {
        toast.error(tCommon("error"))
      }
    })
  }
  
  const budgetPercentage = totalIncome > 0 
    ? Math.round((remainingBudget / totalIncome) * 100) 
    : 0
  
  const spentPercentage = totalIncome > 0
    ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
    : 0
  
  const isPositiveBudget = remainingBudget >= 0
  
  // Use the converted totals passed from dashboard (already in base currency)
  const totalRecurring = recurringTotal
  const totalSubscriptions = subscriptionsTotal

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
        {[...Array(4)].map((_, i) => (
          <Card key={i} data-slot="card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards: Array<{
    id: ModalType
    title: string
    value: string
    badge: { icon: typeof TrendingUpIcon; text: string; className: string }
    description: string
    subDescription: string
    valueClassName: string
  }> = [
    {
      id: "income",
      title: t("totalIncome"),
      value: formatMoney(totalIncome, currency),
      badge: { icon: TrendingUpIcon, text: t("monthly"), className: "" },
      description: t("expectedIncome"),
      subDescription: t("allIncomesCombined"),
      valueClassName: "",
    },
    {
      id: "expenses",
      title: t("totalExpenses"),
      value: formatMoney(totalExpenses, currency),
      badge: { icon: TrendingDownIcon, text: t("spending"), className: "text-rose-600" },
      description: t("totalSpent"),
      subDescription: t("allExpensesCombined"),
      valueClassName: "",
    },
    {
      id: "budget",
      title: t("remainingBudget"),
      value: formatMoney(Math.abs(remainingBudget), currency),
      badge: { 
        icon: isPositiveBudget ? TrendingUpIcon : TrendingDownIcon, 
        text: isPositiveBudget ? `${budgetPercentage}% ${t("left")}` : t("overBudget"),
        className: isPositiveBudget ? "text-emerald-600" : "text-rose-600"
      },
      description: isPositiveBudget ? t("availableToSpend") : t("overBudget"),
      subDescription: t("incomeMinusExpenses"),
      valueClassName: isPositiveBudget ? "text-emerald-600" : "text-rose-600",
    },
    {
      id: "payments",
      title: t("upcomingPayments"),
      value: `${paidPaymentsCount}/${upcomingPayments}`,
      badge: { 
        icon: paidPaymentsCount === upcomingPayments ? TrendingUpIcon : MinusIcon, 
        text: paidPaymentsCount === upcomingPayments ? t("allPaid") : t("dueSoon"), 
        className: paidPaymentsCount === upcomingPayments ? "text-emerald-600" : "text-amber-600" 
      },
      description: t("paymentsDue"),
      subDescription: t("recurringPlusSubscriptions"),
      valueClassName: paidPaymentsCount === upcomingPayments ? "text-emerald-600" : "",
    },
  ]

  return (
    <>
      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.02, 
              transition: { duration: 0.2 } 
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOpenModal(card.id)}
          >
            <Card data-slot="card" className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 rounded-lg text-xs ${card.badge.className}`}
                >
                  <card.badge.icon className="h-3 w-3" />
                  {card.badge.text}
                </Badge>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className={`text-2xl font-bold ${card.valueClassName}`}
                  variants={numberVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {card.value}
                </motion.div>
                <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <span className={card.valueClassName || "text-primary"}>{card.description}</span>
                </p>
                <p className="text-muted-foreground text-xs">{card.subDescription}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Income Details Modal */}
      <Dialog open={openModal === "income"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              {t("incomeDetails")}
            </DialogTitle>
            <DialogDescription>{t("incomeBreakdown")}</DialogDescription>
          </DialogHeader>
          
          {incomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">{t("noIncomeData")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomes.slice(0, 4).map((income) => (
                <div key={income.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUpIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{income.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tIncome(income.cadence.toLowerCase())} {income.owner && `• ${income.owner}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatMoney(income.amount, income.currency)}
                  </span>
                </div>
              ))}
              {incomes.length > 4 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{incomes.length - 4} {t("more")}
                </p>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">{t("totalIncome")}</span>
            <span className="text-2xl font-bold text-primary">{formatMoney(totalIncome, currency)}</span>
          </div>
          
          <Button asChild className="w-full" onClick={() => setOpenModal(null)}>
            <Link href="/income" className="flex items-center justify-center gap-2">
              {t("seeAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Expenses Details Modal */}
      <Dialog open={openModal === "expenses"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                <TrendingDownIcon className="h-4 w-4 text-rose-500" />
              </div>
              {t("expensesDetails")}
            </DialogTitle>
            <DialogDescription>{t("expensesBreakdown")}</DialogDescription>
          </DialogHeader>
          
          {/* Expense Categories Breakdown - Clickable */}
          <div className="space-y-3">
            {/* Recurring Payments */}
            <Link 
              href="/recurring" 
              onClick={() => setOpenModal(null)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
                  <Repeat className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{tRecurring("title")}</p>
                  <p className="text-xs text-muted-foreground">{recurringPayments.length} {t("payments")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-600">
                  {formatMoney(totalRecurring, currency)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
            
            {/* Subscriptions */}
            <Link 
              href="/subscriptions" 
              onClick={() => setOpenModal(null)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{t("subscriptionsTitle")}</p>
                  <p className="text-xs text-muted-foreground">{subscriptions.length} {t("active")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-600">
                  {formatMoney(totalSubscriptions, currency)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
            
            {/* Extra Expenses */}
            <Link 
              href="/expenses" 
              onClick={() => setOpenModal(null)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
                  <TrendingDownIcon className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{t("extraExpenses")}</p>
                  <p className="text-xs text-muted-foreground">{expenses.length} {t("thisMonth")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-600">
                  {formatMoney(extraExpensesTotal, currency)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("spent")}</span>
              <span>{spentPercentage}% {t("ofIncome")}</span>
            </div>
            <Progress value={spentPercentage} className="h-2" />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">{t("totalExpenses")}</span>
            <span className="text-2xl font-bold text-rose-600">{formatMoney(totalExpenses, currency)}</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Breakdown Modal */}
      <Dialog open={openModal === "budget"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositiveBudget ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                <Wallet className={`h-4 w-4 ${isPositiveBudget ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
              {t("budgetDetails")}
            </DialogTitle>
            <DialogDescription>{t("budgetBreakdown")}</DialogDescription>
          </DialogHeader>
          
          {/* Visual Budget Indicator */}
          <div className="flex flex-col items-center py-4">
            <div className={`text-4xl font-bold ${isPositiveBudget ? "text-emerald-600" : "text-rose-600"}`}>
              {isPositiveBudget ? "" : "-"}{formatMoney(Math.abs(remainingBudget), currency)}
            </div>
            <Badge 
              variant="secondary" 
              className={`mt-2 ${isPositiveBudget ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"}`}
            >
              {budgetPercentage}% {isPositiveBudget ? t("budgetRemaining") : t("overBudget")}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("spent")}</span>
              <span className="font-medium">{formatMoney(totalExpenses, currency)}</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${isPositiveBudget ? "bg-primary" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, spentPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("budget")}</span>
              <span className="font-medium">{formatMoney(totalIncome, currency)}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <TrendingUpIcon className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">{t("income")}</p>
              <p className="font-semibold text-sm">{formatMoney(totalIncome, currency)}</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/5 text-center">
              <TrendingDownIcon className="h-4 w-4 mx-auto text-rose-500 mb-1" />
              <p className="text-xs text-muted-foreground">{t("expenses")}</p>
              <p className="font-semibold text-sm text-rose-600">{formatMoney(totalExpenses, currency)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcoming Payments Modal */}
      <Dialog open={openModal === "payments"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              {t("paymentsDetails")}
            </DialogTitle>
            <DialogDescription>{t("paymentsBreakdown")}</DialogDescription>
          </DialogHeader>
          
          {recurringPayments.length === 0 && subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">{t("noPaymentsData")}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Status Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">{t("paid")}</span>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                  {recurringPayments.filter(p => isRecurringPaid(p.id)).length + 
                   subscriptions.filter(s => isSubPaid(s.id)).length} / {upcomingPayments}
                </Badge>
              </div>
              
              {/* Recurring Payments Section */}
              {recurringPayments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{tRecurring("title")}</span>
                  </div>
                  <div className="space-y-2">
                    {recurringPayments.slice(0, 5).map((payment) => {
                      const isPaid = isRecurringPaid(payment.id)
                      return (
                        <div 
                          key={payment.id} 
                          className={`flex items-center justify-between p-2 rounded-lg border ${isPaid ? "bg-muted/30 opacity-70" : "bg-card"}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              onClick={() => handleMarkRecurringPaid(payment.id, payment.cadence, payment.amount, payment.currency)}
                              disabled={isPending}
                              className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                            >
                              {isPaid ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <span className={`text-sm truncate ${isPaid ? "line-through text-muted-foreground" : ""}`}>
                              {payment.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-medium">
                              {formatMoney(payment.amount, payment.currency)}
                            </span>
                            <Button
                              size="sm"
                              variant={isPaid ? "ghost" : "outline"}
                              className="h-7 text-xs"
                              disabled={isPending}
                              onClick={() => handleMarkRecurringPaid(payment.id, payment.cadence, payment.amount, payment.currency)}
                            >
                              {isPaid ? t("undo") : t("markPaid")}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {recurringPayments.length > 5 && (
                      <Link 
                        href="/recurring" 
                        onClick={() => setOpenModal(null)}
                        className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        +{recurringPayments.length - 5} {t("more")}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
              
              {/* Subscriptions Section */}
              {subscriptions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{t("subscriptionsTitle")}</span>
                  </div>
                  <div className="space-y-2">
                    {subscriptions.slice(0, 5).map((sub) => {
                      const isPaid = isSubPaid(sub.id)
                      return (
                        <div 
                          key={sub.id} 
                          className={`flex items-center justify-between p-2 rounded-lg border ${isPaid ? "bg-muted/30 opacity-70" : "bg-card"}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              onClick={() => handleMarkSubPaid(sub.id, sub.cadence, sub.amount, sub.currency)}
                              disabled={isPending}
                              className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                            >
                              {isPaid ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <span className={`text-sm truncate ${isPaid ? "line-through text-muted-foreground" : ""}`}>
                              {sub.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-medium">
                              {formatMoney(sub.amount, sub.currency)}
                            </span>
                            <Button
                              size="sm"
                              variant={isPaid ? "ghost" : "outline"}
                              className="h-7 text-xs"
                              disabled={isPending}
                              onClick={() => handleMarkSubPaid(sub.id, sub.cadence, sub.amount, sub.currency)}
                            >
                              {isPaid ? t("undo") : t("markPaid")}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {subscriptions.length > 5 && (
                      <Link 
                        href="/subscriptions" 
                        onClick={() => setOpenModal(null)}
                        className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        +{subscriptions.length - 5} {t("more")}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t("totalUpcoming")}</span>
              <p className="text-xs text-muted-foreground">
                {recurringPayments.filter(p => !isRecurringPaid(p.id)).length + 
                 subscriptions.filter(s => !isSubPaid(s.id)).length} {t("unpaid")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" onClick={() => setOpenModal(null)}>
                <Link href="/recurring">
                  {tRecurring("title")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" onClick={() => setOpenModal(null)}>
                <Link href="/subscriptions">
                  {t("subscriptionsTitle")}
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
