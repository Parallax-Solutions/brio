"use client"

import { useState, useTransition, useMemo } from "react"
import { motion } from "framer-motion"
import { Check, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/utils/money"
import { Currency } from "@prisma/client"
import { useTranslations, useLocale } from "@/lib/i18n/context"
import { markPaymentAsPaid, unmarkPaymentAsPaid } from "@/lib/server/recurring-payments"
import { markSubscriptionAsPaid, unmarkSubscriptionAsPaid } from "@/lib/server/subscriptions"
import { toast } from "sonner"
import { PaymentCadence } from "@prisma/client"

interface RecentTransactionsProps {
  expenses: {
    id: string
    description: string
    category: string
    amount: number
    currency: Currency
    date: Date
  }[]
  recurringPayments: {
    id: string
    name: string
    category: string
    amount: number
    currency: Currency
    cadence: PaymentCadence
  }[]
  subscriptions: {
    id: string
    name: string
    amount: number
    currency: Currency
    cadence: PaymentCadence
  }[]
  // Changed from Set to array for serialization between server and client
  paidRecurringIds?: string[]
  paidSubscriptionIds?: string[]
  isLoading?: boolean
}

export function RecentTransactions({
  expenses,
  recurringPayments,
  subscriptions,
  paidRecurringIds = [],
  paidSubscriptionIds = [],
  isLoading,
}: RecentTransactionsProps) {
  const t = useTranslations("dashboard")
  const tExpenses = useTranslations("expenses")
  const tCommon = useTranslations("common")
  const locale = useLocale()
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine all transactions for display
  const allTransactions = [
    ...expenses.map((e) => ({
      id: e.id,
      name: e.description,
      type: "expense" as const,
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      date: e.date,
    })),
  ].slice(0, 10)

  // Count unpaid items
  const unpaidRecurring = recurringPayments.filter(p => !isRecurringPaid(p.id)).length
  const unpaidSubs = subscriptions.filter(s => !isSubPaid(s.id)).length
  const totalUnpaid = unpaidRecurring + unpaidSubs

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{t("recentTransactions")}</CardTitle>
          <CardDescription>
            {t("latestExpenses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
        {allTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("noTransactions")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tExpenses("description")}</TableHead>
                <TableHead>{tExpenses("category")}</TableHead>
                <TableHead>{tExpenses("type")}</TableHead>
                <TableHead>{tExpenses("date")}</TableHead>
                <TableHead className="text-right">{tExpenses("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tExpenses(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.date.toLocaleDateString(locale === "es" ? "es-CR" : "en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(transaction.amount, transaction.currency, locale === "es" ? "es-CR" : "en-US")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {(recurringPayments.length > 0 || subscriptions.length > 0) && (
          <>
            <div className="mt-8 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t("upcomingPaymentsTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("recurringSubscriptionsDue")}
                </p>
              </div>
              {totalUnpaid > 0 && (
                <Badge variant="destructive">
                  {totalUnpaid} {t("unpaid")}
                </Badge>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">{t("status")}</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>{tExpenses("category")}</TableHead>
                  <TableHead>{tExpenses("type")}</TableHead>
                  <TableHead className="text-right">{tExpenses("amount")}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringPayments.map((payment) => {
                  const isPaid = isRecurringPaid(payment.id)
                  return (
                    <TableRow key={payment.id} className={isPaid ? "opacity-60" : ""}>
                      <TableCell>
                        {isPaid ? (
                          <Check className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${isPaid ? "line-through" : ""}`}>
                        {payment.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{tExpenses("recurring")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(payment.amount, payment.currency, locale === "es" ? "es-CR" : "en-US")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isPaid ? "outline" : "default"}
                          disabled={isPending}
                          onClick={() => handleMarkRecurringPaid(payment.id, payment.cadence, payment.amount, payment.currency)}
                        >
                          {isPaid ? t("undo") : t("markPaid")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {subscriptions.map((sub) => {
                  const isPaid = isSubPaid(sub.id)
                  return (
                    <TableRow key={sub.id} className={isPaid ? "opacity-60" : ""}>
                      <TableCell>
                        {isPaid ? (
                          <Check className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${isPaid ? "line-through" : ""}`}>
                        {sub.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tExpenses("subscription")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tExpenses("subscription")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(sub.amount, sub.currency, locale === "es" ? "es-CR" : "en-US")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isPaid ? "outline" : "default"}
                          disabled={isPending}
                          onClick={() => handleMarkSubPaid(sub.id, sub.cadence, sub.amount, sub.currency)}
                        >
                          {isPaid ? t("undo") : t("markPaid")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
