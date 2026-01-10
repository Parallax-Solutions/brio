"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getCurrencyDisplay, toDisplayAmount } from "@/lib/utils/money"
import { Currency } from "@prisma/client"

const formSchema = z.object({
  currency: z.enum(["CRC", "USD", "CAD"]),
  amount: z.string().min(1),
  accountType: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BalanceData {
  id: string
  currency: Currency
  amount: number
  accountType: string | null
  notes: string | null
}

interface SavingsFormProps {
  initialData?: BalanceData
  onSubmit: (data: { currency: Currency; amount: number; accountType: string; notes?: string }) => Promise<void>
  onCancel: () => void
}

const ACCOUNT_TYPES = [
  { value: "checking", labelKey: "checking" },
  { value: "savings", labelKey: "savingsAccount" },
  { value: "cash", labelKey: "cash" },
  { value: "investment", labelKey: "investment" },
  { value: "crypto", labelKey: "crypto" },
  { value: "other", labelKey: "other" },
]

export function SavingsForm({ initialData, onSubmit, onCancel }: SavingsFormProps) {
  const t = useTranslations("savings")
  const tCommon = useTranslations("common")

  const getDisplayAmount = (amount: number, currency: Currency): string => {
    if (!amount) return ""
    const displayAmount = toDisplayAmount(amount, currency)
    return displayAmount.toLocaleString("es-CR", { maximumFractionDigits: 2 })
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: initialData?.currency || "CRC",
      amount: initialData ? getDisplayAmount(initialData.amount, initialData.currency) : "",
      accountType: initialData?.accountType || "",
      notes: initialData?.notes || "",
    },
  })

  const handleSubmit = async (values: FormValues) => {
    const amount = parseFloat(values.amount.replace(/[^\d.-]/g, ""))
    await onSubmit({
      currency: values.currency as Currency,
      amount,
      accountType: values.accountType,
      notes: values.notes,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("accountType")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectAccountType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(type.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon("currency")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["CRC", "USD", "CAD"] as const).map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {getCurrencyDisplay(currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon("amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tCommon("notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("notesPlaceholder")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit">
            {initialData ? tCommon("update") : tCommon("add")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
