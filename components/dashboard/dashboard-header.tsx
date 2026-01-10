"use client"

import { motion } from "framer-motion"
import { useTranslations } from "@/lib/i18n/context"

export function DashboardHeader() {
  const t = useTranslations("dashboard")
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">
        {t("overview")}
      </p>
    </motion.div>
  )
}
